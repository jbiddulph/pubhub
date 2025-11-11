-- Add optional breed_sizes column for food finder filters
alter table if exists public.doghealthy_dog_food_products
add column if not exists breed_sizes text[];

