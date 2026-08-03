# Hackathon Management Tool V2

## Previewing the project

First you want to make sure you have pnpm and docker installed (install Bun below if you don't have it already):

    pnpm -v

    docker -v

Then you can run the project locally:

```bash
pnpm install

curl -fsSL https://bun.sh/install | bash


# then

cp .env.example .env

pnpm db:generate
pnpm db:push
pnpm dev
```

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
