import json
import os
import requests
import psycopg2
from psycopg2.extras import execute_values

AI_BASE_URL = os.getenv("AI_BASE_URL", "http://localhost:8000")

# Postgres connection info - tries to read from env vars, otherwise uses defaults from docker-compose
DB = {
    "host": os.getenv("PGHOST", "localhost"),
    "port": int(os.getenv("PGPORT", "5432")),
    "dbname": os.getenv("PGDATABASE", "resume_db"),
    "user": os.getenv("PGUSER", "app"),
    "password": os.getenv("PGPASSWORD", "app"),
}

SEED_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "seed", "resumes_data.jsonl")
SEED_PATH = os.path.abspath(SEED_PATH)

# calls AI service to get embedding for given text
def embed(text: str) -> list[float]:
    r = requests.post(f"{AI_BASE_URL}/embed", json={"text": text})
    r.raise_for_status()
    return r.json()["embedding"]


# reads resumes from seed file, gets embeddings from AI service, and inserts into Postgres
def main():
    # read lines from seed file
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        rows = [json.loads(line) for line in f if line.strip()]

    # connect to db
    conn = psycopg2.connect(**DB)
    conn.autocommit = False
    cur = conn.cursor()
    try:
        #loop through rows in seed file
        for row in rows:
            # insert into resumes table
            cur.execute(
                "INSERT INTO resumes(candidate_id, text) VALUES (%s, %s) RETURNING id",
                (row["candidate_id"], row["text"])
            )
            resume_id = cur.fetchone()[0]
            # get embedding for this resume
            vec = embed(row["text"]) 

            # insert embedding into resume_embeddings table
            cur.execute(
                "INSERT INTO resume_embeddings(resume_id, embedding) VALUES (%s, %s)",
                (resume_id, vec)
            )
            print(f"Inserted resume {row['candidate_id']} with id {resume_id}")

        conn.commit()
        print(f"Indexed {len(rows)} resumes.")
    except Exception:
        conn.rollback()
        print("Error occurred, transaction rolled back:", e)
        raise
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
