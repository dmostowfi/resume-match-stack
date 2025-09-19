// load env variables from .env file
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
//console.log(process.env)

const express = require('express');
const { Pool } = require('pg');


const app = express();
const PORT = process.env.PORT || 3000;
const AI_BASE_URL = process.env.AI_BASE_URL || 'http://localhost:8000'; // Base URL of your FastAPI service

// Database connection
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

// Middleware
app.use(express.json());

// Start server
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Root route
app.get('/', (req, res) => {
    res.send('API is running');
});

// POST /fastapi/match -> forward request to FastAPI /match
app.post('/fastapi/match', async (req, res) => {
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

// POST /fastapi/match-top-k -> forward JD request to FastAPI /embed and return top-K candidates with similarity score
app.post('/fastapi/match-top-k', async (req, res) => {
  try {
    // Basic validation
    const { jd, k } = req.body || {};
    if (!jd) {
      return res.status(400).json({ error: 'Job description required' });
    }

    // Forward request to FastAPI
    const EmbedResponse = await fetch(`${AI_BASE_URL}/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: jd }),
    });
    // relay FastAPI response / status code
    const {embedding} = await EmbedResponse.json();
    //return res.status(EmbedResponse.status).json(embedding);
    
    // open DB connection and perform similarity search using pgvector distance <=> operator
    const vectorLiteral = '[' + embedding.join(',') + ']';
    const sql = `
      SELECT
          r.id,
          r.candidate_id,
          LEFT(r.text, 160) AS snippet,
          (e.embedding <=> $1::vector) AS distance
        FROM resumes r
        JOIN resume_embeddings e ON e.resume_id = r.id
        ORDER BY distance ASC;
      `;

    // $1 and $2 are parameter placeholders to prevent SQL injection
    const { rows } = await pool.query(sql, [vectorLiteral]);
    console.log(rows)

    //TODO: allow SQL query to limit results to top-K, for now just slice in JS
    const results = rows.slice(0, k).map(r => ({
      candidate_id: r.candidate_id,
      snippet: r.snippet,
      distance: Number(r.distance),
      similarity: Number((1 - Number(r.distance)).toFixed(4)),
    }));

    return res.json({ jd, k, results });
  } 
  catch (err) {
    console.error('Proxy error:', err);
    return res.status(502).json({ error: 'FastAPI service error' });
  }
});

