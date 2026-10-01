# Ascend

Personal daily planner, habits, journal and streaks. A React + Vite app with no server and no database.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
```

Log in as `krish`.

## Where the data lives

Everything (journals, planner ticks, notes, settings) is saved in the browser's local storage, separately for each site and browser. Use the **☰ menu → Export / Import** to:

- keep a backup file safe
- move your data to another device or browser, e.g. from `localhost` to the Netlify site

Importing only adds days the browser doesn't already have. It never overwrites existing days.

## Deploy to Netlify

Push to GitHub and Netlify builds it using `netlify.toml` (`npm run build`, publishes `dist`). No environment variables are needed.

## Login

The username and password are checked inside the app (`src/utils/auth.js`), which stores only a salted SHA-256 hash. This keeps casual visitors out, but it isn't real security, since the site's code is public. To change the password, follow the comment at the top of `src/utils/auth.js`.
