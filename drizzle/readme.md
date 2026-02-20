# Database Setup Guide

## 1. Supabase

Go to [supabase.com](https://supabase.com/), create a new project, and copy your database URL by clicking on `Connect` at the top of the page (next to main). Then, switch to the ORMs tab, click dropdown and change Prisma to Drizzle, and then copy the URL.

## 2. Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```dotenv
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres"
```

Make sure to update your password to what you have set it as (in the URL).

## 3. Run the following commands

```bash
pnpm db:generate
pnpm db:push

pnpm seed
pnpm seed:scores
```