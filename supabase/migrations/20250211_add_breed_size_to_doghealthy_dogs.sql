-- Add breed_size column so dog profiles can capture size information
alter table if exists public.doghealthy_dogs
add column if not exists breed_size text;

