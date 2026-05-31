import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  // 👇 Ubah baris ini menjadi persis seperti ini:
  schema: './src/db/schema.ts', 
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://postgres:password123@localhost:5432/brewmap_db",
  },
});