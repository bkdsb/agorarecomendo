"use client";

import React from "react";

export default function LiveArticleRender({ initialHtml }: { initialHtml: string | null | undefined }) {
  const [html, setHtml] = React.useState<string>(initialHtml || "");

  React.useEffect(() => {
    const onUpdate = (e: Event) => {
      try {
        const detail = (e as CustomEvent).detail as string;
        if (typeof detail === 'string') setHtml(detail);
      } catch {}
    };
    window.addEventListener('article:preview:update', onUpdate as EventListener);
    return () => window.removeEventListener('article:preview:update', onUpdate as EventListener);
  }, []);

  return (
    <div className="overflow-x-hidden">
      <article
        className="prose prose-lg prose-neutral dark:prose-invert max-w-none break-words prose-p:my-3 prose-p:leading-relaxed prose-headings:leading-tight prose-headings:mt-8 prose-headings:mb-3"
        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
      >
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </div>
  );
}
