import { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  securityLevel: 'loose',
  suppressErrorRendering: true,
  flowchart: { useMaxWidth: true, htmlLabels: true },
});

function sanitizeMermaid(code) {
  if (!code) return '';
  // Clean markdown backticks if any
  let clean = code.replace(/```mermaid/gi, '').replace(/```/g, '').trim();

  // Wrap unquoted node labels inside [...] with double quotes to prevent syntax errors on parens, e.g. A[Label (info)] -> A["Label (info)"]
  clean = clean.replace(/(\b\w+)\s*\[\s*(?!"|\s*")([^\]\n]+)\s*\]/g, (match, id, label) => {
    // Escaping any internal double quotes inside label
    const safeLabel = label.replace(/"/g, "'");
    return `${id}["${safeLabel}"]`;
  });

  return clean;
}

function MermaidDiagram({ chart }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!chart || !containerRef.current) return;

    const cleanedChart = sanitizeMermaid(chart);
    const id = 'mermaid-svg-' + Math.random().toString(36).substring(2, 9);

    mermaid.render(id, cleanedChart).then((result) => {
      if (!containerRef.current) return;
      containerRef.current.innerHTML = result.svg;
      const svg = containerRef.current.querySelector('svg');
      if (svg) {
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.style.width = '100%';
        svg.style.height = 'auto';
        svg.style.minHeight = '200px';
      }
    }).catch((err) => {
      console.warn('[Mermaid render fallback]', err);
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="p-4 bg-[#111] rounded-lg text-slate-400 text-xs font-mono whitespace-pre-wrap border border-slate-800/60">
            <p class="text-slate-200 font-semibold mb-2">Diagram Source (Render Failed):</p>
            ${cleanedChart}
          </div>
        `;
      }
    });
  }, [chart]);

  return (
    <div
      ref={containerRef}
      className="w-full overflow-x-auto rounded-lg bg-transparent flex justify-center"
    />
  );
}

export default MermaidDiagram;
