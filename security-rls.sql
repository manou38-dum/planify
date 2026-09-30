-- Planify : accès par liens d'invitation et jetons d'organisateur.
-- À exécuter dans Supabase SQL Editor après security-add-owner-token.sql puis scripts/claim-existing-events.mjs.
-- La migration est atomique : les anciennes politiques publiques disparaissent avec les nouvelles.

create or replace function public.planify_header(header_name text)
returns text language sql stable as $$
  select coalesce(current_setting('request.headers', true), '{}')::json ->> lower(header_name)
$$;

create or replace function public.planify_token_hash(token text)
returns text language sql immutable strict as $$
  select encode(digest(token, 'sha256'), 'hex')
$$;

create or replace function public.planify_is_owner(token_hash text)
returns boolean language sql stable as $$
  select token_hash is not null and token_hash = public.planify_token_hash(public.planify_header('x-planify-organizer-token'))
$$;

create or replace function public.planify_has_event_access(event_uuid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.events e
    where e.id = event_uuid
      and (
        e.invite_link_id = public.planify_header('x-planify-invite-link')
        or public.planify_is_owner(e.organizer_token_hash)
      )
  )
$$;

create or replace function public.planify_owns_event(event_uuid uuid)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.events e
    where e.id = event_uuid and public.planify_is_owner(e.organizer_token_hash)
  )
$$;

-- Supprime toutes les politiques existantes, y compris celles créées via le tableau Supabase.
do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename = any (array['events', 'participants', 'items', 'lists', 'slots', 'slot_signups', 'carpool', 'checklist_validations'])
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- Les permissions SQL sont explicites ; les politiques ci-dessous limitent ensuite les lignes.
revoke all on public.events, public.participants, public.items, public.lists, public.slots, public.slot_signups, public.carpool, public.checklist_validations from anon, authenticated;
grant select, insert, update, delete on public.events, public.participants, public.items, public.lists, public.slots, public.slot_signups, public.carpool, public.checklist_validations to anon, authenticated;

alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.items enable row level security;
alter table public.lists enable row level security;
alter table public.slots enable row level security;
alter table public.slot_signups enable row level security;
alter table public.carpool enable row level security;
alter table public.checklist_validations enable row level security;

-- Événements : seule la personne qui crée avec son propre jeton peut ensuite administrer.
create policy "event visible by invitation or owner" on public.events for select to anon, authenticated
  using (invite_link_id = public.planify_header('x-planify-invite-link') or public.planify_is_owner(organizer_token_hash));
create policy "event created with owner token" on public.events for insert to anon, authenticated
  with check (public.planify_is_owner(organizer_token_hash));
create policy "event changed by owner" on public.events for update to anon, authenticated
  using (public.planify_is_owner(organizer_token_hash)) with check (public.planify_is_owner(organizer_token_hash));
create policy "event deleted by owner" on public.events for delete to anon, authenticated
  using (public.planify_is_owner(organizer_token_hash));

-- Les invités peuvent répondre et réserver depuis leur lien ; l'organisateur garde tous les droits sur son événement.
create policy "participants visible for event access" on public.participants for select to anon, authenticated using (public.planify_has_event_access(event_id));
create policy "participants added through invitation" on public.participants for insert to anon, authenticated with check (public.planify_has_event_access(event_id));
create policy "participants updated through invitation" on public.participants for update to anon, authenticated using (public.planify_has_event_access(event_id)) with check (public.planify_has_event_access(event_id));
create policy "participants deleted by owner" on public.participants for delete to anon, authenticated using (public.planify_owns_event(event_id));

create policy "items visible for event access" on public.items for select to anon, authenticated using (public.planify_has_event_access(event_id));
create policy "items added for event access" on public.items for insert to anon, authenticated with check (public.planify_has_event_access(event_id));
create policy "items updated for event access" on public.items for update to anon, authenticated using (public.planify_has_event_access(event_id)) with check (public.planify_has_event_access(event_id));
create policy "items deleted by owner" on public.items for delete to anon, authenticated using (public.planify_owns_event(event_id));

create policy "lists visible for event access" on public.lists for select to anon, authenticated using (public.planify_has_event_access(event_id));
create policy "lists changed by owner" on public.lists for all to anon, authenticated using (public.planify_owns_event(event_id)) with check (public.planify_owns_event(event_id));

create policy "slots visible for event access" on public.slots for select to anon, authenticated using (public.planify_has_event_access(event_id));
create policy "slots changed by owner" on public.slots for all to anon, authenticated using (public.planify_owns_event(event_id)) with check (public.planify_owns_event(event_id));

create policy "signups visible for event access" on public.slot_signups for select to anon, authenticated using (exists (select 1 from public.slots s where s.id = slot_id and public.planify_has_event_access(s.event_id)));
create policy "signups added through invitation" on public.slot_signups for insert to anon, authenticated with check (exists (select 1 from public.slots s where s.id = slot_id and public.planify_has_event_access(s.event_id)));
create policy "signups removed through invitation" on public.slot_signups for delete to anon, authenticated using (exists (select 1 from public.slots s where s.id = slot_id and public.planify_has_event_access(s.event_id)));

create policy "carpool visible for event access" on public.carpool for select to anon, authenticated using (public.planify_has_event_access(event_id));
create policy "carpool added through invitation" on public.carpool for insert to anon, authenticated with check (public.planify_has_event_access(event_id));
create policy "carpool changed by owner" on public.carpool for update to anon, authenticated using (public.planify_owns_event(event_id)) with check (public.planify_owns_event(event_id));
create policy "carpool deleted by owner" on public.carpool for delete to anon, authenticated using (public.planify_owns_event(event_id));

create policy "checklist visible for event access" on public.checklist_validations for select to anon, authenticated using (exists (select 1 from public.items i where i.id = item_id and public.planify_has_event_access(i.event_id)));
create policy "checklist added through invitation" on public.checklist_validations for insert to anon, authenticated with check (exists (select 1 from public.items i where i.id = item_id and public.planify_has_event_access(i.event_id)));
create policy "checklist removed through invitation" on public.checklist_validations for delete to anon, authenticated using (exists (select 1 from public.items i where i.id = item_id and public.planify_has_event_access(i.event_id)));
