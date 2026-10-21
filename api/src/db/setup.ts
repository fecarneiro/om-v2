import { db } from "./client.js";
import { vendedores } from "./schema.js";
import { seed } from "./seed.js";

const [vendedor] = await db.select().from(vendedores).limit(1);

if (vendedor) {
  console.log("Banco já populado, seed ignorado");
} else {
  await seed(db);
  console.log("Seed concluído");
}

await db.$client.end();
