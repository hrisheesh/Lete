# Lete Frontend Client

This is the Next.js 14 frontend for Lete. It provides a highly responsive, aesthetically premium, and deeply interactive interface for managing workspaces and orchestrating context-aware chats.

## 🏗️ Architecture & Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS for utility-first, responsive design.
- **Icons**: Lucide React.
- **Markdown Engine**: Custom implementation utilizing `react-markdown`.
- **State & Data Fetching**: React Hooks (`useState`, `useEffect`, `useCallback`) interacting natively with the FastAPI backend.

## 🧩 Advanced Rendering Capabilities

A major component of the frontend is the `FormattedMessage` component, designed to parse and render complex LLM outputs perfectly:

- **Mathematical Typography**: Native support for inline (`$math$`) and block (`$$math$$`) LaTeX equations via `rehype-katex`.
- **Mermaid Diagrams**: Interactive flowcharts and system architecture graphs parsed dynamically from markdown codeblocks using `mermaid`.
- **Syntax Highlighting**: Deeply integrated code blocks with language-specific highlighting via `rehype-highlight`.
- **Dynamic Citations**: Custom regex parsing that identifies inline citation markers (e.g., `[1]`) and replaces them with interactive badges. Clicking a badge triggers the `ChunkPreviewModal` to instantly display the exact source text retrieved from the backend.

## 📁 Key Components

- **`app/workspaces/[id]/page.tsx`**: The core Workspace Dashboard featuring a side-by-side layout (Documents on the left, Chat List / Active Chat on the right).
- **`components/ChatPanel.tsx`**: Manages the SSE (Server-Sent Events) stream for real-time token rendering, typing indicators, and message history state.
- **`components/ChatList.tsx`**: Renders the multi-chat architecture, allowing users to spawn and rename parallel research threads.
- **`components/DocumentList.tsx`**: Manages document indexing states and UI feedback for the ingestion pipeline.

## 🚀 Setup & Execution

### Prerequisites

Ensure you have Node.js (v18+) installed.

### Installation

Install the necessary NPM packages:

```bash
npm install
```

### Running the Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be accessible at `http://localhost:3000`. Ensure the FastAPI backend is concurrently running on port 8000 for full functionality.
