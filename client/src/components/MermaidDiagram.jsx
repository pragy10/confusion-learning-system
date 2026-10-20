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

  // 1. Unescape literal escaped newlines
  clean = clean.replace(/\\n/g, '\n');

  // 2. Normalize and quote all node labels cleanly
  clean = clean.replace(/(\b\w+)\s*\[\s*(.+?)\s*\](?=\s*(-->|---|==>|-.->|\n|$))/g, (match, id, rawLabel) => {
    let label = rawLabel.trim();
    // Remove leading/trailing quotes or escaped quotes like \" or \' or ' or "
    label = label.replace(/^(\\?['"])+/, '').replace(/(\\?['"])+$/, '');
    // Remove backslashes
    label = label.replace(/\\/g, '');
    // Replace semicolons inside labels because mermaid treats ; as statement separator
    label = label.replace(/;/g, ' -');
    // Clean internal double quotes
    label = label.replace(/"/g, "'");
    return `${id}["${label}"]`;
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
