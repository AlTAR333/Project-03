import sqlite3
import os
import bcrypt

DB_NAME = "database.db"

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row 
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. The Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'player'
        )
    ''')
    
    # 2. The game Sessions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS game_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            suspect_a_model TEXT,
            suspect_b_model TEXT,
            suspect_c_model TEXT,
            status TEXT DEFAULT 'in_progress', -- 'in_progress', 'won', 'lost'
            total_questions INTEGER DEFAULT 0,
            score INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # 3. The chat Logs Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id INTEGER,
            suspect_id TEXT NOT NULL, -- 'A', 'B', or 'C'
            sender TEXT NOT NULL,     -- 'player' or 'suspect'
            message TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES game_sessions (id)
        )
    ''')
    
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        
        admin_hash = bcrypt.hashpw('admin'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        player_hash = bcrypt.hashpw('password123'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, 'admin')", ('admin', admin_hash))
        cursor.execute("INSERT INTO users (username, password, role) VALUES (?, ?, 'player')", ('detective1', player_hash))
        
    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully with securely hashed basic users.")