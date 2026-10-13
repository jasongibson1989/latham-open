-- Run this once in the Neon SQL editor to create the store table.
create table if not exists kv (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
