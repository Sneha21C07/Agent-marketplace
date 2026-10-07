from __future__ import annotations

import json
import sqlite3
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / 'nexus_marketplace.db'
SEED_PATH = ROOT / 'seed_data.json'
PORT = 8001


def load_seed_data() -> dict:
    if not SEED_PATH.exists():
        raise FileNotFoundError(f'Missing seed data file: {SEED_PATH}')
    return json.loads(SEED_PATH.read_text(encoding='utf-8'))


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_db() -> None:
    conn = get_connection()
    try:
        conn.execute('CREATE TABLE IF NOT EXISTS agents (id TEXT PRIMARY KEY, payload TEXT NOT NULL)')
        conn.execute('CREATE TABLE IF NOT EXISTS prompts (id TEXT PRIMARY KEY, payload TEXT NOT NULL)')
        conn.execute('CREATE TABLE IF NOT EXISTS audit_logs (id TEXT PRIMARY KEY, payload TEXT NOT NULL)')
        conn.execute('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)')

        row_count = conn.execute('SELECT COUNT(*) FROM agents').fetchone()[0]
        if row_count == 0:
            seed = load_seed_data()
            for item in seed.get('agents', []):
                conn.execute('INSERT INTO agents (id, payload) VALUES (?, ?)', (item.get('id'), json.dumps(item, separators=(',', ':'))))
            for item in seed.get('prompts', []):
                conn.execute('INSERT INTO prompts (id, payload) VALUES (?, ?)', (item.get('id'), json.dumps(item, separators=(',', ':'))))
            for item in seed.get('audit_logs', []):
                conn.execute('INSERT INTO audit_logs (id, payload) VALUES (?, ?)', (item.get('id'), json.dumps(item, separators=(',', ':'))))
            conn.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', ('current_role', 'developer'))

        conn.commit()
    finally:
        conn.close()


def read_table(table: str):
    conn = get_connection()
    try:
        rows = conn.execute(f'SELECT payload FROM {table} ORDER BY rowid DESC').fetchall()
        return [json.loads(row['payload']) for row in rows]
    finally:
        conn.close()


def upsert_collection(table: str, items):
    conn = get_connection()
    try:
        conn.execute(f'DELETE FROM {table}')
        for item in items:
            conn.execute(f'INSERT INTO {table} (id, payload) VALUES (?, ?)', (item.get('id'), json.dumps(item, separators=(',', ':'))))
        conn.commit()
    finally:
        conn.close()


def set_setting(key: str, value: str) -> None:
    conn = get_connection()
    try:
        conn.execute('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', (key, value))
        conn.commit()
    finally:
        conn.close()


def get_setting(key: str, default: str = '') -> str:
    conn = get_connection()
    try:
        row = conn.execute('SELECT value FROM settings WHERE key = ?', (key,)).fetchone()
        return row['value'] if row else default
    finally:
        conn.close()


class MarketplaceHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # Prevent browsers from caching stale HTML/JS/CSS during local development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        super().end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/agents':
            self.send_json(read_table('agents'))
            return
        if parsed.path == '/api/prompts':
            self.send_json(read_table('prompts'))
            return
        if parsed.path == '/api/audit-logs':
            self.send_json(read_table('audit_logs'))
            return
        if parsed.path == '/api/current-role':
            self.send_json(get_setting('current_role', 'developer'))
            return
        if parsed.path.startswith('/api/'):
            self.send_response(404)
            self.end_headers()
            return

        super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        try:
            content_length = int(self.headers.get('Content-Length', '0'))
            body = self.rfile.read(content_length) if content_length > 0 else b''
            payload = json.loads(body.decode('utf-8')) if body else {}
        except Exception:
            payload = {}

        if parsed.path == '/api/agents':
            items = payload.get('agents', [])
            upsert_collection('agents', items)
            self.send_json({'ok': True, 'count': len(items)})
            return
        if parsed.path == '/api/prompts':
            items = payload.get('prompts', [])
            upsert_collection('prompts', items)
            self.send_json({'ok': True, 'count': len(items)})
            return
        if parsed.path == '/api/audit-logs':
            items = payload.get('logs', [])
            upsert_collection('audit_logs', items)
            self.send_json({'ok': True, 'count': len(items)})
            return
        if parsed.path == '/api/current-role':
            value = payload.get('value', 'developer')
            set_setting('current_role', str(value))
            self.send_json({'ok': True, 'value': value})
            return
        if parsed.path == '/api/reset-defaults':
            initialize_db()
            self.send_json({'ok': True, 'reset': True})
            return

        self.send_response(404)
        self.end_headers()

    def send_json(self, data):
        body = json.dumps(data).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return


if __name__ == '__main__':
    initialize_db()
    handler = MarketplaceHandler
    httpd = ThreadingHTTPServer(('0.0.0.0', PORT), handler)
    print(f'Serving NexusAgent on http://localhost:{PORT}')
    print(f'Database ready: {DB_PATH}')
    httpd.serve_forever()
