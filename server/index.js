import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mediumRoutes from './routes/medium.js';
import tistoryRoutes from './routes/tistory.js';
import wordpressRoutes from './routes/wordpress.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for large content

// Routes
app.get('/', (req, res) => {
    res.send('ProInsight AI Server is running');
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is healthy' });
});

// API Routes
app.use('/api/medium', mediumRoutes);
app.use('/api/tistory', tistoryRoutes);
app.use('/api/wordpress', wordpressRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
