import ReactMarkdown from "react-markdown";

export function MarkdownNote({ children }: { children: string }) {
  return (
    <ReactMarkdown
      components={{
        h1: ({ children }) => (
          <h3 className="mb-2 mt-4 font-display text-lg font-semibold text-felt-ink first:mt-0">
            {children}
          </h3>
        ),
        h2: ({ children }) => (
          <h3 className="mb-2 mt-4 font-display text-base font-semibold text-felt-ink first:mt-0">
            {children}
          </h3>
        ),
        h3: ({ children }) => (
          <h3 className="mb-1.5 mt-3 text-sm font-semibold text-felt-ink first:mt-0">
            {children}
          </h3>
        ),
        p: ({ children }) => (
          <p className="mb-2 whitespace-pre-wrap text-sm leading-6 text-felt-sub last:mb-0">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mb-2 list-disc space-y-1 pl-5 text-sm leading-6 text-felt-sub last:mb-0">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-2 list-decimal space-y-1 pl-5 text-sm leading-6 text-felt-sub last:mb-0">
            {children}
          </ol>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-brass underline decoration-brass/50 underline-offset-2 hover:text-brass-deep"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-2 border-l-2 border-brass/60 pl-3 italic text-felt-sub last:mb-0">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="rounded bg-felt-bg/70 px-1 py-0.5 font-mono text-[0.85em] text-felt-ink">
            {children}
          </code>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
