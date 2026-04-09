# AuraScore 🎯

An AI-powered interview performance analyser. Record yourself answering interview questions and get a full breakdown of your voice, body language, eye contact, and confidence score.

---

## Prerequisites

Before you start, make sure you have:

- **Python 3.10+** — [Download](https://www.python.org/downloads/)
- **Node.js 18+** — [Download](https://nodejs.org/)
- **pip** (comes with Python)
- **Git** — [Download](https://git-scm.com/)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/bhavika232/AuraScore.git
cd AuraScore
```

---

### 2. Backend Setup

```bash
cd backend

# Create a virtual environment
python -m venv venv

# Activate it:
# macOS / Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt

# Start the backend server
python app.py
```

The backend will run at **http://localhost:5002**

> **Note:** The first run may take a moment — `mediapipe` and `librosa` are large packages.

---

### 3. Frontend Setup

Open a **new terminal window** (keep the backend running):

```bash
cd Tanay-frontend

# Install dependencies
npm install

# Create the environment file
cp .env.example .env.local
# OR manually create a file called .env.local with:
# VITE_API_URL=http://localhost:5002

# Start the frontend dev server
npm run dev
```

The frontend will run at **http://localhost:5173**

---

## Environment Variables

Create a file called `.env.local` inside `Tanay-frontend/`:

```
VITE_API_URL=http://localhost:5002
```

> Without this, the frontend defaults to `http://localhost:5002` anyway, so it will work locally even without the file.

---

## Running the App

1. Terminal 1 → Backend:
   ```bash
   cd backend && source venv/bin/activate && python app.py
   ```

2. Terminal 2 → Frontend:
   ```bash
   cd Tanay-frontend && npm run dev
   ```

3. Open **http://localhost:5173** in your browser.

---

## Project Structure

```
AuraScore/
├── backend/                  # Flask API server
│   ├── app.py                # Main server + routes
│   ├── models.py             # User database model
│   ├── requirements.txt      # Python dependencies
│   └── analyzers/            # AI analysis modules
│       ├── face_analyzer.py  # Eye contact + gaze (Bhavika)
│       ├── voice_analyzer.py # Pitch, pace, fillers (Harshita)
│       ├── body_analyzer.py  # Posture + body language (Ria)
│       └── scorer.py         # Composite scoring engine (Shaurya)
│
└── Tanay-frontend/           # React + Vite app
    └── src/
        ├── App.jsx           # Routes
        ├── Dashboard.jsx     # Mission Control home
        ├── Interview.jsx     # Recording session
        ├── Results.jsx       # Analysis results + charts
        ├── Navbar.jsx        # Navigation bar
        └── Modules.jsx       # Module detail pages
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ModuleNotFoundError` | Make sure your venv is activated and you ran `pip install -r requirements.txt` |
| Camera not working | Allow camera permissions in your browser |
| Frontend can't reach backend | Make sure backend is running on port 5002 and `.env.local` has the correct URL |
| `mediapipe` install fails | Try `pip install mediapipe --extra-index-url https://pypi.org/simple` |
| Port 5002 already in use | Change the port in `backend/app.py` and update `.env.local` accordingly |

---

## Team

| Name | Role |
|---|---|
| Tanay Sanjay | Frontend Architect |
| Bhavika Khanna | Face & Eye Contact Analyser |
| Harshita Kandanala | Voice Analyser |
| Ria Ravikumar | Body Language Analyser |
| Shaurya Arvind | ML & Scoring Engine |
