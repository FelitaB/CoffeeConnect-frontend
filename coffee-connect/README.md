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
- `/setup-existing-user`: Placeholder for people whose account is not registered yet.
- `/home`: Placeholder landing page after a successful sign-in.
- `/register`: Registration form; valid inputs continue to `/interests` without creating an account yet.
- `/interests`: Offline interest selection, with a link back to `/register`.

The CoffeeConnect brand link on each page returns to `/`.

## API Client

Requests to the backend go through the shared axios instance in `src/lib/api.ts`. The base URL defaults to `http://localhost:5000/api` and can be overridden with `NEXT_PUBLIC_API_URL` in `.env.local`. The backend must allow this frontend's origin through its `CORS_ORIGIN` setting.

## Sign-In

The `/sign-in` page asks for a PA work email first and sends it to `POST /api/people/check-email`. If the response is `{ registered: true }`, a password field appears. Otherwise the user is sent to `/setup-existing-user`. The password is checked with `POST /api/people/login`. On success, the returned person (without the password hash) is stored in `sessionStorage` under `coffee-connect-person` and the temporary demo marker is set for the existing route gates. The user is sent to `/home`, or to `/interests` or `/meetups` if that route was requested through the `next` query parameter. Failed sign-ins do not grant access or redirect. This is temporary until proper sessions are added.

## Offline Interests Prototype

The `/register` page also grants the temporary demo marker after valid form submission so the prototype can continue to `/interests`; it does not create an account or store credentials. The `/interests` page loads local mock objects in `useEffect`; it makes no API requests and does not connect to MySQL. The provisional object shape is `{ interest_id: number, name: string }`. All mock IDs are placeholders, not database IDs.

Selecting 3 to 10 interests creates a draft payload shaped as `{ interest_ids: number[] }`, stored only in this browser under `coffee-connect-mock-interests-draft`. Draft selections are not restored on reload. The separate key keeps mock IDs apart from the older name-based browser storage.

Before backend integration, confirm the response field names, save endpoint, and user authentication contract. Replace the mock loader with the real interests endpoint and require fresh selections from real database IDs; never submit the mock draft to the API.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
