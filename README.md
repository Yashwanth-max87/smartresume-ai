# SmartResume AI

AI-powered resume builder with ATS analysis, skill gap detection, and personalized learning roadmaps — built with Django, PostgreSQL, and Tailwind CSS.

## Tech Stack
- **Backend**: Python 3.10+, Django 4.2, Django REST Framework
- **Database**: PostgreSQL
- **AI**: Google Gemini 1.5 Flash (with rule-based fallback)
- **PDF**: ReportLab (pure Python, no system deps)
- **Frontend**: HTML, Tailwind CSS CDN, Vanilla JavaScript

## Quick Setup

### 1. Activate the virtual environment (already created)
```powershell
# From the proj/ root:
.\venv\Scripts\activate
```

### 2. Dependencies are already installed in the venv
If you need to reinstall:
```bash
pip install -r requirements.txt
```

### 3. Create the PostgreSQL database
Open psql and run:
```sql
CREATE DATABASE smartresume;
```

### 4. Configure environment
The `.env` file is already present with your credentials. Verify the values match your setup.

### 5. Run migrations
```bash
cd backend
python manage.py migrate
```

### 6. Start the development server
```bash
python manage.py runserver
```
The API will be available at `http://localhost:8000/api/`

### 7. Open the frontend
Open any HTML file directly in your browser:
```
frontend/index.html       → Dashboard
frontend/builder.html     → Resume Builder
frontend/templates.html   → Template Gallery
frontend/analyzer.html    → AI Analyzer
frontend/roadmap.html     → Skill Roadmap
```

Or serve with a simple HTTP server:
```bash
cd frontend
python -m http.server 5500
# Open: http://localhost:5500
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/resumes/` | List / create resumes |
| GET | `/api/resumes/stats/` | Dashboard statistics |
| GET/PUT/DELETE | `/api/resumes/<id>/` | Resume CRUD |
| GET | `/api/resumes/<id>/pdf/` | Download PDF |
| POST | `/api/analyzer/analyze/` | AI resume analysis |
| GET | `/api/analyzer/reports/` | List reports |
| GET | `/api/analyzer/reports/<id>/` | Get report |
| POST | `/api/roadmap/generate/` | Generate roadmap |
| POST | `/api/roadmap/youtube/` | YouTube suggestions |
| GET | `/api/roadmap/history/` | Roadmap history |

## Features
- **4 Resume Templates**: Modern, Minimal, ATS Professional, Two-Column Technical
- **Live Preview**: Real-time rendering in the browser as you type
- **PDF Download**: Professional ATS-friendly PDF generation with ReportLab
- **AI ATS Analyzer**: Upload PDF/DOCX resume + job description → ATS score, missing skills, tips
- **Skill Roadmap**: Enter role + skills → AI generates Beginner/Intermediate/Advanced learning path
- **YouTube Resources**: Auto-generated search links for every missing skill
- **Rule-based Fallback**: Works without Gemini API key using keyword matching

## Project Structure
```
proj/
├── backend/
│   ├── manage.py
│   ├── smartresume/          # Django project config
│   ├── apps/
│   │   ├── resumes/          # Resume CRUD + PDF download
│   │   ├── analyzer/         # ATS analysis
│   │   └── roadmap/          # Roadmap + YouTube
│   └── services/
│       ├── ai_analyzer.py    # Gemini AI + rule-based fallback
│       ├── pdf_generator.py  # ReportLab PDF templates
│       ├── resume_parser.py  # PDF/DOCX text extraction
│       └── roadmap_generator.py  # AI roadmap + YouTube links
├── frontend/
│   ├── index.html            # Dashboard
│   ├── builder.html          # Resume Builder
│   ├── templates.html        # Template Gallery
│   ├── analyzer.html         # AI Analyzer
│   ├── roadmap.html          # Skill Roadmap
│   └── assets/
│       ├── css/main.css
│       └── js/  (api.js, dashboard.js, builder.js, analyzer.js, roadmap.js)
├── .env
├── requirements.txt
└── README.md
```
