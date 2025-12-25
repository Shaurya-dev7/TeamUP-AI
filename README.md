This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Start on LAN (serve to other devices on your network)

Run the development server bound to all network interfaces:

```bash
npm run dev:lan
# or for production-like server
npm run start:lan
```

The dev server will print a `Network` URL (e.g. `http://192.168.x.y:3000`) you can open from other devices on the same LAN.

## Supabase (required for full features)

This project uses Supabase for auth, profiles, and chat. To enable all features please:

1. Create a Supabase project and a `profiles` table matching the schema expected in `database.types.ts`.
2. Copy `.env.local.example` to `.env.local` and fill the values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. Install deps and seed demo profiles:

```bash
npm install
node scripts/seed_profiles.js
```

Seeding requires the `SUPABASE_SERVICE_ROLE_KEY` because it performs inserts/upserts. Keep that key secret and do not commit it.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
