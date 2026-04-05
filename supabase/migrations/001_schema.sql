-- =============================================
-- AIPS Launchpad v2 Schema
-- =============================================

-- profiles (auto-created on auth signup)
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- projects
CREATE TABLE projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  track text NOT NULL CHECK (track IN ('idea', 'mvp')),
  name text NOT NULL,
  problem text NOT NULL,
  solution text NOT NULL,
  target_user text NOT NULL,
  mvp_scope text NOT NULL,
  roles_needed text[] NOT NULL DEFAULT '{}',
  contact_email text NOT NULL,
  contact_method text,
  demo_link text,
  video_link text,
  current_team text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'revision')),
  scores jsonb,
  total_score integer,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_user_id ON projects(user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- player_cards
CREATE TABLE player_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  degree text NOT NULL,
  roles text[] NOT NULL DEFAULT '{}',
  superpower text NOT NULL,
  email text NOT NULL,
  abilities jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

CREATE INDEX idx_player_cards_project ON player_cards(project_id);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_cards ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- PROFILES policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "Users can update own display_name"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- PROJECTS policies
CREATE POLICY "Anyone can read approved projects"
  ON projects FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid() OR is_admin());

CREATE POLICY "Authenticated users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owners can update own revision projects"
  ON projects FOR UPDATE
  USING (user_id = auth.uid() AND status = 'revision')
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can update any project"
  ON projects FOR UPDATE
  USING (is_admin());

-- PLAYER_CARDS policies
-- Public view without email (use a view for this)
CREATE POLICY "Anyone can read player cards"
  ON player_cards FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert cards"
  ON player_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Card owners can delete own cards"
  ON player_cards FOR DELETE
  USING (user_id = auth.uid());

-- View for public player cards (no email)
CREATE VIEW player_cards_public AS
  SELECT id, project_id, user_id, name, degree, roles, superpower, abilities, created_at
  FROM player_cards;

GRANT SELECT ON player_cards_public TO anon, authenticated;

-- =============================================
-- Notification trigger (calls Edge Function via pg_net)
-- =============================================

-- This trigger fires when project status changes to 'approved' or 'revision'
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
  function_url text;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('approved', 'revision') THEN
    payload := jsonb_build_object(
      'project_id', NEW.id,
      'project_name', NEW.name,
      'contact_email', NEW.contact_email,
      'status', NEW.status,
      'feedback', NEW.feedback,
      'total_score', NEW.total_score
    );

    -- Call the Edge Function via pg_net (must be enabled in Supabase dashboard)
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := payload
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_status_change
  AFTER UPDATE OF status ON projects
  FOR EACH ROW EXECUTE FUNCTION notify_status_change();
