import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sql } from 'drizzle-orm';
import { db } from './config/database';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
async function seedPopulation() {
    const csvPath = path.join(__dirname, 'data', 'penduduk.csv');
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ File tidak ditemukan di: ${csvPath}`);
        return;
    }
    const rawData = fs.readFileSync(csvPath, 'utf8');
    const rows = rawData.split('\n');
    console.log('🚀 Memulai sinkronisasi data penduduk ke database...');
    let suksesCount = 0;
    // Membaca baris demi baris (melewati baris pertama jika itu header)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row)
            continue;
        // Memisahkan kolom menggunakan koma atau titik koma (tergantung regional setting Excel)
        const columns = row.includes(';') ? row.split(';') : row.split(',');
        // Sesuaikan indeks kolom ini dengan struktur file CSV Anda:
        // Asumsi format: Kecamatan, Kelurahan, Kabupaten, Jumlah Penduduk
        const kecamatan = columns[0]?.trim();
        const kelurahan = columns[1]?.trim().replace('Kelurahan ', '').replace('Desa ', '');
        const jumlahPenduduk = parseInt(columns[3]?.trim().replace(/\D/g, ''), 10);
        if (kelurahan && !isNaN(jumlahPenduduk)) {
            try {
                // Update database berdasarkan kecocokan nama kelurahan
                await db.execute(sql `
          UPDATE regions 
          SET population = ${jumlahPenduduk}
          WHERE LOWER(name) LIKE LOWER(${'%' + kelurahan + '%'})
        `);
                suksesCount++;
            }
            catch (err) {
                console.error(`❌ Gagal update wilayah: ${kelurahan}`, err);
            }
        }
    }
    console.log(`\n✅ BERHASIL! Sukses memperbarui ${suksesCount} data demografi kelurahan!`);
    process.exit(0);
}
seedPopulation().catch(console.error);
