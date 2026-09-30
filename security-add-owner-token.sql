-- Étape 1 de la reprise des événements existants.
-- Exécuter dans Supabase SQL Editor, puis lancer scripts/claim-existing-events.mjs,
-- puis seulement security-rls.sql.
create extension if not exists pgcrypto;
alter table public.events add column if not exists organizer_token_hash text;
create index if not exists idx_events_organizer_token_hash on public.events (organizer_token_hash) where organizer_token_hash is not null;
