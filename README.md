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
