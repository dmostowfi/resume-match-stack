-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS resumes (
  id SERIAL PRIMARY KEY,
  candidate_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 384 dims because MiniLM embeddings are 384-length
CREATE TABLE IF NOT EXISTS resume_embeddings (
  resume_id INT PRIMARY KEY REFERENCES resumes(id) ON DELETE CASCADE,
  embedding VECTOR(384) -- vector data
);

-- create an index on the data for faster retrieval
CREATE INDEX IF NOT EXISTS idx_resume_embedding
ON resume_embeddings
USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);


SELECT * FROM resumes;
SELECT resume_id, embedding[1:5] AS sample_dims
FROM resume_embeddings
LIMIT 10;
