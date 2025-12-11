import express from 'express';
import axios from 'axios';

const router = express.Router();

// Naver Blog uses XML-RPC (MetaWeblog API)
// Endpoint: https://api.blog.naver.com/xmlrpc

router.post('/publish', async (req, res) => {
    const { naverId, apiKey, title, content, tags } = req.body;

    if (!naverId || !apiKey) {
        return res.status(400).json({ error: 'Naver ID and API Key are required' });
    }

    try {
        // 1. Escape HTML special characters for XML
        const escapeXml = (str) => {
            return str.replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        };

        const escapedTitle = escapeXml(title);
        // Naver content usually accepts HTML, but wrapped in CDATA is safer, 
        // or just standard XML escaping. Let's try CDATA for content to preserve HTML formatting.
        const escapedContent = `<![CDATA[${content}]]>`;

        // 2. Construct XML Payload (metaWeblog.newPost)
        const xmlData = `<?xml version="1.0"?>
        <methodCall>
            <methodName>metaWeblog.newPost</methodName>
            <params>
                <param><value><string>${naverId}</string></value></param> <!-- BlogID (usually same as UserID) -->
                <param><value><string>${naverId}</string></value></param> <!-- Username -->
                <param><value><string>${apiKey}</string></value></param> <!-- API Password -->
                <param>
                    <value>
                        <struct>
                            <member>
                                <name>title</name>
                                <value><string>${escapedTitle}</string></value>
                            </member>
                            <member>
                                <name>description</name>
                                <value><string>${escapedContent}</string></value>
                            </member>
                            <member>
                                <name>categories</name>
                                <value><array><data></data></array></value>
                            </member>
                            <member>
                                <name>tags</name>
                                <value><string>${tags ? tags.join(',') : ''}</string></value>
                            </member>
                            <member>
                                <name>publish</name>
                                <value><boolean>0</boolean></value> <!-- 0 = Private/Draft (Safe Default) -->
                            </member>
                        </struct>
                    </value>
                </param>
                <param><value><boolean>0</boolean></value></param> <!-- Publish Immediately? 0=False -->
            </params>
        </methodCall>`;

        // 3. Send Request
        const response = await axios.post('https://api.blog.naver.com/xmlrpc', xmlData, {
            headers: {
                'Content-Type': 'text/xml',
                'User-Agent': 'ProInsightAI-Client'
            }
        });

        // 4. Parse Response (Simple Regex)
        // Success response format:
        // <methodResponse><params><param><value><string>POST_ID</string></value></param></params></methodResponse>
        const responseText = response.data;

        if (responseText.includes('faultCode')) {
            throw new Error(`Naver API Fault: ${responseText}`);
        }

        // Extract Post ID (it returns string like "1234567890")
        const match = responseText.match(/<string>(\d+)<\/string>/);
        const postId = match ? match[1] : null;

        if (postId) {
            // Construct URL: https://blog.naver.com/{details.naverId}/{postId}
            const postUrl = `https://blog.naver.com/${naverId}/${postId}`;
            res.json({ success: true, url: postUrl });
        } else {
            throw new Error('Failed to parse Post ID from Naver response');
        }

    } catch (error) {
        console.error('Naver Publish Error:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to publish to Naver Blog', details: error.message });
    }
});

export default router;
