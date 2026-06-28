"use client";

import React, { useState } from "react";
import RichMarkdown from "@/components/markdown/RichMarkdown";
import { Bot } from "lucide-react";

export default function MarkdownPlayground() {
  const [markdown, setMarkdown] = useState<string>(`# SOTA Markdown Renderer Test

## 1. Native Charts (Recharts)
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
\`\`\`mermaid
flowchart TD
  subgraph PreTrainingPhase ["Pre-Training Phase: Core Knowledge Building"]
    direction TB
    A["Large Raw Text Corpus Input"] --> B["Tokenization: Split text into subword token units"]
  end
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
| Feature | Old Renderer | SOTA Renderer |
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
