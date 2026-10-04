import { config } from "dotenv";

config({ path: ".env.local" });
const host = new URL(process.env.DATABASE_URL ?? "postgres://missing").hostname;
console.log(`[db tests] database host: ${host}`);
