import os
import re
from pypdf import PdfReader
from docx import Document


class DocumentProcessor:
    def __init__(self):
        self.supported_extensions = ['.pdf', '.txt', '.docx']

    def read_pdf(self, file_path):
        text_parts = []
        try:
            reader = PdfReader(file_path)
            for page in reader.pages:
                page_text = page.extract_text() or ""
                if page_text.strip():
                    text_parts.append(page_text)
        except Exception as e:
            print(f"Error reading PDF: {e}")
        return "\n".join(text_parts)

    def read_docx(self, file_path):
        text_parts = []
        try:
            doc = Document(file_path)
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text_parts.append(paragraph.text)
        except Exception as e:
            print(f"Error reading DOCX: {e}")
        return "\n".join(text_parts)

    def read_txt(self, file_path):
        for encoding in ("utf-8", "utf-8-sig", "latin-1"):
            try:
                with open(file_path, 'r', encoding=encoding) as f:
                    return f.read()
            except UnicodeDecodeError:
                continue
        return ""

    def load_document(self, file_path):
        ext = os.path.splitext(file_path)[1].lower()

        if ext == '.pdf':
            return self.read_pdf(file_path)
        if ext == '.docx':
            return self.read_docx(file_path)
        if ext == '.txt':
            return self.read_txt(file_path)
        return ""

    def clean_text(self, text):
        if not text:
            return ""
        text = text.replace("\x00", " ")
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def split_into_chunks(self, text, chunk_size=700, overlap=80):
        """
        Faster chunking: larger chunks = fewer embeddings = faster upload.
        chunk_size and overlap are approximate character lengths.
        """
        text = self.clean_text(text)
        if not text:
            return []

        words = text.split()
        chunks = []
        current_words = []
        current_len = 0

        for word in words:
            current_words.append(word)
            current_len += len(word) + 1

            if current_len >= chunk_size:
                chunks.append(" ".join(current_words))

                overlap_words = []
                overlap_len = 0
                for w in reversed(current_words):
                    overlap_words.insert(0, w)
                    overlap_len += len(w) + 1
                    if overlap_len >= overlap:
                        break

                current_words = overlap_words
                current_len = overlap_len

        if current_words:
            last_chunk = " ".join(current_words)
            if not chunks or last_chunk != chunks[-1]:
                chunks.append(last_chunk)

        return chunks
