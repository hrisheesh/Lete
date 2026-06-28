# Lete API Backend

This is the Python/FastAPI backend for Lete. It orchestrates the entire Retrieval-Augmented Generation (RAG) pipeline, from document ingestion and parsing to two-stage dense retrieval and streaming generation.

## 🏗️ Architecture & Stack

- **Framework**: FastAPI (Asynchronous Python API)
- **Database**: SQLite integrated natively with `sqlite-vec` for extremely fast, embedded vector operations.
- **Parsing**: `unstructured.io` for layout-aware document processing across multiple formats (PDF, DOCX, CSV).
- **Text Splitting**: LangChain's `RecursiveCharacterTextSplitter`.
- **Embeddings**: `BAAI/bge-m3` via `sentence-transformers`.
- **Reranking**: `BAAI/bge-reranker-large` cross-encoder via `FlagEmbedding`.
- **Streaming**: Native Server-Sent Events (SSE) implemented via FastAPI `StreamingResponse`.

## ⚙️ Core Modules

- **`main.py`**: FastAPI application entry point, routing, and CORS configuration.
- **`database.py`**: SQLite connection pooling and initialization of the `sqlite-vec` extension.
- **`models.py`**: Pydantic models for request validation and serialization.
- **`prompts.py`**: System instructions ensuring strict citation compliance and hierarchical formatting.
- **`rag.py`**: The core retrieval logic, executing dense vector searches, cross-encoder reranking, context formatting, and streaming generation.
- **`ingestion.py`**: Asynchronous file processing, parsing, semantic chunking, and embedding generation.

## 🚀 Setup & Execution

### Prerequisites

Ensure you have Python 3.11+ installed. It is highly recommended to use a virtual environment.

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### Installation

Install the required Python packages:

```bash
pip install -r requirements.txt
```

### Environment Variables

Create a `.env` file in this directory with the necessary API keys for your preferred Universal LLM provider:

```env
API_KEY=your_llm_api_key_here
```

### Running the Server

Start the application with Uvicorn in development mode:

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://127.0.0.1:8000/api/v1`.
Interactive OpenAPI documentation is automatically generated and accessible at `http://127.0.0.1:8000/docs`.
