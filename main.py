from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware

import os
import uuid

from rag_engine import RAGEngine

app = FastAPI(title="Multilingual RAG System", version="1.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
DATA_DIR = os.path.join(BASE_DIR, "data")
VECTOR_DIR = os.path.join(BASE_DIR, "vector_db")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(VECTOR_DIR, exist_ok=True)

print("🚀 Initializing RAG Engine...")
rag_engine = RAGEngine(persist_directory=VECTOR_DIR)
print("✅ RAG Engine ready!")

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/", response_class=HTMLResponse)
async def home():
    index_path = os.path.join(FRONTEND_DIR, "index.html")

    if not os.path.exists(index_path):
        return HTMLResponse(
            content=f"<h1>Error: index.html not found at {index_path}</h1>",
            status_code=500
        )

    with open(index_path, "r", encoding="utf-8") as f:
        return HTMLResponse(content=f.read())


@app.get("/style.css")
async def get_css():
    css_path = os.path.join(FRONTEND_DIR, "style.css")

    if os.path.exists(css_path):
        return FileResponse(css_path, media_type="text/css")

    raise HTTPException(status_code=404, detail="style.css not found")


@app.get("/script.js")
async def get_js():
    js_path = os.path.join(FRONTEND_DIR, "script.js")

    if os.path.exists(js_path):
        return FileResponse(js_path, media_type="application/javascript")

    raise HTTPException(status_code=404, detail="script.js not found")


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    allowed_extensions = [".pdf", ".txt", ".docx"]
    max_file_size = 10 * 1024 * 1024

    original_name = os.path.basename(file.filename or "uploaded_file")
    file_ext = os.path.splitext(original_name)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Only {allowed_extensions} files allowed"
        )

    safe_name = f"{uuid.uuid4().hex}_{original_name}"
    file_path = os.path.join(DATA_DIR, safe_name)

    try:
        size = 0

        with open(file_path, "wb") as buffer:
            while True:
                chunk = await file.read(1024 * 1024)

                if not chunk:
                    break

                size += len(chunk)

                if size > max_file_size:
                    buffer.close()

                    if os.path.exists(file_path):
                        os.remove(file_path)

                    raise HTTPException(
                        status_code=400,
                        detail="File size 10MB se zyada hai"
                    )

                buffer.write(chunk)

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save error: {e}")

    try:
        return rag_engine.add_document(file_path, original_name)

    except Exception as e:
        print(f"❌ Processing error: {e}")
        raise HTTPException(status_code=500, detail=f"Processing error: {e}")


@app.post("/query")
async def query_documents(
    question: str = Form(...),
    language: str = Form(default="en")
):
    question = question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question empty hai")

    try:
        return rag_engine.query(question, target_language=language)

    except Exception as e:
        print(f"❌ Query error: {e}")
        raise HTTPException(status_code=500, detail=f"Query error: {e}")


@app.post("/query-stream")
async def query_stream(
    question: str = Form(...),
    language: str = Form(default="en")
):
    question = question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question empty hai")

    return StreamingResponse(
        rag_engine.query_stream(question, target_language=language),
        media_type="text/plain"
    )


@app.post("/api/query")
async def query_json(data: dict):
    question = data.get("question", "").strip()
    language = data.get("language", "en")

    if not question:
        raise HTTPException(status_code=400, detail="Question empty hai")

    try:
        return rag_engine.query(question, target_language=language)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats")
async def get_stats():
    try:
        return rag_engine.get_stats()

    except Exception as e:
        return {"error": str(e), "total_chunks": 0}


@app.get("/languages")
async def get_languages():
    return rag_engine.translator.supported_languages


@app.get("/documents")
async def get_documents():
    return {
        "documents": [],
        "message": "Document list tracking not enabled yet."
    }


@app.post("/clear")
async def clear_database():
    try:
        rag_engine.vector_store.clear()

        return {
            "status": "success",
            "message": "Database cleared!"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "frontend_dir": FRONTEND_DIR,
        "data_dir": DATA_DIR,
        "vector_dir": VECTOR_DIR,
        "frontend_exists": os.path.exists(FRONTEND_DIR),
        "index_exists": os.path.exists(os.path.join(FRONTEND_DIR, "index.html")),
        "total_chunks": rag_engine.vector_store.get_count()
    }


if __name__ == "__main__":
    import uvicorn

    print("\n" + "=" * 60)
    print("🌐 Multilingual RAG System Starting...")
    print("📍 Open: http://localhost:8000")
    print("=" * 60 + "\n")

    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")