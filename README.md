# Ping Pong Hall of Shame

A tiny, shared scoreboard for our table tennis matches: add players from your phone, log games (to 11 or 21), see an all-time Elo leaderboard, and get matchup suggestions. Static page, no build step.

## Run it locally (demo mode)

```bash
python3 -m http.server 8080
# open http://localhost:8080
```

With no keys in `config.js` the app runs in demo mode: data stays in your browser's localStorage.

## Share it with everyone (Supabase + Vercel)

1. Create a project at supabase.com.
2. SQL editor: paste and run `schema.sql`, then run `insert into public.crew_secret (passcode) values ('your-passcode');`.
3. Project settings, API: copy the Project URL and the `anon` public key into `config.js`.
4. Deploy: `npx vercel` in this folder (framework preset: Other, no build command, output directory `.`), or import the GitHub repo in Vercel.

## How it works

- `index.html`: UI, Elo/leaderboard/matchup logic.
- `store.js`: data layer (demo localStorage or Supabase with realtime).
- `schema.sql`: tables, score-validity constraints, Row Level Security, passcode-gated delete.

Anyone with the link can add players and matches; only the passcode holder can delete matches. Supabase free projects pause after about a week of inactivity.
