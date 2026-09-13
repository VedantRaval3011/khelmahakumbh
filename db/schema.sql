-- Run this once in your Supabase project's SQL editor (Database > SQL Editor > New query).
-- It creates the four tables the app needs. Safe to re-run — it skips tables that already exist.

create extension if not exists pgcrypto;

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  gender text not null default 'F',
  age_group text not null default 'OPEN',
  area_type text not null default 'DISTRICT',
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  player1_id uuid not null,
  player2_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists entries (
  id uuid primary key default gen_random_uuid(),
  area_type text not null,
  age_group text not null,
  event_type text not null,
  participant_type text not null default 'PERSON',
  participant_id uuid,
  status text not null default 'CONFIRMED',
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  area_type text not null,
  age_group text not null,
  event_type text not null,
  round text not null default '',
  entry_a_id uuid not null,
  entry_b_id uuid not null,
  winner_entry_id uuid not null,
  score text not null default '',
  prize integer not null default 0,
  created_at timestamptz not null default now()
);

-- These tables are only ever touched by the app's server-side API routes using the
-- service role key, which bypasses Row Level Security entirely — so RLS can stay off.
-- If you'd rather turn it on for defense-in-depth, that's fine too; the service role
-- key ignores RLS either way, so no policies are required for this app to work.
