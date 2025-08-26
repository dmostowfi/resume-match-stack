const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
const AI_BASE_URL = 'http://localhost:8000'; // Base URL of your FastAPI service

// Middleware
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.send('API is running');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});


// POST /api/match -> forward request to FastAPI /match
app.post('/api/match', async (req, res) => {
  try {
    // Basic validation
    const { resume, jd } = req.body || {};
    if (!resume || !jd) {
      return res.status(400).json({ error: 'resume and job description are required' });
    }

    // Forward request to FastAPI
    const matchResponse = await fetch(`${AI_BASE_URL}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resume, jd}),
    });

    // relay FastAPI response / status code
    const data = await matchResponse.json();
    return res.status(matchResponse.status).json(data);
  } 
  catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).json({ error: 'FastAPI service error' });
  }
});
