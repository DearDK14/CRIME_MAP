"""
CRIMEMAP — Complete Full-Stack Launcher for VS Code
Puducherry Police Hackathon 2026

Run this file directly in VS Code by:
1. Clicking the green "Run" button (top right of VS Code)
2. OR typing: python run.py
"""

import os
import sys
import time
import shutil
import subprocess
import webbrowser
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
DB_FILE = BACKEND_DIR / "crimemap.db"

def banner():
    print("=" * 70)
    print("   CRIMEMAP — C4I Geospatial Crime Intelligence System")
    print("   Puducherry Police Hackathon 2026")
    print("   MAP -> ANALYSE -> PREDICT -> PREVENT")
    print("=" * 70)

def ensure_database():
    """Ensure database exists and is seeded with synthetic demonstration data."""
    if not DB_FILE.exists() or DB_FILE.stat().st_size == 0:
        print("[*] Initializing and seeding Puducherry synthetic demonstration data...")
        seed_script = BACKEND_DIR / "seed_data.py"
        env = os.environ.copy()
        env["PYTHONPATH"] = str(BACKEND_DIR)
        res = subprocess.run([sys.executable, str(seed_script)], cwd=str(BACKEND_DIR), env=env)
        if res.returncode == 0:
            print("[+] Database seeded successfully with 520 incidents & 10 stations.")
        else:
            print("[!] Warning: Seed process returned code", res.returncode)
    else:
        print(f"[+] Verified active database: {DB_FILE.name}")

def find_node_tools():
    """Locate npm executable across PATH and standard Windows install locations."""
    npm_path = shutil.which("npm") or shutil.which("npm.cmd")
    if not npm_path:
        standard_path = Path("C:/Program Files/nodejs/npm.cmd")
        if standard_path.exists():
            npm_path = str(standard_path)
    return npm_path

def main():
    banner()
    ensure_database()

    npm_exec = find_node_tools()
    if not npm_exec:
        print("\n[!] Error: Node.js / npm not detected.")
        print("    Please install Node.js (https://nodejs.org) or add it to your PATH.")
        sys.exit(1)

    print("\n[*] Starting Backend and Frontend services for VS Code...\n")

    # 1. Start FastAPI Backend Process
    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = str(BACKEND_DIR)
    backend_cmd = [
        sys.executable, 
        "-m", "uvicorn", 
        "app.main:app", 
        "--host", "127.0.0.1", 
        "--port", "8000", 
        "--reload"
    ]
    
    print("[1/2] Launching FastAPI Backend on http://127.0.0.1:8000...")
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(BACKEND_DIR),
        env=backend_env
    )

    # 2. Start Vite React Frontend Process
    frontend_env = os.environ.copy()
    nodejs_dir = Path("C:/Program Files/nodejs")
    if nodejs_dir.exists():
        frontend_env["PATH"] = f"{nodejs_dir};" + frontend_env.get("PATH", "")

    frontend_cmd = [npm_exec, "run", "dev"]
    print("[2/2] Launching React Vite Frontend on http://localhost:5173...")
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(FRONTEND_DIR),
        env=frontend_env
    )

    # Allow servers 3 seconds to spin up
    time.sleep(3)

    print("\n" + "=" * 70)
    print("   CRIMEMAP IS RUNNING SUCCESSFULLY!")
    print("=" * 70)
    print("   * Frontend Command Center:  http://localhost:5173")
    print("   * Interactive Swagger API:  http://127.0.0.1:8000/docs")
    print("   * OpenAPI Specification:    http://127.0.0.1:8000/api/openapi.json")
    print("\n   DEMO LOGINS (Click 'Quick Demo Login' on the sign-in page):")
    print("   - Admin:          admin          / Admin@123")
    print("   - Police Officer: officer_sharma / Officer@123")
    print("   - Crime Analyst:  analyst_priya  / Analyst@123")
    print("=" * 70)
    print("   [Press Ctrl+C in this terminal anytime to stop both servers]\n")

    # Automatically open the browser
    try:
        webbrowser.open("http://localhost:5173")
    except Exception:
        pass

    # Keep both processes running and listen for Ctrl+C
    try:
        while True:
            time.sleep(1)
            # Check if any process terminated unexpectedly
            if backend_proc.poll() is not None:
                print(f"[!] Backend stopped with code {backend_proc.returncode}")
                break
            if frontend_proc.poll() is not None:
                print(f"[!] Frontend stopped with code {frontend_proc.returncode}")
                break
    except KeyboardInterrupt:
        print("\n[*] Stopping CRIMEMAP services...")
    finally:
        if backend_proc.poll() is None:
            backend_proc.terminate()
        if frontend_proc.poll() is None:
            frontend_proc.terminate()
        print("[+] All services stopped safely. Goodbye!")

if __name__ == "__main__":
    main()
