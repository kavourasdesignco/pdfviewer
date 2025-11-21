-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Publications Table
create table publications (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  filename text not null,
  page_count integer not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  views integer default 0
);

-- Set up Storage Buckets
-- Note: You need to create these buckets in the Supabase Dashboard: 'pdfs', 'pages'

-- RLS Policies (Row Level Security)
alter table publications enable row level security;

-- Allow read access to everyone
create policy "Public publications are viewable by everyone"
  on publications for select
  using ( true );

-- Allow insert/update/delete access only to authenticated users (Admin)
create policy "Admins can insert publications"
  on publications for insert
  with check ( auth.role() = 'authenticated' );

create policy "Admins can update publications"
  on publications for update
  using ( auth.role() = 'authenticated' );

create policy "Admins can delete publications"
  on publications for delete
  using ( auth.role() = 'authenticated' );

-- Storage Policies (You might need to set these in the Storage UI or via SQL if supported)
-- Bucket: pdfs
-- Public Access: false (or true if you want direct download)
-- Auth Access: Read/Write for authenticated users

-- Bucket: pages
-- Public Access: true (so viewer can load images)
-- Auth Access: Read/Write for authenticated users
