import { Router } from 'express';
import { analyzeLocationPotential } from '../services/analysis.service';
const router = Router();
router.post('/analyze', async (req, res) => {
    try {
        const { lat, lng, weights } = req.body;
        // Memanggil fungsi hitung bobot yang sudah kita buat di analysis.service.ts
        const result = await analyzeLocationPotential(lat, lng, weights);
        // Kirim kembali hasilnya ke frontend
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: 'Terjadi kesalahan di server' });
    }
});
export default router;
