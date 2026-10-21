This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, install the project dependencies:

```bash
npm install
```

Then, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Page Routes

- `/`: Homepage with sign-in and registration choices.
- `/sign-in`: Two-step sign-in (email, then password), with a link to registration.
- `/setup-existing-user`: Password setup for existing, unregistered people.
- `/home`: Placeholder landing page after a successful sign-in.
- `/register`: Creates a profile, sets a password, and continues to `/interests`.
- `/interests`: Saves 3 to 10 interests through the backend API.
- `/spinwheel`: Requests a database-backed match and accepts or declines the offer.
- `/meetups`: Pending and accepted matches, completion confirmation, and call history.

The CoffeeConnect brand link on each page returns to `/`.

## Meetups And Call History

`/meetups` uses real account-specific Match records from the backend rather than
hard-coded sample people. The page follows the current sage-green website design
and uses its shared navigation, with Upcoming and Past Meetups, responsive
colleague cards, and a spin action.
Pending matches show whether the signed-in person needs to respond or is awaiting
their colleague. Accepted matches can be marked completed by either participant
after a confirmation step. The history shows the confirmation date, colleague
details, shared interests, and Email/Teams links. These links open the chosen app;
they do not send messages or inspect Teams call logs. There is no scheduling UI.

The backend must have the `add_match_completion` migration applied to its
intended database before these endpoints can be used. Branches do not isolate
databases; do not migrate a shared database just to preview this page. Until then,
the page shows a request error, not fake data. It reuses the existing stored profile,
demo route gate, and shared site header.

### Local Setup After Updating

1. Obtain the corresponding backend changes as well as the frontend changes. The
	updated frontend requires the new backend endpoints and completion column.
2. Follow **Update An Existing Local Database** in the backend README first. That
	checklist covers a private backup, migration review, client generation, and API
	startup. Do not reset or reseed an existing database for this feature.
3. From the frontend repository, install dependencies:

	```bash
	npm install
	```

4. The API defaults to `http://localhost:5000/api`. If your backend uses a different
	address, set `NEXT_PUBLIC_API_URL` in your own `.env.local`, and ensure the backend's
	`CORS_ORIGIN` permits your frontend origin. Keep environment files out of Git.
5. Start or restart the frontend:

	```bash
	npm run dev
	```

6. Open `http://localhost:3000/meetups` using the existing sign-in flow. Accounts with
	no matches should show empty Upcoming and Past Meetups sections, not sample people.
	Use two registered accounts against the same backend to test the full flow: spin,
	accept the offer, accept the incoming request in the second account, then mark the
	accepted match completed. Refresh both accounts and check their history.

The upstream website update includes the missing `startDemoSession` import. The isolated
browser checks below bypass sign-in only in a disposable test profile; they are not a
replacement for a real two-account integration test.

If Meetups reports that `Match.completed_at` does not exist, check the backend's
configured database and migration status using its README. Regenerating the client
alone cannot add the missing database column.

Focused checks:

```bash
npx eslint src/app/meetups/page.tsx src/lib/meetups.ts
npx tsc --noEmit --incremental false
node --test tests/meetups.browser.mjs
```

The browser test uses installed Chrome, a disposable profile, test-only session
values, and intercepted API responses. It does not use or modify the database and
installs no packages. Start the frontend first; `MEETUPS_TEST_URL` overrides
`http://localhost:3000`, and `CHROME_PATH` overrides the default macOS Chrome path.
It checks completion, accept/decline, error/retry/empty states, contact links, and
desktop/tablet/mobile layouts, and writes screenshots into a temporary directory.

## Shared Navigation and Layout

The root layout renders `src/app/site-header/site-header.tsx` on every page, including sign-in,
registration, account setup and protected-page loading states. Keep navigation
changes in that shared component rather than adding headers to individual pages.
The current page is marked with `aria-current="page"` and an orange active style.
Signed-in demo sessions show a sign-out button in place of sign-in/register links.

The header, page containers and footer share the `--content-width` variable in
`src/app/page.module.css`. Navigation wraps onto additional rows at smaller widths.
The landing and meetups pages use full-width sage call-to-action banners whose
inner content aligns with the page container.

## API Client Configuration

Requests to the backend go through the shared axios instance in `src/lib/api.ts`. The base URL defaults to `http://localhost:5000/api` and can be overridden with `NEXT_PUBLIC_API_URL` in `.env.local`. The backend must allow this frontend's origin through its `CORS_ORIGIN` setting.

## Sign-In

The `/sign-in` page asks for a PA work email first and sends it to `POST /api/people/check-email`. If the response is `{ registered: true }`, a password field appears. Otherwise the user is sent to `/setup-existing-user`. The password is checked with `POST /api/people/login`. On success, the returned person (without the password hash) is stored in `sessionStorage` under `coffee-connect-person` and the temporary demo marker is set for the existing route gates. The user is sent to `/home`, or to `/interests`, `/meetups` or `/spinwheel` if that route was requested through the `next` query parameter. Failed sign-ins do not grant access or redirect. This is temporary until proper sessions are added.

## Interests

The available interest names and IDs are currently hard-coded in the frontend and
must match the backend's seeded Interest records. Selections are saved through the API:
unregistered profiles use `POST /api/people/:id/complete-registration`, and registered
profiles use `PATCH /api/people/:id`. The returned profile is stored in `sessionStorage`.
The interface requires 3 to 10 selections. Replacing the hard-coded catalog with a
backend interest-list endpoint remains future work.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
