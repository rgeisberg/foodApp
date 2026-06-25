create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,
  description text,
  instructions text not null,
  prep_time integer,
  cook_time integer,
  servings integer,
  image_url text,
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient text not null,
  amount text,
  unit text,
  sort_order integer not null default 0
);

create table if not exists public.recipe_favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, recipe_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_recipes_updated_at on public.recipes;

create trigger set_recipes_updated_at
  before update on public.recipes
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_favorites enable row level security;

drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users"
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "recipes are public to authenticated users" on public.recipes;
create policy "recipes are public to authenticated users"
  on public.recipes
  for select
  to authenticated
  using (true);

drop policy if exists "authenticated users can create recipes" on public.recipes;
create policy "authenticated users can create recipes"
  on public.recipes
  for insert
  to authenticated
  with check (auth.uid() = created_by);

drop policy if exists "users can update their own recipes" on public.recipes;
create policy "users can update their own recipes"
  on public.recipes
  for update
  to authenticated
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

drop policy if exists "users can delete their own recipes" on public.recipes;
create policy "users can delete their own recipes"
  on public.recipes
  for delete
  to authenticated
  using (auth.uid() = created_by);

drop policy if exists "ingredients follow readable recipes" on public.recipe_ingredients;
create policy "ingredients follow readable recipes"
  on public.recipe_ingredients
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
    )
  );

drop policy if exists "ingredient insert allowed for owned recipes" on public.recipe_ingredients;
create policy "ingredient insert allowed for owned recipes"
  on public.recipe_ingredients
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.created_by = auth.uid()
    )
  );

drop policy if exists "ingredient update allowed for owned recipes" on public.recipe_ingredients;
create policy "ingredient update allowed for owned recipes"
  on public.recipe_ingredients
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.created_by = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.created_by = auth.uid()
    )
  );

drop policy if exists "ingredient delete allowed for owned recipes" on public.recipe_ingredients;
create policy "ingredient delete allowed for owned recipes"
  on public.recipe_ingredients
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
        and recipes.created_by = auth.uid()
    )
  );

drop policy if exists "users can read their own favorites" on public.recipe_favorites;
create policy "users can read their own favorites"
  on public.recipe_favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "users can create their own favorites" on public.recipe_favorites;
create policy "users can create their own favorites"
  on public.recipe_favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "users can delete their own favorites" on public.recipe_favorites;
create policy "users can delete their own favorites"
  on public.recipe_favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);
