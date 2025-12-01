import express from 'express';
import axios from 'axios';

const router = express.Router();

// Medium Publishing Endpoint
router.post('/publish', async (req, res) => {
    const { token, title, content, tags } = req.body;

    if (!token) {
        return res.status(400).json({ error: 'Medium Integration Token is required' });
    }

    try {
        // 1. Get User ID
        const userResponse = await axios.get('https://api.medium.com/v1/me', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const userId = userResponse.data.data.id;

        // 2. Create Post
        const postResponse = await axios.post(`https://api.medium.com/v1/users/${userId}/posts`, {
            title,
            contentFormat: 'markdown',
            content,
            tags: tags || [],
            publishStatus: 'draft' // Always publish as draft first for safety
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        res.json({ success: true, url: postResponse.data.data.url });
    } catch (error) {
        console.error('Medium Publish Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to publish to Medium', details: error.response?.data });
    }
});

export default router;
