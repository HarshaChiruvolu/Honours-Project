import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  // Parse blocks: code blocks vs text blocks
  const blocks = splitCodeBlocks(content);

  return (
    <div className="space-y-2 text-xs leading-relaxed text-zinc-200">
      {blocks.map((block, idx) => {
        if (block.type === "code") {
          return (
            <CodeBlock key={idx} language={block.language} code={block.content} />
          );
        }
        return <TextBlock key={idx} content={block.content} />;
      })}
    </div>
  );
}

// Splits content into regular text blocks and fenced code blocks (```lang ... ```)
function splitCodeBlocks(raw: string): Array<{ type: "text" | "code"; content: string; language?: string }> {
  const result: Array<{ type: "text" | "code"; content: string; language?: string }> = [];
  const lines = raw.split("\n");
  let inCode = false;
  let codeLang = "";
  let currentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      if (!inCode) {
        if (currentLines.length > 0) {
          result.push({ type: "text", content: currentLines.join("\n") });
          currentLines = [];
        }
        inCode = true;
        codeLang = line.trim().slice(3).trim();
      } else {
        result.push({ type: "code", content: currentLines.join("\n"), language: codeLang });
        currentLines = [];
        inCode = false;
        codeLang = "";
      }
    } else {
      currentLines.push(line);
    }
  }

  if (currentLines.length > 0) {
    result.push({
      type: inCode ? "code" : "text",
      content: currentLines.join("\n"),
      language: codeLang,
    });
  }

  return result;
}

// Code block with syntax title and copy-to-clipboard functionality
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden font-mono text-[11px] shadow-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900/90 border-b border-zinc-800 text-[10px] text-zinc-400">
        <span className="font-semibold uppercase tracking-wider">{language || "Code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-zinc-200 leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Renders markdown headings, blockquotes, lists, horizontal rules, and paragraphs
function TextBlock({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Empty line
    if (!trimmed) {
      i++;
      continue;
    }

    // Horizontal Rule (--- or ***)
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      elements.push(<hr key={i} className="border-zinc-800 my-2.5" />);
      i++;
      continue;
    }

    // Headers
    if (trimmed.startsWith("#### ")) {
      elements.push(
        <h5 key={i} className="text-xs font-semibold text-indigo-300 mt-2.5 mb-1 tracking-wide">
          <InlineContent text={trimmed.slice(5)} />
        </h5>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={i} className="text-sm font-semibold text-indigo-200 mt-3 mb-1 tracking-wide">
          <InlineContent text={trimmed.slice(4)} />
        </h4>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={i} className="text-sm font-bold text-white mt-3.5 mb-1.5">
          <InlineContent text={trimmed.slice(3)} />
        </h3>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      elements.push(
        <h2 key={i} className="text-base font-bold text-white mt-4 mb-2">
          <InlineContent text={trimmed.slice(2)} />
        </h2>
      );
      i++;
      continue;
    }

    // Blockquote (> ...)
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-2 border-indigo-500 bg-indigo-500/10 px-3.5 py-2 rounded-r-xl my-2 text-zinc-300 text-[11px] leading-relaxed shadow-sm"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={qIdx} className={qIdx > 0 ? "mt-1" : ""}>
              <InlineContent text={ql} />
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Unordered List (- or * or +)
    if (/^[-*+]\s+/.test(trimmed)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i].trim())) {
        listItems.push(lines[i].trim().replace(/^[-*+]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-2 pl-1">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
              <div className="flex-1">
                <InlineContent text={item} />
              </div>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered List (1. , 2. )
    if (/^\d+\.\s+/.test(trimmed)) {
      const listItems: { num: string; text: string }[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        const match = lines[i].trim().match(/^(\d+)\.\s+(.*)$/);
        if (match) {
          listItems.push({ num: match[1], text: match[2] });
        }
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1.5 my-2 pl-0.5">
          {listItems.map((item, itemIdx) => (
            <li key={itemIdx} className="flex items-start gap-2">
              <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1 rounded shrink-0 mt-0.5">
                {item.num}
              </span>
              <div className="flex-1">
                <InlineContent text={item.text} />
              </div>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="leading-relaxed mb-1.5">
        <InlineContent text={trimmed} />
      </p>
    );
    i++;
  }

  return <div>{elements}</div>;
}

// Formats inline tokens: bold, italic, code, math ($...$), and links
function InlineContent({ text }: { text: string }) {
  // Replace common LaTeX symbols with Unicode symbols for clean typography
  const sanitized = text
    .replace(/\\to/g, "→")
    .replace(/\\leftarrow/g, "←")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\times/g, "×")
    .replace(/\\mathcal\{O\}/g, "O")
    .replace(/\\in/g, "∈");

  // Regex tokenizer:
  // 1: Math: \$([^$]+)\$
  // 2: Inline code: `([^`]+)`
  // 3: Bold: \*\*([^*]+)\*\*
  // 4: Italic: \*([^*]+)\*
  // 5: Links: \[([^\]]+)\]\(([^)]+)\)
  const regex = /(\$[^$]+\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = sanitized.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;

        // Math: $formula$
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          const formula = part.slice(1, -1);
          return (
            <span
              key={index}
              className="inline-flex items-center font-mono text-[11px] font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1 py-0.2 rounded mx-0.5 align-baseline"
            >
              {formula}
            </span>
          );
        }

        // Inline Code: `code`
        if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
          const code = part.slice(1, -1);
          return (
            <code
              key={index}
              className="inline-block font-mono text-[11px] text-indigo-300 bg-zinc-800/90 border border-zinc-700/60 px-1.5 py-0.5 rounded mx-0.5"
            >
              {code}
            </code>
          );
        }

        // Bold: **text**
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
          const boldText = part.slice(2, -2);
          return (
            <strong key={index} className="font-semibold text-white">
              {boldText}
            </strong>
          );
        }

        // Italic: *text*
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
          const italicText = part.slice(1, -1);
          return (
            <em key={index} className="italic text-zinc-300">
              {italicText}
            </em>
          );
        }

        // Link: [label](url)
        const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (linkMatch) {
          return (
            <a
              key={index}
              href={linkMatch[2]}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors"
            >
              {linkMatch[1]}
            </a>
          );
        }

        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </>
  );
}
