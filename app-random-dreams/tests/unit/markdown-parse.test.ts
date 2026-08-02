import { describe, expect, it } from "vitest";
import { parseMarkdown } from "../../lib/pdf/markdown";

describe("parseMarkdown", () => {
  it("convierte títulos de nivel 1 a 3", () => {
    const blocks = parseMarkdown("# Uno\n## Dos\n### Tres");
    expect(blocks.map((b) => b.type)).toEqual(["heading", "heading", "heading"]);
    expect(blocks[0]).toMatchObject({ level: 1 });
    expect(blocks[1]).toMatchObject({ level: 2 });
    expect(blocks[2]).toMatchObject({ level: 3 });
  });

  it("agrupa párrafos separados por línea en blanco", () => {
    const blocks = parseMarkdown("Primer párrafo.\n\nSegundo párrafo.");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].type).toBe("paragraph");
    expect(blocks[1].type).toBe("paragraph");
  });

  it("detecta negrita, itálica y código inline", () => {
    const blocks = parseMarkdown("Texto **en negrita** y *itálica* y `código`.");
    const inline = blocks[0].type === "paragraph" ? blocks[0].inline : [];
    expect(inline).toEqual([
      { type: "text", value: "Texto " },
      { type: "bold", children: [{ type: "text", value: "en negrita" }] },
      { type: "text", value: " y " },
      { type: "italic", children: [{ type: "text", value: "itálica" }] },
      { type: "text", value: " y " },
      { type: "code", value: "código" },
      { type: "text", value: "." }
    ]);
  });

  it("detecta listas con viñetas y numeradas", () => {
    const blocks = parseMarkdown("- a\n- b\n\n1. uno\n2. dos");
    expect(blocks[0]).toMatchObject({ type: "list", ordered: false });
    if (blocks[0].type === "list") expect(blocks[0].items).toHaveLength(2);
    expect(blocks[1]).toMatchObject({ type: "list", ordered: true });
  });

  it("detecta blockquotes, bloques de código y líneas divisorias", () => {
    const blocks = parseMarkdown("> cita\n\n```\nconst a = 1;\n```\n\n---");
    expect(blocks[0].type).toBe("blockquote");
    expect(blocks[1].type).toBe("code");
    if (blocks[1].type === "code") expect(blocks[1].value).toBe("const a = 1;");
    expect(blocks[2].type).toBe("hr");
  });
});
