-- Migration: financer settings support
-- Run this in the Supabase SQL editor

-- 1. Institution profile extra fields
ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS website       text,
  ADD COLUMN IF NOT EXISTS contact_name  text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS description   text;

-- 2. Matching criteria columns
ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS min_score          int     DEFAULT 650,
  ADD COLUMN IF NOT EXISTS min_data_months    int     DEFAULT 6,
  ADD COLUMN IF NOT EXISTS max_exposure       bigint,
  ADD COLUMN IF NOT EXISTS target_sectors     text[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS capital_categories text[]  DEFAULT '{}';

-- 3. Workflow config
ALTER TABLE institutions
  ADD COLUMN IF NOT EXISTS workflow_config jsonb DEFAULT '{}';

-- 4. Invitations table
CREATE TABLE IF NOT EXISTS institution_invitations (
  invitation_id  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id text        NOT NULL,
  email          text        NOT NULL,
  role           text        NOT NULL,
  invited_by     uuid        NOT NULL,
  token          text        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  accepted_at    timestamptz,
  expires_at     timestamptz NOT NULL DEFAULT now() + interval '7 days',
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE institution_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY inst_invite_owner ON institution_invitations
  FOR ALL TO authenticated
  USING (invited_by = auth.uid());

-- 5. Institution members table
CREATE TABLE IF NOT EXISTS institution_members (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  text        NOT NULL,
  user_id         uuid        NOT NULL,
  full_name       text,
  email           text,
  role            text        NOT NULL DEFAULT 'analyst'
                              CHECK (role IN ('owner','admin','team_lead','analyst')),
  team_lead_id    uuid,
  is_active       boolean     NOT NULL DEFAULT true,
  workflow_override jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_inst_members_institution ON institution_members (institution_id);
CREATE INDEX IF NOT EXISTS idx_inst_members_user ON institution_members (user_id);

ALTER TABLE institution_members ENABLE ROW LEVEL SECURITY;

-- Members can read members of their own institution
DROP POLICY IF EXISTS inst_members_read ON institution_members;
CREATE POLICY inst_members_read ON institution_members
  FOR SELECT TO authenticated
  USING (
    institution_id IN (
      SELECT institution_id FROM institutions WHERE owner_id = auth.uid()
      UNION
      SELECT institution_id FROM institution_members im2 WHERE im2.user_id = auth.uid()
    )
  );

-- Owner/admin can insert and update
DROP POLICY IF EXISTS inst_members_write ON institution_members;
CREATE POLICY inst_members_write ON institution_members
  FOR ALL TO authenticated
  USING (
    institution_id IN (
      SELECT institution_id FROM institutions WHERE owner_id = auth.uid()
    )
  );

-- 6. Auto-seed owner as member when institution is created
CREATE OR REPLACE FUNCTION seed_institution_owner_member()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $
DECLARE
  _email text;
  _name  text;
BEGIN
  SELECT email, COALESCE(raw_user_meta_data->>'full_name', email)
    INTO _email, _name
    FROM auth.users
    WHERE id = NEW.owner_id;

  INSERT INTO institution_members (institution_id, user_id, full_name, email, role, is_active)
    VALUES (NEW.institution_id, NEW.owner_id, _name, _email, 'owner', true)
    ON CONFLICT (institution_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS trg_seed_institution_owner ON institutions;
CREATE TRIGGER trg_seed_institution_owner
  AFTER INSERT ON institutions
  FOR EACH ROW EXECUTE FUNCTION seed_institution_owner_member();

-- Backfill existing institutions that have no owner member row yet
INSERT INTO institution_members (institution_id, user_id, full_name, email, role, is_active)
SELECT
  i.institution_id,
  i.owner_id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  u.email,
  'owner',
  true
FROM institutions i
JOIN auth.users u ON u.id = i.owner_id
WHERE NOT EXISTS (
  SELECT 1 FROM institution_members im
  WHERE im.institution_id = i.institution_id AND im.user_id = i.owner_id
)
ON CONFLICT (institution_id, user_id) DO NOTHING;
