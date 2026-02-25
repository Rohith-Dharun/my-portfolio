import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'portfolio.db')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create visits table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS visits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Create likes table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS project_likes (
            project_id TEXT PRIMARY KEY,
            like_count INTEGER DEFAULT 0
        )
    ''')

    # Initialize project likes if they don't exist
    initial_projects = ['project-1', 'project-2', 'project-3', 'project-4']
    for pid in initial_projects:
        cursor.execute('INSERT OR IGNORE INTO project_likes (project_id, like_count) VALUES (?, ?)', (pid, 0))

    # Create guestbook table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS guestbook (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            message TEXT NOT NULL,
            rating TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")

if __name__ == "__main__":
    init_db()
