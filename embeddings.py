from sentence_transformers import SentenceTransformer


class MultilingualEmbeddings:
    def __init__(self):
        print("Loading real multilingual embedding model...")

        # Fast + good multilingual model. If you want highest quality later,
        # change this to: intfloat/multilingual-e5-base and dimension to 768.
        self.model_name = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
        self.model = SentenceTransformer(self.model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()

        print(f"✅ Embedding model ready! Model: {self.model_name}, Dim: {self.dimension}")

    def embed_documents(self, texts):
        if not texts:
            return []

        embeddings = self.model.encode(
            texts,
            normalize_embeddings=True,
            batch_size=32,
            show_progress_bar=False
        )
        return embeddings.tolist()

    def embed_query(self, text):
        if not text:
            text = ""

        embedding = self.model.encode(
            text,
            normalize_embeddings=True,
            show_progress_bar=False
        )
        return embedding.tolist()

    def get_dimension(self):
        return self.dimension
