# aescendexco.com

- `public/` is the website (served by Netlify).
  - `/jobs/` — job board. Students sign in with Google; offers load only after staff approve them.
  - `/staff/` — staff portal: approve/remove students. The owner can also add/remove staff.
- `netlify/functions/offers-data.mjs` — **the offers**. Add new ones at the top. Kept out of `public/` so only approved users can get them.
- `netlify/functions/offers.mjs` — returns offers to approved students, staff and the owner.
- `firestore.rules` — paste into Firebase → Firestore → Rules.
- Firebase settings go in `public/assets/config.js` and `netlify/functions/config.mjs`.
