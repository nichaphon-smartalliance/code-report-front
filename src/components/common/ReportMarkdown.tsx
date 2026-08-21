"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * The report renderer (TASK-008 item 3 / SPEC-001 "Frontend" 3).
 *
 * **Why this is safe.** The report text is written by an AI from an untrusted
 * repository's code and commit messages, so it must never be able to inject
 * HTML. `react-markdown` builds React elements directly — there is no
 * `dangerouslySetInnerHTML` anywhere in this app — and **`rehype-raw` is
 * deliberately not installed**, so a raw HTML node from the markdown is turned
 * into a *text* node instead of an element. `<script>` and
 * `<img src=x onerror=…>` therefore appear on screen as the characters the
 * report contained, which is both inert and honest about what the repository
 * said.
 *
 * Link and image URLs additionally pass through react-markdown's own
 * `defaultUrlTransform`, which drops `javascript:` and other non-http(s)
 * schemes. Links carry `rel="nofollow noopener noreferrer ugc"` — the report is
 * user-generated content pointing at a stranger's repository.
 *
 * Typography lives in the `.cr-prose` block in `globals.css`; this file maps
 * only the things that need element-level decisions.
 */
export function ReportMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="cr-prose max-w-measure">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // The page already owns the only <h1>, so the report's own heading
          // levels are demoted by one and the document outline stays valid.
          h1: ({ children }) => <h2>{children}</h2>,
          h2: ({ children }) => <h3>{children}</h3>,
          h3: ({ children }) => <h4>{children}</h4>,
          h4: ({ children }) => <h5>{children}</h5>,
          h5: ({ children }) => <h6>{children}</h6>,
          h6: ({ children }) => <h6>{children}</h6>,
          a: ({ href, children }) => (
            <a href={href} rel="nofollow noopener noreferrer ugc" target="_blank">
              {children}
            </a>
          ),
          // A table must scroll horizontally rather than truncate its data
          // (FRONTEND-STANDARD §2), and every cell aligns its digits.
          table: ({ children }) => (
            <div className="cr-table-scroll">
              <table className="cr-nums">{children}</table>
            </div>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
