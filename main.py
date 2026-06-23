from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.staticfiles import StaticFiles
import database
import schemas
import jwt

SECRET_KEY = "secret_jwt_key_password_that_is_very_long_and_secret"
ALGORITHM = "HS256"

def verify_token(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid token format")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting up: Initializing database...")
    database.init_db()
    
    yield

    print("Shutting down the precinct...")
    # nothing yet

app = FastAPI(title="The Interrogation Room API", lifespan=lifespan)


@app.post("/api/auth/login")
def login(data: schemas.LoginRequest):
    conn = database.get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ? AND password = ?", (data.username, data.password)).fetchone()
    
    if not user:
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    cursor = conn.cursor()
    cursor.execute("INSERT INTO game_sessions (user_id, status, total_questions) VALUES (?, 'in_progress', 0)", (user["id"],))
    new_session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    token_payload = {"user_id": user["id"], "username": user["username"], "role": user["role"]}
    encoded_jwt = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"status": "success", "token": encoded_jwt, "session_id": new_session_id }

@app.post("/api/interrogate")
def interrogate(data: schemas.InterrogationRequest, user_data: dict = Depends(verify_token)):
    if data.suspect_id not in ['A', 'B', 'C']:
        raise HTTPException(status_code=400, detail="Invalid Suspect ID")
    conn = database.get_db_connection()
    # 1. Log player's question
    conn.execute("INSERT INTO chat_logs (session_id, suspect_id, sender, message) VALUES (?, ?, 'player', ?)", (data.session_id, data.suspect_id, data.message))
    conn.execute("UPDATE game_sessions SET total_questions = total_questions + 1 WHERE id = ?", (data.session_id,))
    conn.commit()
    
    # 2. Placeholder for now
    mock_reply = f"I am Suspect {data.suspect_id}. I don't have to talk to you without my lawyer present!"
    
    # 3. We log the answer
    conn.execute("INSERT INTO chat_logs (session_id, suspect_id, sender, message) VALUES (?, ?, 'suspect', ?)", (data.session_id, data.suspect_id, mock_reply))
    conn.commit()
    conn.close()
    
    return {"suspect_id": data.suspect_id, "reply": mock_reply}

@app.post("/api/accuse")
def accuse(data: schemas.AccusationRequest, user_data: dict = Depends(verify_token)): 
    # Hardcode Suspect C for now as the true culprit
    correct_culprit = "C"
    
    conn = database.get_db_connection()
    session = conn.execute("SELECT * FROM game_sessions WHERE id = ?", (data.session_id,)).fetchone()
    
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")
        
    is_correct = data.accused_suspect == correct_culprit
    status = "won" if is_correct else "lost"
    
    # Score calculation (for now): 100 max, minus 5 for every question asked. Min 10 points for winning.
    score = max(10, 100 - (session["total_questions"] * 5)) if is_correct else 0
    
    conn.execute("UPDATE game_sessions SET status = ?, score = ? WHERE id = ?", (status, score, data.session_id))
    conn.commit()
    conn.close()
    
    return {
        "outcome": status,
        "correct": is_correct,
        "score": score,
        "summary": "Suspect C cracked under pressure. You solved the case!" if is_correct else "You locked up an innocent citizen. The killer got away!"
    }

app.mount("/", StaticFiles(directory="static", html=True), name="static")