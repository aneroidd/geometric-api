export async function generateLocationAnalysis(
  locationName: string, 
  score: number, 
  competitorCount: number, 
  marketPotential: number
) {
  try {
    // .trim() akan otomatis membuang spasi kosong yang tidak sengaja ikut ter-copy
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    
    if (!apiKey) {
      console.error("API Key kosong!");
      return "Error: Kunci API Gemini belum terdeteksi di server.";
    }

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

    // Meniru persis cURL dari Google AI Studio Anda
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    // Jika masih gagal, kita akan tahu persis alasannya
    if (!response.ok) {
      console.error("Detail Error Gemini:", data);
      return "Maaf, kunci API ditolak oleh Google. Silakan periksa kembali di Google Cloud Run.";
    }

    // Mengambil jawaban dari AI
    return data.candidates[0].content.parts[0].text;
    
  } catch (error) {
    console.error("Gagal memanggil Gemini AI:", error);
    return "Maaf, Asisten AI sedang mengalami kendala server. Silakan coba beberapa saat lagi.";
  }
}