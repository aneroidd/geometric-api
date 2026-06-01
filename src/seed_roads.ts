import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sql } from 'drizzle-orm';
import { db } from './config/database'; 

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
  const features = geojson.features;

  console.log(`🚀 Memulai injeksi ${features.length} segmen jalan...`);

  console.log(`🧹 Membersihkan dan menyiapkan tabel roads...`);
  await db.execute(sql.raw(`
    DROP TABLE IF EXISTS roads CASCADE;
    CREATE TABLE roads (
        id SERIAL PRIMARY KEY,
        name TEXT,
        geom GEOMETRY(Geometry, 4326)
    );
    CREATE INDEX idx_roads_geom ON roads USING GIST (geom);
  `));
  console.log(`✅ Tabel roads baru siap!`);

  const BATCH_SIZE = 100;
  let successCount = 0;
  let isError = false;

  for (let i = 0; i < features.length; i += BATCH_SIZE) {
    const batch = features.slice(i, i + BATCH_SIZE);
    const values: string[] = [];

    batch.forEach((feature: any) => {
      let name = feature.properties?.name || feature.properties?.REMARK || 'Jalan Tanpa Nama';
      name = name.replace(/'/g, "''"); 
      const coords = JSON.stringify(feature.geometry);
      
      // 🔥 KUNCI PENYELESAIANNYA ADA DI SINI: ST_Force2D 🔥
      // Berfungsi untuk membuang dimensi Z (Ketinggian) agar jalan menjadi flat 2D
      values.push(`('${name}', ST_SetSRID(ST_Force2D(ST_GeomFromGeoJSON('${coords}')), 4326))`);
    });

    const query = `INSERT INTO roads (name, geom) VALUES ${values.join(', ')}`;

    try {
      await db.execute(sql.raw(query));
      successCount += batch.length;
      console.log(`🚀 Berhasil mengunggah: ${successCount} / ${features.length} jalan...`);
    } catch (err) {
      console.error(`❌ GAGAL FATAL! PostGIS menolak data:`, err);
      isError = true;
      break; // Hentikan paksa perulangan jika ada error!
    }
  }

  if (isError) {
    console.log('⚠️ PROSES TERHENTI Kkarena ada error. Data tidak masuk semua.');
    process.exit(1);
  } else {
    console.log('✅ BINGO BENERAN! Semua data jaringan jalan berhasil dimasukkan ke PostGIS!');
    process.exit(0);
  }
}

seedRoads().catch(console.error);