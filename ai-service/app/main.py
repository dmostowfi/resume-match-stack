from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer, util

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

@app.post("/match", response_model=MatchResponse)
async def match(req: MatchRequest):
    if not req.resume.strip() or not req.jd.strip():
        raise HTTPException(status_code=400, detail="Resume and job description must be non-empty")
    
    # Encode resume and jd
    resume_embedding = model.encode(req.resume, convert_to_tensor=True)
    jd_embedding = model.encode(req.jd, convert_to_tensor=True)

    # Compute cosine similarity
    similarity_score = util.cos_sim(resume_embedding, jd_embedding).item()
    return MatchResponse(similarity_score = similarity_score)
