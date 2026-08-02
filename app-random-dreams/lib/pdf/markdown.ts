export type Inline =
  | { type: "text"; value: string }
  | { type: "bold"; children: Inline[] }
  | { type: "italic"; children: Inline[] }
  | { type: "code"; value: string };

export type Block =
  | { type: "heading"; level: number; inline: Inline[] }
  | { type: "paragraph"; inline: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  | { type: "blockquote"; blocks: Block[] }
  | { type: "code"; value: string }
  | { type: "hr" };

function parseInline(source: string): Inline[] {
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const nodes: Inline[] = [];
  let last = 0;
  for (const match of source.matchAll(regex)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push({ type: "text", value: source.slice(last, index) });
    const token = match[0];
    if (token.startsWith("**")) {
      nodes.push({ type: "bold", children: parseInline(token.slice(2, -2)) });
    } else if (token.startsWith("`")) {
      nodes.push({ type: "code", value: token.slice(1, -1) });
    } else {
      nodes.push({ type: "italic", children: parseInline(token.slice(1, -1)) });
    }
    last = index + token.length;
  }
  if (last < source.length) nodes.push({ type: "text", value: source.slice(last) });
  return nodes;
}

export function parseMarkdown(source: string): Block[] {
  const lines = source.split(/\r?\n/);
  const blocks: Block[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push({ type: "paragraph", inline: parseInline(paragraph.join(" ")) });
      paragraph = [];
    }
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      flushParagraph();
      i++;
      const code: string[] = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        code.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", value: code.join("\n") });
      i++;
      continue;
    }

    const heading = trimmed.match(/^(#{1,3})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      blocks.push({
        type: "heading",
        level: heading[1].length,
        inline: parseInline(heading[2])
      });
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) {
      flushParagraph();
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    if (trimmed.startsWith(">")) {
      flushParagraph();
      const quote: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quote.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", blocks: parseMarkdown(quote.join("\n")) });
      continue;
    }

    const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
    const numbered = trimmed.match(/^\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      flushParagraph();
      const ordered = !bullet;
      const items: Inline[][] = [];
      while (i < lines.length) {
        const item = ordered
          ? lines[i].trim().match(/^\d+[.)]\s+(.*)$/)
          : lines[i].trim().match(/^[-*+]\s+(.*)$/);
        if (!item) break;
        items.push(parseInline(item[1]));
        i++;
      }
      blocks.push({ type: "list", ordered, items });
      continue;
    }

    if (trimmed === "") {
      flushParagraph();
      i++;
      continue;
    }

    paragraph.push(trimmed);
    i++;
  }
  flushParagraph();
  return blocks;
}
