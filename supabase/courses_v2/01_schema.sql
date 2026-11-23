-- courses_v2: the same course records as `courses`, with the caption, description and modules rewritten in
-- original words. The old `courses` table is NOT touched; the site reads courses_v2 and falls back to `courses`.
-- Run this once in the Supabase SQL editor, then load the data with:  node supabase/courses_v2/load.cjs

create table if not exists public.courses_v2 (
  id                   uuid primary key,            -- same ids as public.courses, so links and the WhatsApp flows still match
  title                text not null,
  caption              text,
  description          text,
  image                text,                        -- only our own uploads; images from caddeskindia.com are not copied
  banner               text,
  price                text,
  lessons              text,                        -- number of modules, counted from table_of_contents
  students             text,                        -- left empty on purpose (the old value was a scraped network figure)
  duration             text,
  certification        boolean,
  difficulty           jsonb,
  languages            jsonb,
  category             text,
  prerequisites        text,
  assignment           text,
  table_of_contents    jsonb,                       -- [{ "title": "...", "detail": ["...", "..."] }]
  additional_resources jsonb,
  materials            jsonb,
  created_at           timestamptz default now(),
  needs_review         boolean not null default false  -- true where the text was written without a source syllabus
);

create index if not exists courses_v2_category_idx on public.courses_v2 (category);

-- The site reads this table with the server (service role) key only, so no public policies are created.
alter table public.courses_v2 enable row level security;
