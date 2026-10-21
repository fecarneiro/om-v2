import { drizzle } from "drizzle-orm/node-postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida");

export const db = drizzle(url);

export type Db = typeof db;
