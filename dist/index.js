import express from 'express';
import cors from 'cors';
import locationRoutes from './routes/locations.routes';
import { regionsRouter } from './routes/regions.routes'; // 1. Tambahkan import ini
const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Brewmap Intelligence API is running!' });
});
// Daftarkan rute lokasi
app.use('/api/locations', locationRoutes);
// 2. Daftarkan rute wilayah (regions) di sini
app.use('/api/regions', regionsRouter);
app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
