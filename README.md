# The Latham Open, live website (Netlify + Neon)

This folder is the whole website. It is a static page (`index.html`) plus one small
serverless function (`netlify/functions/api.js`) that reads and writes the shared data
in your Neon database. Reads are public; bids are validated on the server; and admin
writes (boats, catches, results, sponsors, gallery, selling boats) require the admin
password, which lives as a server setting, not in the page.

## What you need
- Your Neon database (you have this) and its connection string.
- A GitHub account (free).
- A Netlify account (free).
- Your domain name (you have this).

## Step 1, create the table in Neon
1. Open your Neon project, go to the SQL Editor.
2. Paste the contents of `schema.sql` and run it. That creates one table called `kv`.
3. Copy your connection string from Neon (Dashboard, Connection Details, the
   "pooled connection" string that starts with `postgresql://`). Keep it handy.

## Step 2, put the code on GitHub
1. Create a new, empty repository on GitHub, for example `latham-open`.
2. Upload every file in this folder into that repository, keeping the folders exactly as
   they are (so `netlify/functions/api.js` stays in that path). The quickest way: on the
   repo page use "Add file", "Upload files", then drag the whole contents in.

## Step 3, deploy on Netlify
1. Log in to Netlify, "Add new site", "Import an existing project", choose GitHub, and
   pick your `latham-open` repository.
2. Leave the build command blank. Set "Publish directory" to `.` (a single dot). Deploy.
3. When it finishes you get a temporary address like `random-name.netlify.app`. The page
   will load but the live data will not work yet, because we have not given it the
   database and password. Do Step 4, then redeploy.

## Step 4, add the two settings (environment variables)
In Netlify: Site configuration, Environment variables, add two:
- `DATABASE_URL`  =  your Neon connection string from Step 1.
- `ADMIN_PASSWORD`  =  a strong admin password of your choice.
Then go to Deploys and click "Trigger deploy", "Deploy site" so the settings take effect.

## Step 5, connect your domain
In Netlify: Domain management, "Add a domain", type your domain, and follow the on-screen
DNS instructions at your domain registrar (Netlify shows the exact records or nameservers).
HTTPS is switched on automatically once DNS is verified, usually within an hour.

## That's it
- Everyone who visits sees the same live bids, leaderboard, prizes, sponsors and gallery.
- Bids placed on any phone are validated and shared.
- The committee opens Admin, enters the password (the one you set in Step 4), and runs the
  boats, catches, results and the auction presentation.

## Notes
- To change the admin password later, just update `ADMIN_PASSWORD` in Netlify and redeploy.
  There is no password stored in the page on the live site.
- To update the site after a change, upload the new files to the same GitHub repo; Netlify
  redeploys automatically.
- Free tiers are generous and fine for an event like this. If you ever expect very heavy
  simultaneous use, both Neon and Netlify scale up on paid plans.
