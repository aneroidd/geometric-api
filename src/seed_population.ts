import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sql } from 'drizzle-orm';
import { db } from './config/database'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedPopulation() {
  // Pastikan nama filenya benar (penduduk.csv)
  const csvPath = path.join(__dirname, 'data', 'penduduk.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File tidak ditemukan di rute: ${csvPath}`);
    return;
  }

  const rawData = fs.readFileSync(csvPath, 'utf8');
  // Membaca CSV dan memecahnya per baris (menghilangkan baris kosong)
  const lines = rawData.split(/\r?\n/).filter(line => line.trim() !== '');

  if (lines.length < 2) {
    console.error('❌ File CSV kosong atau hanya berisi header.');
    return;
  }

  // Baris pertama pasti Header (Nama Kolom)
  const headers = lines[0].split(',').map(h => h.trim());
  console.log(`📊 Kolom terdeteksi: [${headers.join(', ')}]`);
  console.log(`🚀 Memulai injeksi ${lines.length - 1} data penduduk...`);

  // 1. BUAT WADAH BERSIH (Tabel penduduk)
  console.log(`🧹 Membersihkan dan menyiapkan tabel penduduk...`);
  await db.execute(sql.raw(`
    DROP TABLE IF EXISTS penduduk CASCADE;
    CREATE TABLE penduduk (
        id SERIAL PRIMARY KEY,
        region_name TEXT,
        -- Kita gunakan JSONB agar semua angka/data fleksibel masuk ke sini
        data JSONB 
    );
  `));
  console.log(`✅ Tabel penduduk baru siap!`);

  // 2. SISTEM KLOTER BATCHING
  const BATCH_SIZE = 100;
  let successCount = 0;

  // Kita mulai dari index 1 karena index 0 adalah header
  for (let i = 1; i < lines.length; i += BATCH_SIZE) {
    const batch = lines.slice(i, i + BATCH_SIZE);
    const values: string[] = [];

    batch.forEach((line) => {
      // Pecah baris berdasarkan koma
      const cols = line.split(',').map(c => c.trim().replace(/'/g, "''")); // Sanitasi
      
      // Asumsi: Kolom pertama di CSV Anda adalah nama Kelurahan/Desa
      const regionName = cols[0] || 'Tanpa Nama';

      // Bungkus semua kolom menjadi satu format JSON
      const jsonData: Record<string, string> = {};
      headers.forEach((header, index) => {
        jsonData[header] = cols[index] || '';
      });

      // Susun query per baris
      values.push(`('${regionName}', '${JSON.stringify(jsonData)}')`);
    });

    const query = `INSERT INTO penduduk (region_name, data) VALUES ${values.join(', ')}`;

    try {
      await db.execute(sql.raw(query));
      successCount += batch.length;
      console.log(`🚀 Berhasil mengunggah: ${successCount} / ${lines.length - 1} wilayah...`);
    } catch (err) {
      console.error(`❌ Gagal di kloter ke-${i}:`, err);
    }
  }

  console.log('✅ BINGO! Semua data Penduduk berhasil dimasukkan ke database!');
  process.exit(0);
}

seedPopulation().catch(console.error);