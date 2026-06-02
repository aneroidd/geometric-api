import { GoogleGenerativeAI } from '@google/generative-ai';

// Mengambil kunci dari file .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateLocationAnalysis(
  locationName: string, 
  score: number, 
  competitorCount: number, 
  marketPotential: number
) {
  try {
    // Kita gunakan model Gemini Flash yang sangat cepat
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Ini adalah 'Prompt Engineering' yang tersembunyi dari klien
    const prompt = `
      Bertindaklah sebagai konsultan tata kota dan analis bisnis profesional. 
      Saya sedang menganalisis sebuah area untuk ekspansi bisnis.
      Berikut adalah data spasial area tersebut:
      - Nama Kelurahan/Area: ${locationName}
      - Skor Kesesuaian Lokasi: ${score} / 100
      - Jumlah Kompetitor Terdekat: ${competitorCount} titik
      - Tingkat Potensi Pasar/Keramaian: ${marketPotential}

      TUGAS:
      Buat SATU paragraf singkat (maksimal 3-4 kalimat) yang menjelaskan secara profesional, tajam, dan meyakinkan mengapa lokasi ini potensial ATAU apa risikonya berdasarkan data di atas. Jangan gunakan format tebal/miring berlebihan, buat narasi mengalir seperti laporan eksekutif.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
    
  } catch (error) {
    console.error("Gagal memanggil Gemini AI:", error);
    return "Analisis AI saat ini tidak tersedia karena gangguan jaringan.";
  }
}