import { eq } from "drizzle-orm";
import { auth } from "@/server/better-auth";
import { db } from "@/server/db";
import { user } from "@/server/db/auth-schema";
import type { User } from "@/types/types";

type CreateUserInput = {
  email: string;
  password: string;
  name: string;
  role?: User["role"];
};

export async function createOrGetUser({
  email,
  password,
  name,
  role,
}: CreateUserInput): Promise<User> {
  // Check if user exists
  const existingUser = await db
    .select()
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  if (existingUser.length > 0 && existingUser[0]) {
    console.log(`User already exists: ${email}`);
    return existingUser[0] as User;
  }

  // Create user via Better Auth
  const res = await auth.api.signUpEmail({
    body: {
      name,
      email,
      password,
    },
  });

  console.log(`User created: ${email}`);

  // Optionally update role
  if (role) {
    await db.update(user).set({ role }).where(eq(user.email, email));

    console.log(`User role updated to ${role.toUpperCase()}`);
  }

  return res.user as User;
}
