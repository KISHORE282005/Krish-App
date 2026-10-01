# Ascend

Personal daily planner, habits, journal and streaks. React + Vite front end, with a small API that stores everything in SQLite.

## Run locally

```bash
npm install
npm run dev        # API (port 5174) + app (http://localhost:5173)
```

Log in as `krish`. Data goes to `data/ascend.db`, with daily backups in `data/backups/`. The `data/` folder is never committed.

## Where the data lives

| Where it runs | Database |
| --- | --- |
| `npm run dev` / `npm start` | `data/ascend.db`, or Turso if `TURSO_DATABASE_URL` is set in `.env` |
| Netlify | Turso (cloud SQLite). Set the keys in Netlify's environment variables. |

The API code (`server/api.js`, `server/store.js`) is the same in both places. Only the adapter in `server/adapters/` differs.

## Deploy to Netlify

1. **Create the database.** Go to [turso.tech](https://turso.tech), sign up for free, create a database, and copy:
   - the **Database URL** (`libsql://<db>-<org>.turso.io`)
   - an **auth token** (database page → *Create Token*, read & write)
2. **Add the keys in Netlify.** Go to *Site configuration → Environment variables*, add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`, and give them the **Functions** scope.
3. **Redeploy.** Go to *Deploys → Trigger deploy → Clear cache and deploy site*. `netlify.toml` already sets the build command (`npm run build`), the publish folder (`dist`), and the `/api/*` function.
4. **Check it.** `https://<your-site>.netlify.app/api/health` should return `{"ok":true}`.

The tables and the `krish` user are created automatically on the first request.

### Copy your local data to the cloud

```bash
cp .env.example .env   # paste the same two Turso values
npm run db:push        # copies data/ascend.db → Turso, never overwrites
```

## Other commands

```bash
npm run set-password -- krish NEWPASSWORD   # updates Turso if .env has TURSO_*, else the local db
npm start                                   # build + serve everything from http://localhost:5174
```
