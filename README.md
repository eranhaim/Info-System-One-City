# עיר אחת - מערכת מידע (One City Knowledge System)

A RAG-based knowledge system for a telephone service center. Each city/town has its own document folder and FAISS vector index. Phone receptionists can ask questions in Hebrew and get answers sourced from the city's documents.

## Architecture

- **Backend** — Python / FastAPI with LangChain orchestration, FAISS vector stores, and S3 file storage
- **Frontend** — React / TypeScript with Tailwind CSS, Hebrew RTL interface
- **LLM** — OpenAI GPT-4o-mini (configurable) with text-embedding-3-small embeddings
- **Deployment** — Docker Compose

## Quick Start

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env with your OpenAI API key and AWS credentials
```

### 2. Create the S3 bucket

Create a bucket in AWS S3 matching the `S3_BUCKET_NAME` in your `.env` file (default: `one-city-knowledge`).

### 3. Run with Docker Compose (production)

```bash
docker compose up --build
```

The app will be available at `http://localhost` (frontend on port 80, API on port 8000).

## Development (with hot reload)

The dev compose file mounts your local source code into the containers and enables hot reload for both services — no rebuild needed when you change code.

```bash
docker compose -f docker-compose.dev.yml up --build
```

Open `http://localhost:5173` in your browser.

| Service  | URL                    | Hot reload                                   |
| -------- | ---------------------- | -------------------------------------------- |
| Frontend | `http://localhost:5173` | Vite HMR — instant on any React/CSS change  |
| Backend  | `http://localhost:8000` | uvicorn `--reload` — restarts on any `.py` change |

The frontend dev server automatically proxies `/api` requests to the backend container.

**When to rebuild:** You only need to re-run `--build` if you change `requirements.txt`, `package.json`, or a `Dockerfile`. For all source code changes, just save the file and the running containers pick it up automatically.

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
cp ../.env .env
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` requests to `http://localhost:8000` automatically.

## Usage

1. Go to **ניהול קבצים** (File Management) to create cities and upload `.docx` / `.txt` documents.
2. Click **סנכרן אינדקס** (Sync Index) to consolidate all files through GPT-4.1 and rebuild the FAISS index.
3. Go to **חיפוש מידע** (Search) to select a city and ask questions. The system will find relevant information from the uploaded documents.

## API Endpoints

| Method | Path                                     | Description              |
| ------ | ---------------------------------------- | ------------------------ |
| GET    | `/api/cities`                            | List all cities          |
| POST   | `/api/cities`                            | Create a new city        |
| DELETE | `/api/cities/{city_id}`                  | Delete a city            |
| POST   | `/api/cities/{city_id}/sync`             | Sync / rebuild index     |
| GET    | `/api/cities/{city_id}/files`            | List files for a city    |
| POST   | `/api/cities/{city_id}/files`            | Upload a file            |
| DELETE | `/api/cities/{city_id}/files/{filename}` | Delete a file            |
| POST   | `/api/chat`                              | Send a question          |
| GET    | `/api/health`                            | Health check             |
