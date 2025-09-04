-- ENUM roles
create type role as enum ('student','recruiter','admin');

-- App users (maps to supabase.auth.users via auth_user_id)
create table app_user (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null,
  role role not null default 'student',
  created_at timestamp with time zone default now()
);

-- Recruiting event (current active event)
create table recruiting_event (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz default now(),
  ended_at timestamptz
);

-- Student profile (one per app_user with role=student)
create table student (
  id uuid primary key references app_user(id) on delete cascade,
  event_id uuid not null references recruiting_event(id) on delete restrict,
  university text not null,
  full_name text not null,
  email text not null,
  phone text,
  degree text,
  gpa numeric(3,2) check (gpa between 0 and 10), -- adjust scale if 4.0 scale is preferred
  resume_url text,
  created_at timestamptz default now()
);

-- Interviews (recruiter feedback on a student)
create table interview (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references recruiting_event(id) on delete restrict,
  student_id uuid not null references student(id) on delete cascade,
  recruiter_id uuid not null references app_user(id) on delete set null,
  rating_overall int check (rating_overall between 1 and 5),
  rating_tech int check (rating_tech between 1 and 5),
  rating_comm int check (rating_comm between 1 and 5),
  feedback text,
  created_at timestamptz default now()
);

-- RLS
alter table app_user enable row level security;
alter table student enable row level security;
alter table interview enable row level security;
alter table recruiting_event enable row level security;

-- Policies
-- app_user: each auth user can read their own row
create policy app_user_self_read on app_user
for select using (auth.uid() = auth_user_id);

-- Allow admins/recruiters to read all users
create policy app_user_admin_recruiter_read on app_user
for select using (exists (
  select 1 from app_user au
  where au.auth_user_id = auth.uid() and au.role in ('admin','recruiter')
));

-- student: students can select/update their own student row
create policy student_self_rw on student
for select using (exists (select 1 from app_user u where u.id = student.id and u.auth_user_id = auth.uid()))
for update using (exists (select 1 from app_user u where u.id = student.id and u.auth_user_id = auth.uid()));

-- student: recruiters/admins can read all students for active event
create policy student_recruiter_admin_read on student
for select using (exists (
  select 1 from app_user u
  where u.auth_user_id = auth.uid() and u.role in ('recruiter','admin')
));

-- interview: only recruiters/admins can insert/select
create policy interview_recruiter_admin_insert on interview
for insert with check (exists (
  select 1 from app_user u where u.auth_user_id = auth.uid() and u.role in ('recruiter','admin')
));
create policy interview_recruiter_admin_read on interview
for select using (exists (
  select 1 from app_user u where u.auth_user_id = auth.uid() and u.role in ('recruiter','admin')
));

-- recruiting_event: read for all authenticated, write only admin
create policy event_read_auth on recruiting_event
for select using (auth.uid() is not null);

-- Create storage bucket for resumes
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false);

-- Storage policies for resumes
create policy "Users can upload their own resume" on storage.objects
for insert with check (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view their own resume" on storage.objects
for select using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Recruiters and admins can view all resumes" on storage.objects
for select using (bucket_id = 'resumes' and exists (
  select 1 from app_user u
  where u.auth_user_id = auth.uid() and u.role in ('recruiter','admin')
));

-- Function to create app_user on first login
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.app_user (auth_user_id, role)
  values (new.id, 'student');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create app_user when auth.users is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
