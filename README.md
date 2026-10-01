# Portfolio

Personal portfolio built with [Next.js](https://nextjs.org) (App Router), TypeScript, and Tailwind CSS.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Customizing

| What                       | Where                                   |
| -------------------------- | --------------------------------------- |
| Name, role, email, socials | `src/lib/utils.ts` (`siteConfig`)       |
| Projects                   | `src/data/projects.ts`                  |
| Work experience            | `src/data/experience.ts`                |
| Skills                     | `src/data/skills.ts`                    |
| Colors & fonts             | `src/app/globals.css` (`@theme`)        |
| Profile photo              | `public/images/profile/`                |
| Project screenshots        | `public/images/projects/`               |
| Resume                     | `public/resume.pdf`                     |
| Favicon                    | `public/favicon.ico`                    |

Each project in `src/data/projects.ts` automatically gets its own page at `/projects/<slug>`.

## Contact form → Google Sheets

Messages from the contact page are saved as rows in a Google Sheet (Time | Name | Email |
Phone | Topic | Message). The form posts to `/api/contact`, which forwards the message to a
small Google Apps Script attached to your sheet. The script also enforces the limit of
2 messages per email address per 24 hours.

1. **Create the sheet.** Make a new Google Sheet (any name).
2. **Add the script.** In the sheet, open **Extensions → Apps Script**, delete the sample
   code, and paste in `google-apps-script/contact-to-sheet.gs`.
3. **Set a secret.** In the script, change `SECRET` to a long random string (e.g. run
   `openssl rand -hex 24` in a terminal). Save.
4. **Deploy it.** Click **Deploy → New deployment**, choose type **Web app**, set
   *Execute as* = **Me** and *Who has access* = **Anyone**, then **Deploy**. Approve the
   permissions Google asks for, and copy the **Web app URL** (it ends in `/exec`).
5. **Connect the site.** In `.env.local` add:

   ```
   CONTACT_SHEET_URL=https://script.google.com/macros/s/…/exec
   CONTACT_SHEET_SECRET=the-same-secret-as-in-the-script
   ```

6. **Restart** `npm run dev`, send a test message, and check the **Messages** tab in the
   sheet. On your hosting provider (e.g. Vercel), add the same two variables in its
   environment settings.

If you edit the script later, deploy again with **Deploy → Manage deployments → Edit →
New version**, so the same URL keeps working.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — create a production build
- `npm start` — serve the production build
