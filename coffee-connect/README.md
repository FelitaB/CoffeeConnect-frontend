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
- `/sign-in`: Offline sign-in form, with a link to registration.
- `/register`: Registration form; valid inputs continue to `/interests` without creating an account yet.
- `/interests`: Offline interest selection, with a link back to `/register`.

The CoffeeConnect brand link on each page returns to `/`.

## Offline Sign-In Prototype

The `/sign-in` page validates a PA work email and a nonempty password locally. It does not authenticate users, create a session, or make API requests. Valid submission clears the password and displays an explicit offline status; credentials are not saved to browser storage. Authentication and password recovery need an agreed backend contract before integration.

## Offline Interests Prototype

The `/interests` page loads local mock objects in `useEffect`; it makes no API requests and does not connect to MySQL. The provisional object shape is `{ interest_id: number, name: string }`. All mock IDs are placeholders, not database IDs.

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
