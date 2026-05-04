# Family Bubble Tree

This project uses a touch-friendly UI and saves family records into a real database.

## What changed

- Bigger cards and clearer labels for the family tree.
- Clear status text that tells people when saving is ready.
- A separate Add People page for creating new records.
- A recent additions panel that shows saved people from the database.

## How to save to the real database

1. Open `supabase-config.js`.
2. Put your project URL into `supabaseUrl`.
3. Put your anon key into `supabaseAnonKey`.
4. Keep `familyTable` as `family_members` unless you rename the table.
5. Create the table in your database by running this SQL:

```sql
create table if not exists public.family_members (
    id uuid primary key default gen_random_uuid(),
    family_id text not null default 'jamal-awang-legacy',
    name text not null,
    relation text not null default 'Other',
    birthday text,
    birth_place text,
    occupation text,
    notes text,
    parent_name text,
    partner_name text,
    image_url text,
    created_at timestamptz not null default now()
);

alter table public.family_members enable row level security;

create policy "allow read family members"
    on public.family_members
    for select
    using (true);

create policy "allow insert family members"
    on public.family_members
    for insert
    with check (true);
```

1. Open `AddPeople.html` and fill in the form.
2. Click Save person.
3. Open `index.html` to see the saved records in the Recent additions panel.

## How to store uploaded images in GitHub

The app can send the image file to a server-side upload endpoint, then save only the returned GitHub image URL in Supabase.

1. Create a GitHub token with `contents:write` access to the target repository.
2. Deploy the function in `supabase/functions/github-image-upload/index.ts`.
3. Set these secrets in your Supabase project:

```bash
supabase secrets set GITHUB_TOKEN="your-token"
supabase secrets set GITHUB_OWNER="your-github-username-or-org"
supabase secrets set GITHUB_REPO="your-image-repo"
supabase secrets set GITHUB_BRANCH="main"
supabase secrets set GITHUB_IMAGE_PATH_PREFIX="family-images"
```

1. Copy the deployed function URL into `githubImageUploadUrl` inside `supabase-config.js`.
2. Upload a photo from `AddPeople.html`; the file will be written to GitHub first, then the returned raw URL is saved in Supabase.

Notes:

- Use a public GitHub repo if everyone needs to view the images without signing in.
- Supabase stores only the URL, not the image binary.
- If the upload endpoint is not configured, the form falls back to the existing local image path behavior.

## Notes

- The family tree still uses the bundled tree data as its visual source.
- The tree nodes are circular, and the connector lines show the branch flow.
- If you want the tree itself to become fully database-driven later, the next step is to turn the nested sample data into parent and child links.
