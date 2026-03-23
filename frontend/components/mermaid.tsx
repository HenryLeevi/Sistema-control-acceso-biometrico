'use client';

import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, sans-serif',
    });

    const renderChart = async () => {
      if (ref.current && chart) {
        try {
          const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
          const { svg } = await mermaid.render(id, chart);
          setSvg(svg);
        } catch (error) {
          console.error('Mermaid render error:', error);
          setSvg('<div class="text-red-500 p-4 border rounded">Error renderizando diagrama</div>');
        }
      }
    };

    renderChart();
  }, [chart]);

  return (
    <div 
      className="mermaid-container flex justify-center py-6 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-x-auto my-4 transition-all hover:shadow-md" 
      dangerouslySetInnerHTML={{ __html: svg }} 
      ref={ref}
    />
  );
};

export default Mermaid;
