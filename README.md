# Hackathon Management Tool V2

The web app behind [Hack the Change](https://hackthechangeyyc.ca), Code the Change YYC's in-person, two-day, for-charity hackathon in Calgary. Participants use it to sign up, form teams and follow the event, judges use it to score projects, and organizers use it to run everything from check-in and meals to judging results.

## Tech stack

| Layer | Tool | Where it lives |
| --- | --- | --- |
| Framework | [Next.js](https://nextjs.org) (App Router) + [React](https://react.dev) | `src/app` |
| API | [tRPC](https://trpc.io) + [TanStack Query](https://tanstack.com/query) | `src/server/api`, `src/trpc` |
| Database | [PostgreSQL](https://www.postgresql.org) (via Docker) + [Drizzle ORM](https://orm.drizzle.team) | `src/server/db`, `drizzle/` |
| Auth | [Better Auth](https://www.better-auth.com) (email/password, Google, email codes for judges) | `src/server/better-auth` |
| UI | [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) on [Base UI](https://base-ui.com) | `src/app/components` |
| Forms & validation | [React Hook Form](https://react-hook-form.com) + [Zod](https://zod.dev) | `src/lib/validation` |
| Email | [Resend](https://resend.com) | `src/server/email` |
| Content | [Contentful](https://www.contentful.com) (landing page winners and judges, participant resources and mentors) | `src/server/contentful` |
| Lint & format | [Biome](https://biomejs.dev), run on commit by [Lefthook](https://lefthook.dev) | `biome.jsonc`, `lefthook.yml` |
| Tests | [Vitest](https://vitest.dev) (unit and integration) + [Playwright](https://playwright.dev) (end-to-end) | `tests/` |

## Getting set up

### 1. Install the prerequisites

- **Node.js 24**, the version CI uses.
- **pnpm**: run `corepack enable` and the version pinned in `package.json` is used automatically.
- **Docker**, which runs the local Postgres database.
- **Bun**, which runs the database seed and a few maintenance scripts:

```bash
curl -fsSL https://bun.sh/install | bash
```

### 2. Install dependencies

```bash
pnpm install
```

This also installs the Lefthook git hooks, which format staged files on commit.

### 3. Create your `.env`

```bash
cp .env.example .env
```

Most values work as-is for local development. You need to fill in two things:

**Google sign-in (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).** Create your own credentials:

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials), create an OAuth client ID of type **Web application**.
2. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.
3. Copy the client ID and secret into `.env`.

**Contentful (`CONTENTFUL_SPACE_ID`, `CONTENTFUL_ACCESS_TOKEN`).** Ask a project lead for these so your content matches everyone else's.

Leave `RESEND_API_KEY` empty. Without it, emails such as verification and sign-in codes are printed to the dev server's terminal instead of being sent. With a real key, the app sends real emails to whatever address you sign up with.

### 4. Set up the database

```bash
pnpm db:up
pnpm db:push
pnpm db:seed
```

`db:up` starts Postgres in Docker, `db:push` creates the tables from the Drizzle schema, and `db:seed` fills the database with sample users, teams, events and judging rounds. Re-run `db:push` whenever the schema in `src/server/db` changes.

> [!WARNING]
> `db:seed` wipes the database before seeding it.

### 5. Start the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). `pnpm dev` also starts the database container if it isn't already running.

### Sample logins

The seed creates one account per role, all with the password `Password123!`:

| Role | Email |
| --- | --- |
| Admin | `admin@hackathon.com` |
| Judge | `judge@hackathon.com` |
| Participant | `participant@hackathon.com` |
