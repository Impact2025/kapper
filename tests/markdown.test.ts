import { describe, it, expect } from "vitest";
import { renderMarkdown, stripMarkdown, readingTimeMinutes } from "@/lib/blog/markdown";

describe("renderMarkdown", () => {
  it("renders headings starting at h2", () => {
    expect(renderMarkdown("# Titel")).toContain("<h2>Titel</h2>");
    expect(renderMarkdown("## Sectie")).toContain("<h3>Sectie</h3>");
  });

  it("escapes HTML to prevent injection", () => {
    const html = renderMarkdown("Hallo <script>alert(1)</script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders unordered lists", () => {
    const html = renderMarkdown("- een\n- twee");
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>een</li>");
    expect(html).toContain("<li>twee</li>");
  });

  it("renders bold, italic and links", () => {
    expect(renderMarkdown("**vet**")).toContain("<strong>vet</strong>");
    expect(renderMarkdown("[link](https://example.com)")).toContain(
      '<a href="https://example.com" rel="noopener">link</a>',
    );
  });

  it("ignores non-http link protocols (no javascript:)", () => {
    const html = renderMarkdown("[x](javascript:alert(1))");
    expect(html).not.toContain("href=\"javascript:");
  });
});

describe("stripMarkdown / readingTime", () => {
  it("strips markdown syntax", () => {
    expect(stripMarkdown("## Kop met **vet**")).toBe("Kop met vet");
  });

  it("estimates at least one minute", () => {
    expect(readingTimeMinutes("kort")).toBe(1);
    expect(readingTimeMinutes("woord ".repeat(400))).toBeGreaterThanOrEqual(2);
  });
});
