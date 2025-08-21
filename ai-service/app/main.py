from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

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
    
    # Temporary stub value — AI service would compute a real score
    return MatchResponse(similarity_score=0.42)