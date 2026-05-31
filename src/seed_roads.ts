import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sql } from 'drizzle-orm';
import { db } from './config/database'; 

// 🔥 Trik khusus untuk memunculkan kembali __dirname di ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedRoads() {
  const geojsonPath = path.join(__dirname, 'data', 'road.geojson');
  
  if (!fs.existsSync(geojsonPath)) {
    console.error(`❌ File tidak ditemukan di rute: ${geojsonPath}`);
    return;
  }

  const rawData = fs.readFileSync(geojsonPath, 'utf8');
  const geojson = JSON.parse(rawData);

  console.log(`🚀 Memulai injeksi ${geojson.features.length} segmen jalan... (Ini mungkin memakan waktu sebentar)`);

  for (const feature of geojson.features) {
    const name = feature.properties?.name || feature.properties?.REMARK || 'Jalan Tanpa Nama';
    const geomStr = JSON.stringify(feature.geometry);

    try {
      await db.execute(sql`
        INSERT INTO roads (name, geom)
        VALUES (${name}, ST_SetSRID(ST_GeomFromGeoJSON(${geomStr}), 4326))
      `);
    } catch (err) {
      console.error(`Gagal memasukkan segmen jalan: ${name}`, err);
    }
  }

  console.log('✅ BINGO! Semua data jaringan jalan berhasil dimasukkan ke PostGIS!');
  process.exit(0);
}

seedRoads().catch(console.error);