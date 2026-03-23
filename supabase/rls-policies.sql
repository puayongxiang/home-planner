alter table public.crawled_images enable row level security;
alter table public.moodboard_images enable row level security;
alter table public.saved_links enable row level security;
alter table public.furniture_items enable row level security;
alter table public.ignored_images enable row level security;

create policy "public read crawled_images"
on public.crawled_images
for select
to anon, authenticated
using (true);

create policy "public read moodboard_images"
on public.moodboard_images
for select
to anon, authenticated
using (true);

create policy "public read saved_links"
on public.saved_links
for select
to anon, authenticated
using (true);

create policy "public read furniture_items"
on public.furniture_items
for select
to anon, authenticated
using (true);

create policy "deny read ignored_images"
on public.ignored_images
for select
to anon, authenticated
using (false);
