import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { categories, merchantMappings } from "../src/db/schema";
import path from "path";
import fs from "fs";

const dbPath = path.join(process.cwd(), "data", "gastos.db");
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

const db = drizzle(sqlite);

const defaultCategories = [
  { name: "HIPOTECA", color: "#ef4444", icon: "home" },
  { name: "COMIDA", color: "#f97316", icon: "utensils" },
  { name: "GASOLINA", color: "#eab308", icon: "fuel" },
  { name: "LUZ", color: "#facc15", icon: "zap" },
  { name: "AGUA", color: "#06b6d4", icon: "droplets" },
  { name: "GAS", color: "#f59e0b", icon: "flame" },
  { name: "INTERNET", color: "#8b5cf6", icon: "wifi" },
  { name: "TELEFONO", color: "#a855f7", icon: "phone" },
  { name: "SEGUROS", color: "#6366f1", icon: "shield" },
  { name: "OCIO", color: "#ec4899", icon: "gamepad-2" },
  { name: "ROPA", color: "#d946ef", icon: "shirt" },
  { name: "SALUD", color: "#10b981", icon: "heart-pulse" },
  { name: "TRANSPORTE", color: "#14b8a6", icon: "car" },
  { name: "EDUCACION", color: "#3b82f6", icon: "graduation-cap" },
  { name: "SUSCRIPCIONES", color: "#6d28d9", icon: "repeat" },
  { name: "RESTAURANTES", color: "#e11d48", icon: "chef-hat" },
  { name: "HOGAR", color: "#78716c", icon: "sofa" },
  { name: "MASCOTAS", color: "#84cc16", icon: "paw-print" },
  { name: "NOMINA", color: "#22c55e", icon: "banknote" },
  { name: "OTROS INGRESOS", color: "#16a34a", icon: "plus-circle" },
  { name: "OTROS", color: "#9ca3af", icon: "help-circle" },
];

const defaultMerchantMappings = [
  { merchantPattern: "MERCADONA", categoryName: "COMIDA" },
  { merchantPattern: "LIDL", categoryName: "COMIDA" },
  { merchantPattern: "ALDI", categoryName: "COMIDA" },
  { merchantPattern: "CARREFOUR", categoryName: "COMIDA" },
  { merchantPattern: "DIA %", categoryName: "COMIDA" },
  { merchantPattern: "REPSOL", categoryName: "GASOLINA" },
  { merchantPattern: "CEPSA", categoryName: "GASOLINA" },
  { merchantPattern: "BP ", categoryName: "GASOLINA" },
  { merchantPattern: "GASOLINERA", categoryName: "GASOLINA" },
  { merchantPattern: "AMAZON", categoryName: "HOGAR" },
  { merchantPattern: "NETFLIX", categoryName: "SUSCRIPCIONES" },
  { merchantPattern: "SPOTIFY", categoryName: "SUSCRIPCIONES" },
  { merchantPattern: "HBO", categoryName: "SUSCRIPCIONES" },
  { merchantPattern: "DISNEY", categoryName: "SUSCRIPCIONES" },
  { merchantPattern: "FARMACIA", categoryName: "SALUD" },
  { merchantPattern: "ZARA", categoryName: "ROPA" },
  { merchantPattern: "PRIMARK", categoryName: "ROPA" },
  { merchantPattern: "DECATHLON", categoryName: "ROPA" },
  { merchantPattern: "IKEA", categoryName: "HOGAR" },
  { merchantPattern: "LEROY MERLIN", categoryName: "HOGAR" },
];

async function seed() {
  console.log("Seeding categories...");

  for (const cat of defaultCategories) {
    db.insert(categories)
      .values(cat)
      .onConflictDoNothing({ target: categories.name })
      .run();
  }

  console.log(`  ${defaultCategories.length} categories seeded`);

  console.log("Seeding merchant mappings...");

  const allCategories = db.select().from(categories).all();
  const categoryMap = new Map(allCategories.map((c) => [c.name, c.id]));

  for (const mapping of defaultMerchantMappings) {
    const categoryId = categoryMap.get(mapping.categoryName);
    if (categoryId) {
      db.insert(merchantMappings)
        .values({
          merchantPattern: mapping.merchantPattern,
          categoryId,
        })
        .onConflictDoNothing({ target: merchantMappings.merchantPattern })
        .run();
    }
  }

  console.log(`  ${defaultMerchantMappings.length} merchant mappings seeded`);
  console.log("Done!");
}

seed();
