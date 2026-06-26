-- NYT Cooking CSV import template
--
-- 1. Create staging tables.
-- 2. Import `data/nyt/csv/recipes.csv` into `public.nyt_recipe_import`.
-- 3. Import `data/nyt/csv/recipe_ingredients.csv` into `public.nyt_recipe_ingredient_import`.
-- 4. Replace `YOUR_USER_UUID_HERE` below with the auth user UUID that should own the imported recipes.
-- 5. Run the insert statements.

create table if not exists public.nyt_recipe_import (
  import_key text primary key,
  source_url text not null,
  title text not null,
  category text,
  description text,
  instructions text not null,
  prep_time integer,
  cook_time integer,
  total_time integer,
  servings integer,
  image_url text
);

create table if not exists public.nyt_recipe_ingredient_import (
  import_key text not null references public.nyt_recipe_import (import_key) on delete cascade,
  source_url text not null,
  sort_order integer not null,
  amount text,
  unit text,
  ingredient text not null,
  raw_ingredient_line text,
  primary key (import_key, sort_order)
);

create temporary table nyt_inserted_recipe_map (
  import_key text primary key,
  recipe_id uuid not null
);

insert into public.recipes (
  title,
  category,
  description,
  instructions,
  prep_time,
  cook_time,
  total_time,
  servings,
  image_url,
  created_by
)
select
  source.title,
  nullif(source.category, ''),
  nullif(source.description, ''),
  source.instructions,
  source.prep_time,
  source.cook_time,
  source.total_time,
  source.servings,
  nullif(source.image_url, ''),
  '7d88a1de-95a4-44d1-939d-b41f7e49234b'::uuid
from public.nyt_recipe_import as source
on conflict do nothing;

insert into nyt_inserted_recipe_map (import_key, recipe_id)
select
  source.import_key,
  target.id
from public.nyt_recipe_import as source
join public.recipes as target
  on target.title = source.title
 and coalesce(target.description, '') = coalesce(source.description, '')
 and target.instructions = source.instructions;

insert into public.recipe_ingredients (
  recipe_id,
  ingredient,
  amount,
  unit,
  sort_order
)
select
  map.recipe_id,
  ingredient.ingredient,
  nullif(ingredient.amount, ''),
  nullif(ingredient.unit, ''),
  ingredient.sort_order
from public.nyt_recipe_ingredient_import as ingredient
join nyt_inserted_recipe_map as map
  on map.import_key = ingredient.import_key
on conflict do nothing;
