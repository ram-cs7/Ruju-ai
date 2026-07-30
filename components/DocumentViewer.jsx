'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, FileText, Globe } from 'lucide-react';

function HighlightedText({ text, highlight }) {
  if (!highlight) return <>{text}</>;
  
  // Basic highlighting logic
  const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return (
    <span>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() ? 
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900/50 text-slate-900 dark:text-yellow-100 rounded px-1">{part}</mark> : 
        part
      )}
    </span>
  );
}

export default function DocumentViewer({ activeDocument, activeEvidence }) {
  const [scale, setScale] = useState(1.0);
  const [pdfUrl, setPdfUrl] = useState(null);

  // Generate object URL for PDF files
  useEffect(() => {
    if (activeDocument?.file && activeDocument.file.type === 'application/pdf') {
      const url = URL.createObjectURL(activeDocument.file);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [activeDocument]);

  if (!activeDocument) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50 dark:bg-slate-900/50">
        <FileText size={48} className="mb-4 opacity-50" />
        <p>No document selected</p>
      </div>
    );
  }

  const isPDF = activeDocument.file && activeDocument.file.type === 'application/pdf';

  return (
    <div className="flex flex-col h-full bg-slate-100 dark:bg-slate-950">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          {activeDocument.url ? <Globe size={16} className="text-blue-500 shrink-0" /> : <FileText size={16} className="text-blue-500 shrink-0" />}
          <span className="font-medium text-sm truncate">{activeDocument.name}</span>
        </div>
      </div>

      {/* Viewer Area */}
      <div className="flex-1 overflow-auto relative p-4 flex justify-center bg-slate-100 dark:bg-slate-950">
        {isPDF ? (
          <div className="w-full h-full bg-slate-200 dark:bg-slate-800 rounded shadow-inner overflow-hidden">
            {pdfUrl ? (
              <iframe 
                src={`${pdfUrl}#toolbar=0&navpanes=0`} 
                className="w-full h-full border-none"
                title={activeDocument.name}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">Loading PDF...</div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 p-8 shadow-sm text-sm whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200">
            {activeEvidence ? (
              <HighlightedText text={activeDocument.content} highlight={activeEvidence} />
            ) : (
              activeDocument.content
            )}
          </div>
        )}
      </div>
    </div>
  );
}
