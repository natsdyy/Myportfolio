const express = require('express');
const router = express.Router();
const { processUserQuery } = require('../agents/searchAgent');

router.post('/chat', async (req, res) => {
    const { query, history } = req.body;

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const result = await processUserQuery(query, history || []);
        res.json(result);
    } catch (error) {
        console.error('Chat Route Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
