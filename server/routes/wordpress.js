import express from 'express';
import axios from 'axios';

const router = express.Router();

// WordPress Publishing Endpoint
router.post('/publish', async (req, res) => {
    const { siteUrl, username, password, title, content, tags } = req.body;

    if (!siteUrl || !username || !password) {
        return res.status(400).json({ error: 'Site URL, Username, and Application Password are required' });
    }

    // Ensure siteUrl has protocol
    let baseUrl = siteUrl.trim();
    if (!baseUrl.startsWith('http')) {
        baseUrl = `https://${baseUrl}`;
    }
    // Remove trailing slash
    baseUrl = baseUrl.replace(/\/$/, '');

    try {
        // 1. Prepare Auth Header (Basic Auth)
        const auth = Buffer.from(`${username}:${password}`).toString('base64');

        // 2. Create Post
        const response = await axios.post(`${baseUrl}/wp-json/wp/v2/posts`, {
            title,
            content,
            status: 'draft', // Publish as draft for safety
            // tags: tags // Tag handling in WP requires tag IDs, skipping for MVP simplicity or need to fetch/create tags first
        }, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            }
        });

        res.json({ success: true, url: response.data.link });
    } catch (error) {
        console.error('WordPress Publish Error:', error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || error.message;
        res.status(500).json({ error: 'Failed to publish to WordPress', details: errorMessage });
    }
});

export default router;
