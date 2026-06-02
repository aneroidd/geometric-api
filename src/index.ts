import express from 'express';
import cors from 'cors';
import locationRoutes from './routes/locations.routes.js'; 
import { regionsRouter } from './routes/regions.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // 🔥 Sudah terpasang dengan benar!

// Mengubah sisa nama Brewmap menjadi GeoMetric
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'GeoMetric API is running!' });
});

app.use('/api/locations', locationRoutes);
app.use('/api/regions', regionsRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});