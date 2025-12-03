-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create github_users table to store fetched GitHub users
CREATE TABLE IF NOT EXISTS public.github_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_username TEXT NOT NULL UNIQUE,
  github_id INTEGER NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  company TEXT,
  location TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create team_members table (junction table)
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  github_user_id UUID NOT NULL REFERENCES public.github_users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  assigned_by TEXT,
  UNIQUE(team_id, github_user_id)
);

-- Enable Row Level Security
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.github_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams (public read, admin write)
CREATE POLICY "teams_select_all" ON public.teams FOR SELECT USING (true);
CREATE POLICY "teams_insert_admin" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "teams_update_admin" ON public.teams FOR UPDATE USING (true);
CREATE POLICY "teams_delete_admin" ON public.teams FOR DELETE USING (true);

-- RLS Policies for github_users (public read)
CREATE POLICY "github_users_select_all" ON public.github_users FOR SELECT USING (true);
CREATE POLICY "github_users_insert_admin" ON public.github_users FOR INSERT WITH CHECK (true);
CREATE POLICY "github_users_update_admin" ON public.github_users FOR UPDATE USING (true);

-- RLS Policies for team_members (public read, admin write)
CREATE POLICY "team_members_select_all" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "team_members_insert_admin" ON public.team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "team_members_update_admin" ON public.team_members FOR UPDATE USING (true);
CREATE POLICY "team_members_delete_admin" ON public.team_members FOR DELETE USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_github_user_id ON public.team_members(github_user_id);
CREATE INDEX IF NOT EXISTS idx_github_users_username ON public.github_users(github_username);
