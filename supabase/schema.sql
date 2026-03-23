create extension if not exists pgcrypto;

create table if not exists public.crawled_images (
  id text primary key,
  source_url text not null,
  image_url text not null unique,
  alt text not null default '',
  room_type text not null default 'Uncategorised',
  style text not null default 'Uncategorised',
  source text,
  crawled_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists crawled_images_crawled_at_idx
  on public.crawled_images (crawled_at desc);

create index if not exists crawled_images_room_type_idx
  on public.crawled_images (room_type);

create index if not exists crawled_images_style_idx
  on public.crawled_images (style);

create table if not exists public.moodboard_images (
  id text primary key,
  crawled_image_id text not null references public.crawled_images(id) on delete cascade,
  image_url text not null,
  comment text not null default '',
  pinned boolean not null default false,
  annotations jsonb,
  added_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (crawled_image_id)
);

create index if not exists moodboard_images_added_at_idx
  on public.moodboard_images (added_at desc);

create index if not exists moodboard_images_pinned_idx
  on public.moodboard_images (pinned);

create table if not exists public.saved_links (
  id text primary key,
  url text not null unique,
  source text not null,
  title text not null default '',
  note text not null default '',
  room_type text not null default '',
  style text not null default '',
  pinned boolean not null default false,
  saved_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists saved_links_saved_at_idx
  on public.saved_links (saved_at desc);

create index if not exists saved_links_pinned_idx
  on public.saved_links (pinned);

create table if not exists public.furniture_items (
  id text primary key,
  name text not null,
  image_url text,
  price text,
  link text,
  room_type text,
  notes text,
  pinned boolean not null default false,
  added_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists furniture_items_added_at_idx
  on public.furniture_items (added_at desc);

create index if not exists furniture_items_pinned_idx
  on public.furniture_items (pinned);

create table if not exists public.ignored_images (
  crawled_image_id text primary key references public.crawled_images(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists ignored_images_created_at_idx
  on public.ignored_images (created_at desc);
