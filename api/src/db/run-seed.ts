import { db } from "./client.js";
import { seed } from "./seed.js";

await seed(db);
console.log("Seed concluído");
await db.$client.end();
