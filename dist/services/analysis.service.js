export const analyzeLocationPotential = async (lat, lng, weights) => {
    // 1. DATA LAPANGAN (MOCK)
    // Nantinya, nilai ini didapat dari database PostGIS berdasarkan koordinat (lat, lng) yang diklik.
    // Untuk sekarang kita anggap lokasi yang diklik punya skor mentah (0-100) seperti ini:
    const dataLapangan = {
        skorPenduduk: 80, // Area ini cukup padat
        skorDayaBeli: 70, // Menengah ke atas
        skorAkses: 85, // Dekat jalan raya
        skorKompetitor: 60, // Lumayan banyak kedai kopi lain
    };
    // 2. PROSES PEMBOBOTAN (Weighted Overlay)
    // Nilai lapangan dikalikan dengan bobot slider (dibagi 100 untuk jadikan desimal)
    const nilaiPenduduk = dataLapangan.skorPenduduk * (weights.kepadatanPenduduk / 100);
    const nilaiDayaBeli = dataLapangan.skorDayaBeli * (weights.dayaBeli / 100);
    const nilaiAkses = dataLapangan.skorAkses * (weights.aksesibilitas / 100);
    // Karena bobot kompetitor dikirim sebagai minus (-40%), hasil kalinya akan otomatis mengurangi skor akhir
    const nilaiKompetitor = dataLapangan.skorKompetitor * (weights.kepadatanKompetitor / 100);
    // 3. KALKULASI SKOR AKHIR
    const totalScore = nilaiPenduduk + nilaiDayaBeli + nilaiAkses + nilaiKompetitor;
    // Pastikan skor akhir tidak lebih dari 100 atau kurang dari 0
    const skorFinal = Math.max(0, Math.min(100, totalScore));
    return {
        koordinat: { lat, lng },
        skorPeluangCuan: Math.round(skorFinal),
        rincian: {
            penduduk: nilaiPenduduk.toFixed(1),
            dayaBeli: nilaiDayaBeli.toFixed(1),
            aksesibilitas: nilaiAkses.toFixed(1),
            pengurangKompetitor: nilaiKompetitor.toFixed(1) // Akan tampil sebagai angka minus
        }
    };
};
