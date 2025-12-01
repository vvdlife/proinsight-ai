import express from 'express';
import axios from 'axios';

const router = express.Router();

// Tistory OAuth Configuration (Should be in .env)
const TISTORY_APP_ID = process.env.TISTORY_APP_ID;
const TISTORY_SECRET_KEY = process.env.TISTORY_SECRET_KEY;
const TISTORY_REDIRECT_URI = process.env.TISTORY_REDIRECT_URI || 'http://localhost:3001/api/tistory/callback';

// 1. Redirect to Tistory Login
router.get('/auth', (req, res) => {
    if (!TISTORY_APP_ID) {
        return res.status(500).send('Tistory App ID is not configured on the server.');
    }
    const authUrl = `https://www.tistory.com/oauth/authorize?client_id=${TISTORY_APP_ID}&redirect_uri=${TISTORY_REDIRECT_URI}&response_type=code`;
    res.redirect(authUrl);
});

// 2. Callback handling
router.get('/callback', async (req, res) => {
    const { code } = req.query;

    if (!code) {
        return res.status(400).send('No code provided');
    }

    try {
        const response = await axios.get('https://www.tistory.com/oauth/access_token', {
            params: {
                client_id: TISTORY_APP_ID,
                client_secret: TISTORY_SECRET_KEY,
                redirect_uri: TISTORY_REDIRECT_URI,
                code,
                grant_type: 'authorization_code'
            }
        });

        const accessToken = response.data.access_token;

        // In a real app, we would save this token to a DB associated with the user session.
        // For this MVP, we'll redirect back to the frontend with the token in the URL (Not secure for production, but functional for local tool).
        res.redirect(`http://localhost:5173?tistory_token=${accessToken}`);
    } catch (error) {
        console.error('Tistory Auth Error:', error.response?.data || error.message);
        res.status(500).send('Authentication failed');
    }
});

// 3. Publish Post
router.post('/publish', async (req, res) => {
    const { accessToken, title, content, tags, blogName } = req.body;

    if (!accessToken || !blogName) {
        return res.status(400).json({ error: 'Access Token and Blog Name are required' });
    }

    try {
        const response = await axios.post('https://www.tistory.com/apis/post/write', {
            access_token: accessToken,
            output: 'json',
            blogName,
            title,
            content,
            visibility: 0, // 0: Private (Secret), 3: Public
            tag: tags ? tags.join(',') : ''
        });

        res.json({ success: true, url: response.data.tistory.url });
    } catch (error) {
        console.error('Tistory Publish Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to publish to Tistory', details: error.response?.data });
    }
});

export default router;
