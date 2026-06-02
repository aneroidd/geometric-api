import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateLocationAnalysis(
  locationName: string, 
  score: number, 
  competitorCount: number, 
  marketPotential: number
) {
  try {
    // 🔥 HAPUS KUNCI HARDCODE, BIARKAN CLOUD RUN YANG MENGISINYA NANTI
    const rawKey = process.env.GEMINI_API_KEY || '';
    const apiKey = rawKey.trim();

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // NAMA MODEL HARUS SAMA PERSIS DENGAN CURL (TANPA ANGKA 1.5)
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
      Bertindaklah sebagai konsultan tata kota dan analis bisnis profesional. 
      Saya sedang menganalisis sebuah area untuk ekspansi bisnis.
      Berikut adalah data spasial area tersebut:
      - Nama Area: ${locationName}
      - Skor Kesesuaian Lokasi: ${score} / 100
      - Jumlah Kompetitor Terdekat: ${competitorCount} titik
      - Tingkat Potensi Pasar/Keramaian: ${marketPotential}

      TUGAS:
      Buat SATU paragraf singkat (maksimal 3-4 kalimat) yang menjelaskan secara profesional, tajam, dan meyakinkan mengapa lokasi ini potensial ATAU apa risikonya berdasarkan data di atas. Jangan gunakan format tebal/miring berlebihan, buat narasi mengalir seperti laporan eksekutif.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
    
  } catch (error) {
    const errMessage = (error as Error).message;
    console.error("Gagal memanggil Gemini AI:", errMessage);
    return `Koneksi AI gagal: ${errMessage}`;
  }
}