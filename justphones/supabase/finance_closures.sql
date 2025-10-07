-- Create finance_closures table for managing monthly cash closures
create extension if not exists "pgcrypto";

create table if not exists public.finance_closures (
    id uuid primary key default gen_random_uuid(),
    month text not null check (month ~ '^\d{4}-(0[1-9]|1[0-2])$'),
    start_date timestamptz not null,
    created_at timestamptz not null default timezone('utc', now())
);

-- Seed initial closures (July through October 2025)
insert into public.finance_closures (month, start_date)
values
    ('2025-07', '2025-07-03T00:00:00Z'),
    ('2025-08', '2025-08-03T00:00:00Z'),
    ('2025-09', '2025-09-01T00:00:00Z'),
    ('2025-10', '2025-10-01T00:00:00Z')
on conflict (month) do nothing;
