import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateLocationAnalysis(
  locationName: string, 
  score: number, 
  competitorCount: number, 
  marketPotential: number
) {
  try {
    // Menarik kunci langsung dari mesin Cloud Run
    const apiKey = process.env.GEMINI_API_KEY || '';
    
    if (!apiKey) {
      console.error("API Key kosong!");
      return "Error: Kunci API Gemini belum terdeteksi di server.";
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 🔥 SOLUSI UTAMA: Kita gunakan Gemini 1.5 Pro (Model paling tangguh)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
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
    console.error("Gagal memanggil Gemini AI:", error);
    return "Maaf, Asisten AI sedang mengalami kendala server. Silakan coba beberapa saat lagi.";
  }
}