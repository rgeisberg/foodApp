# foodApp

A simple shared recipe web app for family use.

## Planned stack

- `React`
- `Vite`
- `TypeScript`
- `React Router`
- `Supabase` for auth, database, and storage
- `Cloudflare Pages` for frontend hosting

## Current scaffold

This repo currently contains:

- app routing
- placeholder pages for recipes, auth, and favorites
- a Supabase client helper
- starter styling
- feature folders for future growth

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
```

These values come from your Supabase project settings:

- `VITE_SUPABASE_URL`: the URL of your Supabase project
- `VITE_SUPABASE_ANON_KEY`: the public client key used by the browser app

In Vite, environment variables must start with `VITE_` to be available in frontend code.

3. Start the dev server:

```bash
npm run dev
```

## Supabase setup

1. Create a Supabase project
2. In the Supabase dashboard, go to `Project Settings -> API`
3. Copy the project URL and anon public key into your local `.env`
4. Open the SQL editor and run [supabase/schema.sql](./supabase/schema.sql)

After that, the login page can create accounts and sign users in.

## Suggested next steps

1. Create the first real recipe form submission
2. Replace mock recipe data with Supabase queries
3. Connect favorites to `recipe_favorites`
4. Add image upload storage
5. Add search and filters

## NYT Cooking Import

The repo now includes a manual-browser ingestion pipeline for recipe import from your own NYT Cooking subscription session.

What it does:

- you open a NYT recipe in your normal logged-in browser
- you run a small extractor from [scripts/nyt/browser-extractor.js](./scripts/nyt/browser-extractor.js)
  or the bookmarklet in [scripts/nyt/bookmarklet.txt](./scripts/nyt/bookmarklet.txt)
- the page downloads a structured `.json` recipe file
- you move that file into `data/nyt/json/`
- `npm run nyt:export` converts all saved JSON files into:
  - `data/nyt/csv/recipes.csv`
  - `data/nyt/csv/recipe_ingredients.csv`

Why this approach:

- NYT bot detection can block automated login/navigation
- the browser extractor uses recipe data already delivered to your logged-in browser
- the structured page data is much more reliable than PDF parsing for ingredients and search

Manual workflow:

1. Open a NYT Cooking recipe page in your normal browser while logged in
2. Open DevTools Console
3. Paste the contents of [scripts/nyt/browser-extractor.js](./scripts/nyt/browser-extractor.js)
4. Press Enter
5. A `.json` file should download
6. Move that file into `data/nyt/json/`
7. Repeat for more recipes
8. Run:

```bash
npm run nyt:export
```

Optional PDF archive:

- Use the browser print dialog and save PDFs manually into `data/nyt/pdfs/`

Supabase import:

- use [supabase/nyt_import_template.sql](./supabase/nyt_import_template.sql) as a staging/import template
- replace `YOUR_USER_UUID_HERE` with the auth user id that should own the imported recipes
