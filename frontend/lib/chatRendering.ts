const MERMAID_LANGUAGE_ALIASES = new Set(["mermaid", "mmd", "mermaid-js", "mermaidjs"]);

const MERMAID_START_PATTERN =
  /^(?:%%\{[\s\S]*\}%%\s*)?(?:graph|flowchart|sequenceDiagram|classDiagram|stateDiagram(?:-v2)?|erDiagram|journey|gantt|pie|gitGraph|mindmap|timeline|quadrantChart|requirementDiagram|C4Context|C4Container|C4Component|C4Dynamic|block-beta|packet-beta|architecture-beta|sankey-beta|xychart-beta)\b/i;

const MERMAID_CONTINUATION_PATTERN =
  /^(\s+|%%|accTitle|accDescr|actor|alt|and|autonumber|class|classDef|click|dateFormat|end|else|gantt|linkStyle|loop|note|opt|par|participant|rect|section|style|subgraph|title|todayMarker|axisFormat|tickInterval|x-axis|y-axis|\w+\s*(?:--|==|-\.)|\w+\s*:|\w+\s*\[|\w+\s*\(|\w+\s*\{|\w+\s*>|\w+\s*:::)/i;

export function getCodeLanguage(className?: string) {
  const token = (className ?? "")
    .split(/\s+/)
    .find((part) => part.toLowerCase().startsWith("language-"));

  return token?.replace(/^language-/i, "").toLowerCase().replace(/[._]/g, "-") ?? "";
}

export function isMermaidLanguage(language?: string) {
  return MERMAID_LANGUAGE_ALIASES.has((language ?? "").toLowerCase().replace(/[._]/g, "-"));
}

export function normalizeMermaidChart(raw: string) {
  let chart = raw.trim();

  chart = chart.replace(/^```(?:mermaid|mmd|mermaid-js|mermaidjs)?\s*/i, "").replace(/```$/i, "").trim();
  chart = chart.replace(/^(?:mermaid|mmd|mermaid-js|mermaidjs)\s*\n/i, "").trim();

  return chart
    .replace(/[\u201C\u201D]/g, "\"")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u00A0/g, " ");
}

export function looksLikeMermaid(text: string) {
  const chart = normalizeMermaidChart(text);
  const lines = chart.split(/\r?\n/).map((line) => line.trimEnd());
  const firstContentLine = lines.find((line) => line.trim());

  if (!firstContentLine || !MERMAID_START_PATTERN.test(firstContentLine.trim())) {
    return false;
  }

  return lines.length > 1 || /^(?:pie|mindmap|timeline|gitGraph)\b/i.test(firstContentLine.trim());
}

function isMermaidContinuationLine(line: string) {
  const trimmed = line.trim();
  return !trimmed || MERMAID_CONTINUATION_PATTERN.test(line) || /(?:-->|---|==>|-.->|::|\|.*\||-->|\[.*\]|\(.*\)|\{.*\})/.test(line);
}

export function normalizeRenderableContent(content: string) {
  const lines = content.split(/\r?\n/);
  const output: string[] = [];
  let index = 0;
  let inFence = false;

  while (index < lines.length) {
    const line = lines[index];

    if (line.trimStart().startsWith("```")) {
      inFence = !inFence;
      output.push(line);
      index += 1;
      continue;
    }

    if (!inFence && MERMAID_START_PATTERN.test(line.trim())) {
      const block = [line];
      let nextIndex = index + 1;

      while (nextIndex < lines.length && !lines[nextIndex].trimStart().startsWith("```") && isMermaidContinuationLine(lines[nextIndex])) {
        block.push(lines[nextIndex]);
        nextIndex += 1;
      }

      if (block.length > 1 && looksLikeMermaid(block.join("\n"))) {
        output.push("```mermaid", ...block, "```");
        index = nextIndex;
        continue;
      }
    }

    output.push(line);
    index += 1;
  }

  return output.join("\n");
}
