# 🏛️ Case File #404: The Precinct Murder

A high-stakes, narrative-driven psychological interrogation game built with a FastAPI backend and an immersive, front-end terminal layout. Solve the murder of the Chief Inspector before the clock strikes 7:00 AM, or your career goes cold forever.

---

## 🎭 The Premise
> **Date:** October 27th, 2026  
> **Time:** 04:00 AM  

You are a detective of modest rank on your absolute final warning at Scotland Yards. Your clearance rate is in the gutter, and Captain Miller has made it clear: *this is your last exam.* The Chief Inspector has been found dead at his desk, poisoned around 10:00 PM. The local perimeter is secured, but the FBI is already suiting up to hijack the jurisdiction.

You have exactly **3 hours** before the Feds arrive. Three key suspects are locked away in the holding rooms. Every question you ask them burns **3 minutes** off the clock. Sixty questions are all that stand between an open-and-shut conviction and a ruined career.

---

## 🛠️ Key Architectural Features

### 🎬 Cinematic Atmosphere & Audio Design
* **Dangling Pendulum Light:** Built entirely via synchronized CSS transitions, a central hanging bulb sways gently, casting dynamic shifting shadows over the concrete backdrop.
* **Synchronized Faulty Wiring:** Relies on a random JavaScript generator to trigger instantaneous drop-downs in lighting opacity, seamlessly bound with physical electrical crackle pops (`.mp3`).
* **Ambient Hum Escapism:** Implements a low-frequency neon electrical hum that smoothly initializes the moment the user transitions away from the silent introductory briefing.
* **Proportional Text Scroll UX:** Typewriter engine dynamically computes scroll dimensions to snap the view downward automatically, only yielding tracking authority if the user manually drags the trackbar up to analyze a prior clue.

### ⏰ Ticking Clock State Mechanics
* **Retro 7-Segment LED display:** Modeled exactly after mid-century alarm docks, dynamically rendering an integrated glowing font with multi-layer color blooming (`text-shadow`).
* **Automated Loss Handler:** Reaching `07:00 AM` immediately suspends active states, overrides server sessions to standard timeout indicators, and locks the client out with custom-tailored narrative failure lore.

### 🔒 Enterprise-Grade Security Implementation
* **Cryptographic Password Hashing:** Rejects plain-text vulnerability completely by using native Python `bcrypt` salts, safeguarding default configurations and client registrations alike.
* **Stateless Cryptographic Sessions:** Leverages stateless **JSON Web Tokens (JWT)** for administrative authorizations, ensuring complete session isolation across client restarts.
* **SQL-Injection Protection:** Standardized database commands rely heavily on parameterized query processing `(?, ?)` via `sqlite3`.

---

## 🚀 Installation & Technical Execution

### Prerequisites
Ensure you have Python 3.10+ installed on your machine. 

### Dependencies
Install the required micro-framework libraries directly via your system shell:
```bash
pip install fastapi uvicorn bcrypt PyJWT
```

### Audio Assets Requirement
Create an internal asset directory structure for static sounds:
```text
static/
└── sounds/
    ├── neon-buzz.mp3   (Continuous loop, low-volume hum)
    ├── zap.mp3         (Sharp static electrical pop)
    ├── typewriter.mp3  (Mechanical single-key click)
    ├── tick.mp3        (Heavy digital clock increment sound)
    ├── alarm.mp3       (Blaring digital 7:00 AM alarm siren)
    └── slam.mp3        (Heavy tactical folder thud)
```

### Initializing the Hashed Database
Run the schema setup compilation script to automatically build tables and push securely pre-hashed admin accounts into your persistent environment:
```bash
python database.py
```
*Default accounts loaded:*
* **Admin:** `admin` / Password: `admin`
* **Detective standard:** `detective1` / Password: `password123`

### Deploying the Application Server
Spin up the FastAPI server via the standard Uvicorn interface:
```bash
uvicorn main:app --reload
```
Once initialized, navigate your local browser window to:  
🔗 **`http://127.0.0.1:8000`**

---

## 🗄️ Endpoints and Architecture Schema
* `POST /api/auth/register` : Creates unique user entities with native Bcrypt password generation.
* `POST /api/auth/login` : Validates secure credentials and generates a signed JWT payload.
* `POST /api/interrogate` : Tracks unique session contexts, updates individual question limits, and logs chat timelines.
* `POST /api/accuse` : Processes choices, cross-references files, and outputs story endings based on choice correctness or timing failure.

---

## ⚖️ Credits
* **Developer:** Armand VIEAU
* **Context:** Final Semester Project submission for EPITA.