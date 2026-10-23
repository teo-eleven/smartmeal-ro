-- 0010_user_recipe_notes.sql
--
-- Personal notes per recipe ("mai mult usturoi data viitoare"), so they follow the account to
-- a second phone. Until stage 5 they lived only on the phone (@smartmeal_recipe_notes).
--
-- One row per user and recipe. Deleted with the account (on delete cascade from auth.users,
-- which delete-account removes). Only the owner can read or write their notes.

create table if not exists public.user_recipe_notes (
  user_id    uuid        not null references auth.users (id) on delete cascade,
  recipe_id  text        not null,
  note       text        not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, recipe_id),
  -- Recipe ids are short slugs; anything longer is not one of ours.
  constraint user_recipe_notes_recipe_id_format check (recipe_id ~ '^[a-z0-9_]{1,100}$'),
  -- The app caps a note at 2000 characters (MAX_NOTE_LENGTH); an emptied note is deleted.
  constraint user_recipe_notes_note_length
    check (char_length(note) between 1 and 2000 and btrim(note) <> '')
);

comment on table public.user_recipe_notes is
  'Personal cooking notes per recipe. Written by recipeNotesCloud (upsert on user_id, recipe_id).';

alter table public.user_recipe_notes enable row level security;

drop policy if exists "own notes: select" on public.user_recipe_notes;
create policy "own notes: select"
  on public.user_recipe_notes for select
  using (auth.uid() = user_id);

drop policy if exists "own notes: insert" on public.user_recipe_notes;
create policy "own notes: insert"
  on public.user_recipe_notes for insert
  with check (auth.uid() = user_id);

drop policy if exists "own notes: update" on public.user_recipe_notes;
create policy "own notes: update"
  on public.user_recipe_notes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "own notes: delete" on public.user_recipe_notes;
create policy "own notes: delete"
  on public.user_recipe_notes for delete
  using (auth.uid() = user_id);

-- Only what the app does: the owner reads, writes and deletes their rows. Supabase's default
-- privileges also hand out truncate, references and trigger; nobody needs those.
revoke all on public.user_recipe_notes from anon, authenticated;
grant select, insert, update, delete on public.user_recipe_notes to authenticated;

drop trigger if exists user_recipe_notes_set_updated_at on public.user_recipe_notes;
create trigger user_recipe_notes_set_updated_at
  before update on public.user_recipe_notes
  for each row execute function public.set_updated_at();
