import {
  getCodeLanguage,
  isMermaidLanguage,
  looksLikeMermaid,
  normalizeMermaidChart,
  normalizeRenderableContent,
} from "@/components/ChatPanel";

jest.mock("mermaid", () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    parse: jest.fn(),
    render: jest.fn(),
  },
}));

describe("chat text rendering helpers", () => {
  it("recognizes mermaid language aliases from markdown code classes", () => {
    expect(getCodeLanguage("language-mermaid")).toBe("mermaid");
    expect(getCodeLanguage("hljs language-mermaid.js")).toBe("mermaid-js");
    expect(isMermaidLanguage("mmd")).toBe(true);
    expect(isMermaidLanguage("mermaid-js")).toBe(true);
  });

  it("normalizes common assistant mermaid wrappers", () => {
    expect(normalizeMermaidChart("```mermaid\ngraph TD\nA --> B\n```")).toBe("graph TD\nA --> B");
    expect(normalizeMermaidChart("mermaid\ngraph TD\nA[\u201CHello\u201D] --> B")).toBe('graph TD\nA["Hello"] --> B');
  });

  it("detects raw mermaid blocks and wraps them for markdown rendering", () => {
    const content = "Here is the diagram:\n\ngraph TD\nA[Prompt] --> B[LLM]\nB --> C[Answer]\n\nDone.";

    expect(looksLikeMermaid("graph TD\nA --> B")).toBe(true);
    expect(normalizeRenderableContent(content)).toContain("```mermaid\ngraph TD\nA[Prompt] --> B[LLM]\nB --> C[Answer]\n```");
  });
});
