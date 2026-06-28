"use client";

import React, { useState } from "react";
import RichMarkdown from "@/components/markdown/RichMarkdown";
import { Bot } from "lucide-react";

export default function MarkdownPlayground() {
  const [markdown, setMarkdown] = useState<string>(`# Rich Markdown Renderer Test

## 1. Native Charts (Recharts)

### Area Chart (Smooth Gradients)
\`\`\`chart
{
  "type": "area",
  "title": "Server Load Distribution",
  "data": [
    { "name": "00:00", "cpu": 20, "ram": 40 },
    { "name": "04:00", "cpu": 30, "ram": 45 },
    { "name": "08:00", "cpu": 80, "ram": 75 },
    { "name": "12:00", "cpu": 95, "ram": 90 },
    { "name": "16:00", "cpu": 70, "ram": 80 },
    { "name": "20:00", "cpu": 40, "ram": 55 }
  ],
  "keys": ["cpu", "ram"]
}
\`\`\`

### Composed Chart (Mixed Data)
\`\`\`chart
{
  "type": "composed",
  "title": "Revenue vs Margin",
  "data": [
    { "name": "Q1", "revenue": 4000, "margin": 2400 },
    { "name": "Q2", "revenue": 3000, "margin": 1398 },
    { "name": "Q3", "revenue": 2000, "margin": 9800 },
    { "name": "Q4", "revenue": 2780, "margin": 3908 }
  ],
  "bars": ["revenue"],
  "lines": ["margin"]
}
\`\`\`

### Radar Chart (Multi-Variable Analysis)
\`\`\`chart
{
  "type": "radar",
  "title": "Developer Skill Profile",
  "data": [
    { "name": "React", "score": 90 },
    { "name": "Python", "score": 85 },
    { "name": "SQL", "score": 70 },
    { "name": "CSS", "score": 95 },
    { "name": "Docker", "score": 60 }
  ],
  "keys": ["score"]
}
\`\`\`

### Bar Chart
\`\`\`chart
{
  "type": "bar",
  "title": "Quarterly Revenue",
  "data": [
    { "name": "Q1", "revenue": 4000 },
    { "name": "Q2", "revenue": 3000 },
    { "name": "Q3", "revenue": 2000 },
    { "name": "Q4", "revenue": 2780 }
  ],
  "keys": ["revenue"]
}
\`\`\`

## 2. Mermaid Diagrams

### Flowchart
\`\`\`mermaid
flowchart TD
  subgraph PreTrainingPhase ["Pre-Training Phase: Core Knowledge Building"]
    direction TB
    A["Large Raw Text Corpus Input"] --> B["Tokenization: Split text into subword token units"]
    B --> C["Token Embedding: Convert tokens to numerical vectors"]
  end
\`\`\`

### Sequence Diagram
\`\`\`mermaid
sequenceDiagram
    Alice->>+John: Hello John, how are you?
    Alice->>+John: John, can you hear me?
    John-->>-Alice: Hi Alice, I can hear you!
    John-->>-Alice: I feel great!
\`\`\`

### Pie Chart
\`\`\`mermaid
pie title Pets adopted by volunteers
    "Dogs" : 386
    "Cats" : 85
    "Rats" : 15
\`\`\`

## 3. Mathematical Equations (KaTeX)
The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$

Block math:
$$
\\int_0^\\infty x^2 e^{-x} dx = 2
$$

## 4. Syntax Highlighting (Prism)
\`\`\`python
def calculate_fibonacci(n):
    if n <= 0: return []
    elif n == 1: return [0]
    result = [0, 1]
    for _ in range(2, n):
        result.append(result[-1] + result[-2])
    return result
\`\`\`

## 5. Enterprise Tables
| Feature | Old Renderer | Rich Renderer |
| :--- | :--- | :--- |
| **Code Blocks** | Basic | Prism IDE Theme with Copy |
| **Charts** | None | Native Recharts |
| **Mermaid** | Crash-prone | Strict Mode Sandboxed |
| **Math** | Broken | LaTeX / KaTeX |
`);

  return (
    <div className="flex h-screen flex-col bg-white">
      <header className="flex h-14 items-center justify-between border-b border-hairline px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-on-primary shadow-sm">
            <Bot size={18} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-ink">SOTA Markdown Engine</h1>
            <p className="text-[11px] font-semibold text-steel">Test and debug rich text</p>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Editor */}
        <div className="flex w-1/2 flex-col border-r border-hairline bg-[#f8f9fa]">
          <div className="flex items-center justify-between bg-stone/40 px-4 py-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-steel">Raw Markdown</span>
          </div>
          <textarea
            className="internal-scroll flex-1 resize-none bg-transparent p-4 text-[13px] font-mono leading-relaxed text-charcoal outline-none placeholder:text-steel/50"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            spellCheck={false}
          />
        </div>
        {/* Right Side: Preview */}
        <div className="flex w-1/2 flex-col bg-white">
          <div className="flex items-center justify-between bg-stone/40 px-4 py-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-brand-blue-deep">Live Preview</span>
          </div>
          <div className="internal-scroll flex-1 overflow-auto p-8">
            <RichMarkdown content={markdown} />
          </div>
        </div>
      </div>
    </div>
  );
}
