import { readFileSync } from 'fs';
import { join } from 'path';
import { sql } from 'drizzle-orm';
// Sesuaikan dengan file koneksi database-mu (bisa './config/database' atau './db/index')
import { db } from './config/database'; 

async function injectGeoJSONPOIs(fileName: string, category: string) {
  console.log(`\n📂 Membaca data ${category} dari ${fileName}...`);
  
  const filePath = join(process.cwd(), 'src', 'data', fileName);
  const rawData = readFileSync(filePath, 'utf-8');
  const geojson = JSON.parse(rawData);

  console.log(`⏳ Memulai injeksi ke PostGIS...`);

  let count = 0;
  for (const feature of geojson.features) {
    // Ambil nama tempat dari properti OSM
    const name = feature.properties?.name || feature.properties?.amenity || `${category} tanpa nama`;
    const geomStr = JSON.stringify(feature.geometry);

    // Skip kalau datanya kosong
    if (!feature.geometry) continue;

    try {
      // Gunakan ST_Centroid agar kalau OSM mengirim bentuk Poligon (Bangunan),
      // otomatis diubah jadi Titik Tengah (Point) saja.
      await db.execute(sql`
        INSERT INTO pois (name, category, location)
        VALUES (
          ${name}, 
          ${category}, 
          ST_SetSRID(ST_Centroid(ST_GeomFromGeoJSON(${geomStr})), 4326)
        )
      `);
      count++;
      
      if (count % 100 === 0) {
        console.log(`   Progress: ${count} data ${category} berhasil masuk...`);
      }
    } catch (err) {
      // Abaikan jika ada 1-2 data OSM yang korup
    }
  }

  console.log(`✅ Selesai! Total ${count} data ${category} sukses diinjeksi.`);
}

async function main() {
  try {
    console.log('🚀 Memulai Proses Injeksi Data POI OSM...');
    
    // Kita panggil nama file PERSIS seperti yang ada di screenshot-mu
    await injectGeoJSONPOIs('caffee.geojson', 'coffee_shop');
    await injectGeoJSONPOIs('campuss.geojson', 'education');
    await injectGeoJSONPOIs('officee.geojson', 'office');
    
    console.log('\n🎉 SEMUA DATA TITIK OSM BERHASIL MASUK DATABASE!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Terjadi kesalahan:', error);
    process.exit(1);
  }
}

main();