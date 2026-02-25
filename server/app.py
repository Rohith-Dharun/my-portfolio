from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

DB_PATH = os.path.join(os.path.dirname(__file__), 'portfolio.db')

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# --- VISITS ---
@app.route('/api/visits', methods=['GET'])
def get_visits():
    conn = get_db_connection()
    count = conn.execute('SELECT COUNT(*) FROM visits').fetchone()[0]
    conn.close()
    return jsonify({'count': count})

@app.route('/api/visits', methods=['POST'])
def add_visit():
    conn = get_db_connection()
    conn.execute('INSERT INTO visits (timestamp) VALUES (CURRENT_TIMESTAMP)')
    conn.commit()
    count = conn.execute('SELECT COUNT(*) FROM visits').fetchone()[0]
    conn.close()
    return jsonify({'count': count}), 201

# --- LIKES ---
@app.route('/api/likes', methods=['GET'])
def get_likes():
    conn = get_db_connection()
    likes = conn.execute('SELECT project_id, like_count FROM project_likes').fetchall()
    conn.close()
    return jsonify({row['project_id']: row['like_count'] for row in likes})

@app.route('/api/likes/<project_id>', methods=['POST'])
def add_like(project_id):
    conn = get_db_connection()
    conn.execute('UPDATE project_likes SET like_count = like_count + 1 WHERE project_id = ?', (project_id,))
    conn.commit()
    row = conn.execute('SELECT like_count FROM project_likes WHERE project_id = ?', (project_id,)).fetchone()
    conn.close()
    if row:
        return jsonify({'project_id': project_id, 'like_count': row['like_count']})
    return jsonify({'error': 'Project not found'}), 404



if __name__ == '__main__':
    # Ensure database is initialized before running
    # (We already ran database_setup.py, but could import it here if needed)
    app.run(debug=True, port=5000)
