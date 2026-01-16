# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## Previewing the project

First you want to make sure you have pnpm installed:

```bash
pnpm -v
```

Then you can run the project locally:

```bash
pnpm install

# then

pnpm dev
```

## Setting up your dev database

1. Sign up for Supabase
2. Create a new org/project
3. Copy the DB password
4. Create a `.env` file in the root of the project
5. In supabase console, click `Connect` at the top of your project page
6. Click the `ORMs` tab and select Drizzle
7. Paste the connection string, and then paste your DB password into the `password` field
8. Run `pnpm db:push`
9. You should see that your DB is now populated with the schema(s) defined in `src/server/db`

## I want to add a new model to my DB, what do I do?

1. Create a new file in `src/server/db`
2. Define your model using Drizzle's schema syntax
3. Run `pnpm db:push` to apply the changes to your DB

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [BetterAuth.js](https://www.better-auth.com/docs/integrations/next)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

