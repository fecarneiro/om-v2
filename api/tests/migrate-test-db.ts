import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

export default async function () {
  const db = drizzle(process.env.DATABASE_URL as string);
  await migrate(db, { migrationsFolder: "./drizzle" });
  await db.$client.end();
}
