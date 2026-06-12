import os
import uuid
import chromadb


class VectorStore:
    def __init__(self, persist_directory="./vector_db"):
        self.persist_directory = persist_directory
        os.makedirs(persist_directory, exist_ok=True)

        print(f"📦 Initializing vector store at: {persist_directory}")

        self.client = chromadb.PersistentClient(path=persist_directory)
        self.collection = self.client.get_or_create_collection(
            name="multilingual_docs",
            metadata={"hnsw:space": "cosine"}
        )

        print(f"✅ Vector store ready, {self.collection.count()} items")

    def add_documents(self, chunks, embeddings, metadatas=None, ids=None):
        if not chunks:
            return

        if ids is None:
            ids = [f"chunk_{uuid.uuid4().hex}" for _ in chunks]

        if metadatas is None:
            metadatas = [{"chunk_index": i} for i in range(len(chunks))]

        embeddings_clean = [list(map(float, emb)) for emb in embeddings]

        self.collection.add(
            documents=chunks,
            embeddings=embeddings_clean,
            metadatas=metadatas,
            ids=ids
        )

    def search(self, query_embedding, n_results=3):
        count = self.collection.count()
        if count == 0:
            return {"documents": [[]], "metadatas": [[]], "distances": [[]]}

        n_results = min(n_results, count)
        query_emb = list(map(float, query_embedding))

        return self.collection.query(
            query_embeddings=[query_emb],
            n_results=n_results
        )

    def get_count(self):
        return self.collection.count()

    def clear(self):
        try:
            self.client.delete_collection("multilingual_docs")
        except Exception:
            pass

        self.collection = self.client.get_or_create_collection(
            name="multilingual_docs",
            metadata={"hnsw:space": "cosine"}
        )
