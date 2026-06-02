import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateLocationAnalysis(
  locationName: string,
  score: number,
  competitorCount: number,
  marketPotential: number
) {
  try {
    // Ambil API Key dari Environment Variable
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY tidak ditemukan");
    }

    console.log("Gemini Key Loaded:", apiKey.substring(0, 10) + "...");

    // Inisialisasi Gemini
    const genAI = new GoogleGenerativeAI(apiKey);

    // Gunakan model terbaru
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
    });

    const prompt = `
Bertindaklah sebagai konsultan lokasi bisnis dan analis geospasial profesional.

Berikut hasil analisis suatu area:

- Nama Area: ${locationName}
- Skor Kesesuaian Lokasi: ${score}/100
- Jumlah Kompetitor Terdekat: ${competitorCount}
- Tingkat Potensi Pasar: ${marketPotential}

TUGAS:
Buat satu paragraf singkat (maksimal 4 kalimat) yang menjelaskan kelebihan, peluang, atau risiko lokasi tersebut berdasarkan data yang tersedia. Gunakan bahasa profesional dan mudah dipahami, seperti laporan untuk investor atau pengambil keputusan.
`;

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    return response;
  } catch (error) {
    console.error("Gemini Error:", error);

    return `Analisis AI tidak tersedia: ${
      error instanceof Error ? error.message : "Unknown Error"
    }`;
  }
}