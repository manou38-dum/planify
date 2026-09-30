-- ============================================
-- PLANIFY V1 — Schema Supabase
-- Coller dans Supabase > SQL Editor > New Query > Run
-- ============================================

-- 1. EVENTS
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'BBQ',
  date TIMESTAMPTZ NOT NULL,
  location TEXT,
  nb_participants INTEGER DEFAULT 20,
  deadline_rsvp TIMESTAMPTZ,
  organizer_name TEXT NOT NULL,
  invite_link_id TEXT UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  status TEXT DEFAULT 'Actif',
  organizer_token_hash TEXT,
  event_options JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 1b. LISTS (regroupement d'items par comportement : apport | checklist | cadeau)
CREATE TABLE lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  behavior TEXT NOT NULL DEFAULT 'apport',
  list_name TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. PARTICIPANTS
CREATE TABLE participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  participant_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  rsvp_status TEXT DEFAULT 'En attente',
  nb_personnes INTEGER DEFAULT 1,
  restriction_alimentaire TEXT,
  commentaire TEXT,
  date_reponse TIMESTAMPTZ DEFAULT now()
);

-- 3. ITEMS (apports)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  category TEXT DEFAULT 'Nourriture',
  quantity NUMERIC,
  unit TEXT,
  estimated_price NUMERIC,
  assigned_to TEXT,
  assigned_participant_id UUID REFERENCES participants(id),
  status TEXT DEFAULT 'Disponible',
  list_id UUID REFERENCES lists(id) ON DELETE CASCADE,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3b. CHECKLIST_VALIDATIONS (un participant coche un item de checklist)
CREATE TABLE checklist_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  participant_id UUID REFERENCES participants(id) ON DELETE CASCADE,
  is_validated BOOLEAN DEFAULT true,
  validated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. SLOTS (créneaux récurrents)
CREATE TABLE slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  slot_name TEXT NOT NULL,
  slot_date TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  max_participants INTEGER DEFAULT 4,
  current_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Disponible'
);

-- INDEX pour performance
CREATE INDEX idx_participants_event ON participants(event_id);
CREATE INDEX idx_items_event ON items(event_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_slots_event ON slots(event_id);
CREATE INDEX idx_events_invite ON events(invite_link_id);

CREATE INDEX idx_lists_event ON lists(event_id);
CREATE INDEX idx_items_list ON items(list_id);

-- ACTIVER Row Level Security. Les politiques sûres sont dans security-rls.sql :
-- exécute ce fichier juste après celui-ci dans Supabase SQL Editor.
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_validations ENABLE ROW LEVEL SECURITY;

-- Policies : tout public pour la V1 (on ajoutera l'auth plus tard)
-- Ne crée jamais de politiques `USING (true)` sur ces tables : elles exposeraient
-- tous les événements via la clé publique. Voir security-rls.sql.
