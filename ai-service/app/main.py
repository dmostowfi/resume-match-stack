from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer, util
from typing import List
import os

model_name = os.getenv("MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
app = FastAPI()

@app.get("/")
async def root():
    return {"message": "Hello World"}

#request model
class MatchRequest(BaseModel):
    resume: str = Field(min_length=1)
    jd: str = Field(min_length=1)

#response model
class MatchResponse(BaseModel):
    similarity_score: float

#computes similarity score between resume and job description
@app.post("/match", response_model=MatchResponse)
def match(req: MatchRequest):
    if not req.resume.strip() or not req.jd.strip():
        raise HTTPException(status_code=400, detail="Resume and job description must be non-empty")
    
    # Encode resume and jd
    resume_embedding = model.encode(req.resume, convert_to_tensor=True)
    jd_embedding = model.encode(req.jd, convert_to_tensor=True)

    # Compute cosine similarity
    similarity_score = util.cos_sim(resume_embedding, jd_embedding).item()
    return MatchResponse(similarity_score = similarity_score)

#gets embedding for a given text
class EmbedRequest(BaseModel):
    text: str = Field(min_length=1)

class EmbedResponse(BaseModel):
    embedding: List[float]

@app.post("/embed", response_model=EmbedResponse)
def get_embedding(req: EmbedRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text must be non-empty")
    vec = model.encode(req.text.strip(), convert_to_numpy=True).tolist()
    return {"embedding": vec}
