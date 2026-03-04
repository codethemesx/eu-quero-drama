import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

async function seedAdmin() {
  const mysql2 = await import("mysql2/promise");
  const { users } = await import("../drizzle/schema.ts").catch(async () => {
    // fallback: use compiled
    return import("../drizzle/schema.js");
  });

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const db = drizzle(process.env.DATABASE_URL);

  const adminEmail = "codethemesx@gmail.com";
  const adminPassword = "#Tatarav0";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  try {
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existing.length > 0) {
      // Update to admin role and set password
      await db
        .update(users)
        .set({ role: "admin", passwordHash, loginMethod: "email" })
        .where(eq(users.email, adminEmail));
      console.log("✓ Admin user updated:", adminEmail);
    } else {
      await db.insert(users).values({
        name: "Admin",
        email: adminEmail,
        passwordHash,
        loginMethod: "email",
        role: "admin",
        lastSignedIn: new Date(),
      });
      console.log("✓ Admin user created:", adminEmail);
    }
  } catch (err) {
    console.error("Error seeding admin:", err);
    process.exit(1);
  }

  process.exit(0);
}

seedAdmin();
