# multilingual_rag
Multilingual Knowledge Retrieval Platform
# 🌍 Multilingual RAG Chat

An AI-powered Multilingual Retrieval-Augmented Generation (RAG) platform that allows users to upload documents and ask questions in multiple languages.

## 🚀 Features

* 📄 Upload PDF, DOCX, and TXT documents
* 🤖 AI-powered question answering using Llama 3
* 🌐 Multilingual support (English, Hindi, and more)
* 🔍 Semantic search using vector embeddings
* 📚 Source-based responses
* ⚡ Real-time streaming answers
* 🎨 Modern responsive UI
* 👤 User login and profile system

---

## 🛠 Tech Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* FastAPI
* Python

### AI & RAG

* Ollama
* Llama3
* Sentence Transformers
* ChromaDB

---

## 📂 Project Structure

```text
multilingual_rag/
│
├── backend/
│   ├── main.py
│   ├── rag_engine.py
│   ├── embeddings.py
│   ├── vector_store.py
│   ├── translator.py
│   └── document_processor.py
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── data/
├── vector_db/
├── requirements.txt
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/Aakashbhade09/multilingual_rag.git
cd multilingual_rag
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Install Ollama

Download and install Ollama:

https://ollama.com

Pull Llama3 model:

```bash
ollama pull llama3
```

### Run Ollama

```bash
ollama serve
```

### Start Backend

```bash
python backend/main.py
```

Open browser:

```text
http://localhost:8000
```

---

## 📖 How It Works

1. Upload a document.
2. Document is split into chunks.
3. Embeddings are generated.
4. Chunks are stored in ChromaDB.
5. User asks a question.
6. Relevant chunks are retrieved.
7. Llama3 generates the answer.
8. Answer is displayed with source references.

---

## 🌟 Future Enhancements

* Voice-based interaction
* OCR support for scanned PDFs
* Cloud deployment
* Multi-user authentication
* Advanced analytics dashboard
* Team collaboration features

---

## 👨‍💻 Developer

**Aakash Bhade**

Multilingual Knowledge Retrieval Platform

Built using FastAPI, ChromaDB, Sentence Transformers and Llama3.
