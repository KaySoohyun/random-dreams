import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { parseMarkdown, type Block, type Inline } from "./markdown";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.5,
    color: "#1f2937"
  },
  heading: {
    fontFamily: "Helvetica-Bold",
    color: "#8a6d1f",
    marginTop: 14,
    marginBottom: 6
  },
  h1: { fontSize: 16 },
  h2: { fontSize: 14 },
  h3: { fontSize: 12 },
  paragraph: { marginBottom: 6 },
  bold: { fontFamily: "Helvetica-Bold" },
  italic: { fontFamily: "Helvetica-Oblique" },
  inlineCode: { fontFamily: "Courier", fontSize: 9, backgroundColor: "#f3f4f6" },
  code: {
    fontFamily: "Courier",
    fontSize: 9,
    backgroundColor: "#f3f4f6",
    padding: 8,
    marginBottom: 6
  },
  list: { marginBottom: 6, marginLeft: 10 },
  listItem: { flexDirection: "row", marginBottom: 3 },
  bullet: { width: 16 },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: "#d4af37",
    paddingLeft: 8,
    marginBottom: 6,
    color: "#4b5563"
  },
  hr: {
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    marginVertical: 10
  },
  header: {
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#d4af37"
  },
  headerImage: {
    width: 140,
    height: 60,
    objectFit: "contain"
  }
});

const headingStyles: Record<number, typeof styles.h1> = {
  1: styles.h1,
  2: styles.h2,
  3: styles.h3
};

function InlineText({ nodes }: { nodes: Inline[] }) {
  return (
    <Text>
      {nodes.map((node, index) => {
        if (node.type === "text") return node.value;
        if (node.type === "code") {
          return (
            <Text key={index} style={styles.inlineCode}>
              {node.value}
            </Text>
          );
        }
        if (node.type === "bold") {
          return (
            <Text key={index} style={styles.bold}>
              <InlineText nodes={node.children} />
            </Text>
          );
        }
        return (
          <Text key={index} style={styles.italic}>
            <InlineText nodes={node.children} />
          </Text>
        );
      })}
    </Text>
  );
}

function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case "heading":
      return (
        <Text style={[styles.heading, headingStyles[block.level]]}>
          <InlineText nodes={block.inline} />
        </Text>
      );
    case "paragraph":
      return (
        <Text style={styles.paragraph}>
          <InlineText nodes={block.inline} />
        </Text>
      );
    case "list":
      return (
        <View style={styles.list}>
          {block.items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bullet}>{block.ordered ? `${index + 1}.` : "•"}</Text>
              <Text style={{ flex: 1 }}>
                <InlineText nodes={item} />
              </Text>
            </View>
          ))}
        </View>
      );
    case "blockquote":
      return (
        <View style={styles.blockquote}>
          {block.blocks.map((nested, index) => (
            <BlockRenderer key={index} block={nested} />
          ))}
        </View>
      );
    case "code":
      return <Text style={styles.code}>{block.value}</Text>;
    case "hr":
      return <View style={styles.hr} />;
  }
}

export function ResultDocument({ markdown, logo }: { markdown: string; logo?: string }) {
  const blocks = parseMarkdown(markdown);
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {logo ? (
          <View style={styles.header}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf no es <img> HTML */}
            <Image src={logo} style={styles.headerImage} />
          </View>
        ) : null}
        {blocks.map((block, index) => (
          <BlockRenderer key={index} block={block} />
        ))}
      </Page>
    </Document>
  );
}
