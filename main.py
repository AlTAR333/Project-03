from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
import database
import schemas
import jwt
import os
import requests
import bcrypt

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")

SYSTEM_PROMPTS = {
    "A": "You are Officer Rookie, a suspect in a murder investigation. The Chief was killed. You just got taken at 4:00AM to the interrogation room, face to face with the detective. You are completely innocent but very nervous. You know that the Chief died but not how and exactly when this night. If asked where you were at 10 PM, admit you were in the breakroom eating the Chief's personal donuts. Never break character. Answers length may vary from very short to relatively long, shoudln't go over 9 sentences.",
    
    "B": "You are General Stone, a suspect in a murder investigation. The Chief was killed. You just got taken at 4:00AM to the interrogation room, face to face with the detective. You are innocent of the murder, but you are hiding an illegal gambling ring you run. You know that the Chief died but not how and exactly when this night. Be highly defensive, hostile, and evasive. Deflect questions. If pressed hard about 10 PM, you will angrily admit you were in your car placing bets, not murdering anyone. Answers length may vary from very short to relatively long, and shouldn't go over 6 sentences.",
    
    "C": "You are Lieutenant Cross, a suspect in a murder investigation. You just got taken at 4:00AM to the interrogation room, face to face with the detective. You are the murderer. You poisoned the Chief at 10 PM. Act perfectly calm, cooperative, and highly intelligent. Your alibi is that you were in the archive room alone. Only give informations when asked about. CRUCIAL RULE: If the detective asks you specifically about the Chief, you will accidentally say 'I can't believe he was poisoned', and this only 1 time, even though the detective hasn't mentioned poison yet. Try to cover up your slip-up if called out. Keep answers under 3 sentences."
}

SECRET_KEY = "secret_jwt_key_password_that_is_very_long_and_secret"
ALGORITHM = "HS256"

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

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
    # nothing for now

app = FastAPI(title="The Interrogation Room API", lifespan=lifespan)


@app.post("/api/auth/login")
def login(data: schemas.LoginRequest):
    conn = database.get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE username = ?", (data.username,)).fetchone()
    if not user or not verify_password(data.password, user["password"]):
        conn.close()
        raise HTTPException(status_code=401, detail="Invalid badge credentials.")
    
    cursor = conn.cursor()
    cursor.execute("INSERT INTO game_sessions (user_id, status, total_questions) VALUES (?, 'in_progress', 0)", (user["id"],))
    new_session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    token_payload = {"user_id": user["id"], "username": user["username"], "role": user["role"]}
    encoded_jwt = jwt.encode(token_payload, SECRET_KEY, algorithm=ALGORITHM)
    
    return {"status": "success", "token": encoded_jwt, "session_id": new_session_id}

@app.post("/api/auth/register")
def register(data: schemas.AuthRequest):
    conn = database.get_db_connection()
    existing_user = conn.execute("SELECT * FROM users WHERE username = ?", (data.username,)).fetchone()
    if existing_user:
        conn.close()
        raise HTTPException(status_code=400, detail="Badge number (username) already registered.")
    
    hashed_password = get_password_hash(data.password)    
    conn.execute("INSERT INTO users (username, password) VALUES (?, ?)", (data.username, hashed_password))
    conn.commit()
    conn.close()
    
    return {"message": "Registration successful. You can now log in."}

@app.post("/api/interrogate")
def interrogate(data: schemas.InterrogationRequest, user_data: dict = Depends(verify_token)):
    if data.suspect_id not in ["A", "B", "C"]:
        raise HTTPException(status_code=400, detail="Invalid Suspect ID")
    conn = database.get_db_connection()
    # 1. Log player's question
    conn.execute("INSERT INTO chat_logs (session_id, suspect_id, sender, message) VALUES (?, ?, 'player', ?)", (data.session_id, data.suspect_id, data.message))
    conn.execute("UPDATE game_sessions SET total_questions = total_questions + 1 WHERE id = ?", (data.session_id,))
    conn.commit()
    
    # 2. Build the LLM Memory
    past_logs = conn.execute("SELECT sender, message FROM chat_logs WHERE session_id = ? AND suspect_id = ? ORDER BY timestamp ASC", (data.session_id, data.suspect_id)).fetchall()
    
    # Format the memory according to our prompt engineering class
    ai_messages = [{"role": "system", "content": SYSTEM_PROMPTS[data.suspect_id]}]
    for log in past_logs:
        role = "user" if log["sender"] == "player" else "assistant"
        ai_messages.append({"role": role, "content": log["message"]})

    # 3. We make the API call
    ai_reply = "..."
    
    try:
        if data.suspect_id in ["A", "B"]:
            # Route to OpenRouter
            if data.suspect_id == "A":
                model_name = "llama-3.1-8b-instant"
            else:
                model_name = "llama-3.3-70b-versatile"
            
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }

            payload = {"model": model_name, "messages": ai_messages}
            response = requests.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
            if response.status_code != 200:
                print(f"GROQ REJECTED: {response.text}")
            response.raise_for_status()
            
            ai_reply = response.json()["choices"][0]["message"]["content"]
            
        elif data.suspect_id == "C":
            # Route to Mistral
            headers = {
                "Authorization": f"Bearer {MISTRAL_API_KEY}",
                "Content-Type": "application/json"
            }
            payload = {"model": "mistral-small-latest", "messages": ai_messages}
            response = requests.post("https://api.mistral.ai/v1/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            
            ai_reply = response.json()["choices"][0]["message"]["content"]
            
    except Exception as e:
        print(f"API Error: {e}")
        ai_reply = "*The suspect stares at you blankly.* (API Connection Error)"

    # 4. We log the answer
    conn.execute("INSERT INTO chat_logs (session_id, suspect_id, sender, message) VALUES (?, ?, 'suspect', ?)", (data.session_id, data.suspect_id, ai_reply))
    conn.commit()
    conn.close()
    
    return {"suspect_id": data.suspect_id, "reply": ai_reply}

@app.post("/api/accuse")
def accuse(data: schemas.AccusationRequest, user_data: dict = Depends(verify_token)): 
    # Hardcode Suspect C for now
    correct_culprit = "C"
    
    conn = database.get_db_connection()
    session = conn.execute("SELECT * FROM game_sessions WHERE id = ?", (data.session_id,)).fetchone()
    
    if not session:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")

    total_q = session["total_questions"]
    minutes_elapsed = total_q * 3
    hours = 4 + (minutes_elapsed // 60)
    minutes = minutes_elapsed % 60
    final_time = f"{hours:02d}:{minutes:02d} AM"

    if data.accused_suspect == "TIMEOUT":
        status = "lost"
        is_correct = False
        summary = "07:00 AM. The heavy steel door swings open, but it's not the Chief's successor. It's a team of Federal agents, badges gleaming, expressions bored. They hold a warrant for the entire precinct. Your time is up. As they strip you of your access card, you watch the real killer slip into the shadows, emboldened by your failure. You are escorted out, the weight of the unsolved case sinking into your bones."
    else:
        is_correct = data.accused_suspect == "C"
        status = "won" if is_correct else "lost"
        
        if is_correct:
            summary = "The Lieutenant looks at the handcuffs, then back at you with a chilling, calculated calm. 'You were lucky,' he whispers. You didn't just solve a murder, you unmasked a monster hiding in plain sight. As you lead him out into the dawn light, the precinct falls silent. You've earned your badge for another day."
        else:
            summary = "The suspect looks at you with sheer confusion, then anger. You didn't find the truth, you found a scapegoat. The evidence doesn't hold up, the real killer is still out there, and the Feds are already laughing at your report. You didn't just fail the case; you ruined an innocent life. Your desk will be cleared by noon."
    
    conn.execute("UPDATE game_sessions SET status = ? WHERE id = ?", (status, data.session_id))
    conn.commit()
    conn.close()
    
    return {"outcome": status, "correct": is_correct, "time": final_time, "questions": total_q, "summary": summary}

app.mount("/", StaticFiles(directory="static", html=True), name="static")