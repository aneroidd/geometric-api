import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
// Koneksi langsung terhubung ke brewmap_db
const pool = new Pool({
    connectionString: "postgresql://postgres:Pulokulon1@localhost:5432/brewmap_db"
});
const db = drizzle(pool);
async function seedCompleteData() {
    console.log('🚀 Memulai Proses Injeksi Skala Besar: Provinsi DI Yogyakarta...');
    try {
        const filePath = path.join(process.cwd(), 'data', 'DIY.geojson');
        if (!fs.existsSync(filePath)) {
            throw new Error(`File tidak ditemukan di: ${filePath}.`);
        }
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const geojson = JSON.parse(rawData);
        const features = geojson.features;
        console.log(`📂 Berhasil membaca ${features.length} data batas administrasi kelurahan.`);
        const provId = crypto.randomUUID();
        const mapKabupaten = new Map();
        const mapKecamatan = new Map();
        await db.execute(sql `
      INSERT INTO regions (id, name, level) 
      VALUES (${provId}, 'DI Yogyakarta', 'province')
      ON CONFLICT DO NOTHING;
    `);
        let count = 0;
        for (const feature of features) {
            const kabName = feature.properties.KABUPATEN || feature.properties.WADMKK;
            const kecName = feature.properties.KECAMATAN || feature.properties.WADMKC;
            const kelName = feature.properties.NAMOBJ || feature.properties.DESA || feature.properties.KELURAHAN;
            if (!kabName || !kecName || !kelName)
                continue;
            let kabId = mapKabupaten.get(kabName);
            if (!kabId) {
                kabId = crypto.randomUUID();
                await db.execute(sql `
          INSERT INTO regions (id, name, level, parent_id) 
          VALUES (${kabId}, ${kabName}, 'city', ${provId})
        `);
                mapKabupaten.set(kabName, kabId);
            }
            const kecKey = `${kabName}-${kecName}`;
            let kecId = mapKecamatan.get(kecKey);
            if (!kecId) {
                kecId = crypto.randomUUID();
                await db.execute(sql `
          INSERT INTO regions (id, name, level, parent_id) 
          VALUES (${kecId}, ${kecName}, 'kecamatan', ${kabId})
        `);
                mapKecamatan.set(kecKey, kecId);
            }
            const kelId = crypto.randomUUID();
            const geomString = JSON.stringify(feature.geometry);
            // Transformasi Final: ST_Force2D membuang sumbu Z agar sesuai dengan tabel 2D
            await db.execute(sql `
        INSERT INTO regions (id, name, level, parent_id, boundary, center) 
        VALUES (
          ${kelId}, 
          ${kelName}, 
          'kelurahan', 
          ${kecId}, 
          ST_Multi(ST_Force2D(ST_GeomFromGeoJSON(${geomString}))), 
          ST_Centroid(ST_Force2D(ST_GeomFromGeoJSON(${geomString})))
        )
      `);
            count++;
            if (count % 50 === 0) {
                console.log(`⏳ Progress: ${count} kelurahan berhasil dimasukkan...`);
            }
        }
        console.log(`✅ BOOM! Selesai. Total ${count} wilayah se-DIY berhasil masuk ke PostGIS!`);
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Gagal melakukan injeksi data:', error);
        process.exit(1);
    }
}
seedCompleteData();
