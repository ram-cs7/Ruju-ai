'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Shield, FileText, Search, Brain, ShieldCheck, CheckCircle2, XCircle,
  ChevronDown, ChevronRight, Upload, History, RotateCcw, Sparkles, Loader2, Trash2, Info, Moon, Sun, Printer, Download, Share2, HelpCircle, Settings, Mail, CreditCard, BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignInButton, SignUpButton, UserButton, OrganizationSwitcher, useAuth, useUser } from '@clerk/nextjs';
import { useAgentPipeline } from '../hooks/useAgentPipeline';
import { parseFile } from '../utils/fileParser';
import ReactMarkdown from 'react-markdown';
import dynamic from 'next/dynamic';

const DocumentViewer = dynamic(() => import('./DocumentViewer'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-slate-500 animate-pulse">
      Loading PDF Engine...
    </div>
  )
});

// ---------- local storage helpers ----------
function listKeys(prefix) {
  if (typeof window === 'undefined') return [];
  try {
    return Object.keys(window.localStorage).filter((k) => k.startsWith(prefix));
  } catch (e) { return []; }
}
function getItem(key) {
  try { return window.localStorage.getItem(key); } catch (e) { return null; }
}
function setItem(key, value) {
  try { window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
}
function removeItem(key) {
  try { window.localStorage.removeItem(key); } catch (e) { /* noop */ }
}

function scoreTier(score) {
  if (score >= 80) return { label: 'VERIFIED', text: 'text-emerald-800 dark:text-emerald-400', border: 'border-emerald-800 dark:border-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30' };
  if (score >= 50) return { label: 'PARTIAL', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-700 dark:border-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
  return { label: 'FLAGGED', text: 'text-red-700 dark:text-red-400', border: 'border-red-700 dark:border-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
}

const STAGES = [
  { key: 'retrieving', label: 'Retrieve', icon: FileText },
  { key: 'planning', label: 'Plan', icon: Brain },
  { key: 'researching', label: 'Research', icon: Search },
  { key: 'synthesizing', label: 'Synthesize', icon: Sparkles },
  { key: 'verifying', label: 'Verify', icon: ShieldCheck },
];
const STAGE_ORDER = ['retrieving', 'planning', 'researching', 'synthesizing', 'verifying', 'consistency', 'done'];

function getNodeStatus(nodeKey, currentStage) {
  const nodeIdx = STAGE_ORDER.indexOf(nodeKey);
  const curIdx = STAGE_ORDER.indexOf(currentStage);
  if (curIdx > nodeIdx) return 'done';
  if (curIdx === nodeIdx) return 'active';
  return 'pending';
}

function StageNode({ label, status, icon: Icon }) {
  const isDone = status === 'done';
  const isActive = status === 'active';

  const borderClass = isDone ? 'border-emerald-700 dark:border-emerald-500' : isActive ? 'border-blue-700 dark:border-blue-400' : 'border-gray-300 dark:border-gray-600';
  const bgClass = status === 'pending' ? 'bg-transparent' : isDone ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-blue-100 dark:bg-blue-900/30';
  const textClass = status === 'pending' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-900 dark:text-slate-100';
  const iconColorClass = isDone ? 'text-emerald-700 dark:text-emerald-500' : isActive ? 'text-blue-700 dark:text-blue-400' : 'text-gray-300 dark:text-gray-600';

  return (
    <div className="flex flex-col items-center gap-1.5 px-1">
      <div className={`rounded-full flex items-center justify-center border-2 ${borderClass} ${bgClass} transition-colors duration-300`} style={{ width: 36, height: 36 }}>
        {isActive ? <Loader2 size={16} className={`animate-spin ${iconColorClass}`} /> : <Icon size={16} className={iconColorClass} />}
      </div>
      <span className={`font-mono uppercase text-center text-[10px] tracking-widest ${textClass}`}>{label}</span>
    </div>
  );
}

function StampBadge({ score }) {
  const tier = scoreTier(score);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.4, rotate: -6 }}
      animate={{ opacity: 1, scale: 1, rotate: -6 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex flex-col items-center justify-center rounded-full flex-shrink-0 border-[3px] ${tier.border} ${tier.bg} ${tier.text} shadow-sm backdrop-blur-sm`}
      style={{ width: 132, height: 132 }}
    >
      <span className="font-display font-bold leading-none text-4xl">{score}</span>
      <span className="font-mono tracking-widest mt-1 text-[10px]">{tier.label}</span>
    </motion.div>
  );
}

function ClaimEntry({ claim, expanded, onToggle, onHighlight }) {
  const supported = !!claim.supported;
  const bg = supported ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : 'bg-red-50/50 dark:bg-red-900/10';
  const border = supported ? 'border-emerald-600 dark:border-emerald-500' : 'border-red-600 dark:border-red-500';
  const iconColor = supported ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg overflow-hidden border ${border} ${bg} transition-colors duration-200`}
    >
      <button onClick={onToggle} className="w-full flex items-start gap-2 p-3 text-left cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
        {supported ? <CheckCircle2 size={16} className={`flex-shrink-0 mt-0.5 ${iconColor}`} /> : <XCircle size={16} className={`flex-shrink-0 mt-0.5 ${iconColor}`} />}
        <span className="text-sm flex-1 text-slate-900 dark:text-slate-100">{claim.claim}</span>
        {expanded ? <ChevronDown size={14} className="flex-shrink-0 mt-1 text-slate-500" /> : <ChevronRight size={14} className="flex-shrink-0 mt-1 text-slate-500" />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-3 overflow-hidden"
          >
            <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400 mt-1 p-2 bg-white/50 dark:bg-black/20 rounded cursor-pointer hover:bg-white/80 dark:hover:bg-black/40 transition-colors"
              onClick={() => claim.evidence && onHighlight(claim.evidence)}>
              {claim.evidence ? `\u201c${claim.evidence}\u201d (Click to highlight)` : 'No supporting evidence found in the source.'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Highlight text helper
const HighlightedText = ({ text, highlight }) => {
  if (!highlight || !highlight.trim()) {
    return <span>{text}</span>;
  }

  // Extract individual quotes if the AI combined them (e.g. "Quote 1" and "Quote 2")
  let terms = [];
  const quoteRegex = /["'\u201C\u201D](.*?)["'\u201C\u201D]/g;
  let match;
  while ((match = quoteRegex.exec(highlight)) !== null) {
    if (match[1].trim().length > 3) {
      terms.push(match[1].trim());
    }
  }

  // Fallback: if no quotes found, just use the cleaned full string
  if (terms.length === 0) {
    terms.push(highlight.trim().replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, ''));
  }

  const escapedTerms = terms.map(term => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
  const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');

  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        (i % 2 === 1)
          ? <mark key={i} className="bg-[#39ff14] text-black rounded px-1 shadow-[0_0_8px_#39ff14] font-bold transition-all duration-300">{part}</mark>
          : part
      )}
    </span>
  );
};

export default function TrustCrew() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [snippetText, setSnippetText] = useState('');

  // Computed full source text for the highlighter and word counter
  const sourceText = [
    ...documents.map(d => `--- Document: ${d.name} ---\n${d.content || '(Loading...)'}`),
    snippetText.trim() ? (snippetText.includes('--- Document:') ? snippetText : `--- Document: Text Snippet ---\n${snippetText}`) : ''
  ].filter(Boolean).join('\n\n');
  const [question, setQuestion] = useState('');
  const [deepVerify, setDeepVerify] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const [history, setHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');

  const [expandedClaim, setExpandedClaim] = useState(null);
  const [showChunks, setShowChunks] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const [activeEvidence, setActiveEvidence] = useState('');
  const [isSourceVisible, setIsSourceVisible] = useState(false);

  const onSaveHistory = useCallback((entryData) => {
    const tempId = Date.now();
    const entry = { id: tempId, ...entryData };
    setHistory((prev) => [entry, ...prev].slice(0, 15));

    fetch('/api/chats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: entryData.question?.slice(0, 50) || 'New Verification',
        messages: [{ role: 'user', content: entryData }]
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.id) {
          setHistory(prev => prev.map(item => item.id === tempId ? { ...item, id: data.id } : item));
        }
      })
      .catch(console.error);
  }, []);

  const {
    stage,
    subquestions,
    subAnswers,
    retrievedChunks,
    answer,
    claims,
    trustScore,
    consistency,
    error,
    runPipeline,
    reset,
    loadState
  } = useAgentPipeline({ deepVerify, onSaveHistory });

  const isRunning = ['retrieving', 'planning', 'researching', 'synthesizing', 'verifying', 'consistency'].includes(stage);
  const activeStages = deepVerify ? [...STAGES, { key: 'consistency', label: 'Cross-check', icon: RotateCcw }] : STAGES;

  useEffect(() => {
    fetch('/api/chats')
      .then(res => res.json())
      .then(data => {
        if (!data.error && Array.isArray(data)) {
          const formatted = data.map(chat => {
            try {
              const msg = chat.messages[0];
              const content = typeof msg.content === 'string' ? JSON.parse(msg.content) : msg.content;
              return { id: chat.id, ...content };
            } catch (e) {
              return null;
            }
          }).filter(Boolean);
          setHistory(formatted);
        }
      })
      .catch(console.error);
  }, []);

  async function processFile(file) {
    if (!file) return;
    setFileError('');
    try {
      const text = await parseFile(file);

      // Immediately add a loading state for this document
      const tempId = Date.now().toString() + Math.random();
      setDocuments(prev => [...prev, { id: tempId, name: file.name, content: text, file: file, type: 'upload', loading: true }]);

      // Process embeddings in the backend
      const res = await fetch('/api/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: file.name, content: text })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process document embeddings.');

      // Update the document with the real database ID
      setDocuments(prev => prev.map(doc =>
        doc.id === tempId ? { ...doc, id: data.documentId, loading: false } : doc
      ));

    } catch (err) {
      setFileError(err.message);
      // Remove loading documents on error
      setDocuments(prev => prev.filter(doc => !doc.loading));
    }
  }

  const [urlInput, setUrlInput] = useState('');
  const [isScraping, setIsScraping] = useState(false);

  async function handleUrlSubmit() {
    if (!urlInput) return;
    setFileError('');
    setIsScraping(true);
    try {
      // 1. Scrape the URL
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput })
      });
      const scrapeData = await scrapeRes.json();
      if (!scrapeRes.ok) throw new Error(scrapeData.error || 'Failed to scrape URL');

      const title = scrapeData.title || urlInput;
      const text = scrapeData.content;

      // 2. Add loading state to UI
      const tempId = Date.now().toString() + Math.random();
      setDocuments(prev => [...prev, { id: tempId, name: title, content: text, type: 'url', url: urlInput, loading: true }]);
      setUrlInput('');

      // 3. Process embeddings for the scraped text
      const docRes = await fetch('/api/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: title, content: text })
      });
      const docData = await docRes.json();
      if (!docRes.ok) throw new Error(docData.error || 'Failed to index scraped content.');

      // 4. Update the document with real ID
      setDocuments(prev => prev.map(doc =>
        doc.id === tempId ? { ...doc, id: docData.documentId, loading: false } : doc
      ));

    } catch (err) {
      setFileError(err.message);
      setDocuments(prev => prev.filter(doc => !doc.loading));
    } finally {
      setIsScraping(false);
    }
  }

  function handleFileUpload(e) {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => processFile(file));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      Array.from(files).forEach(file => processFile(file));
    }
  }

  function handleReset() {
    reset();
    setExpandedClaim(null); setShowChunks(false); setShowNotes(false); setActiveEvidence('');
    setDocuments([]);
    setSnippetText('');
  }

  const handleExportCSV = useCallback(() => {
    if (!claims.length) return;
    const headers = ['Claim', 'Supported', 'Evidence'];
    const rows = claims.map(c => [
      `"${c.claim.replace(/"/g, '""')}"`,
      c.supported ? 'Yes' : 'No',
      `"${(c.evidence || '').replace(/"/g, '""')}"`
    ]);
    const brandingHeader = ['Generated by Ruju.ai - The B2B Anti-Hallucination Engine', '', ''];
    const csvContent = [brandingHeader.join(','), headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `TrustCrew_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [claims]);

  const [shareLink, setShareLink] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    if (!history.length) return;
    const currentChat = history[0];
    if (!currentChat || !currentChat.id) return;

    // Prevent race condition if user clicks Share before /api/chats responds
    if (typeof currentChat.id === 'number') {
      alert("Saving the report to the database... Please try again in just a moment.");
      return;
    }

    setIsSharing(true);
    try {
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: currentChat.id })
      });
      const data = await res.json();
      if (data.shareId) {
        const link = `${window.location.origin}/share/${data.shareId}`;
        setShareLink(link);
        navigator.clipboard.writeText(link);
        alert('Share link copied to clipboard!');
      } else {
        alert('Failed to generate share link.');
      }
    } catch (e) {
      alert('Error generating share link.');
    }
    setIsSharing(false);
  };

  function clearHistory() {
    history.forEach((h) => removeItem(`ruju_${h.id}`));
    setHistory([]);
  }

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  return (
    <div className={`${isDarkMode ? 'dark' : ''} min-h-screen transition-colors duration-300 print:bg-white`}>
      <div className="bg-[#FAF9F6] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen w-full transition-colors duration-300 relative flex">

        {/* Main Application Window */}
        <div className="flex-1 relative min-w-0 flex flex-col">

          {/* Backgrounds Wrapper to prevent scrollbar triggering */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Architectural grid background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>

            {/* Messy sketch lines center background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 dark:opacity-20 w-[1000px] h-[1000px] text-slate-900 dark:text-slate-100">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <path fill="none" stroke="currentColor" strokeWidth="0.2" d="M10,10 Q30,120 90,10 T190,30 M5,40 Q110,60 180,40 M10,60 Q150,130 190,60 M20,80 Q40,160 190,80 M15,100 Q120,10 195,100 M10,120 Q80,180 180,120 M5,140 Q60,30 190,140 M10,160 Q120,180 190,160 M20,180 Q140,50 180,180 M10,195 Q50,90 190,195" />
                <path fill="none" stroke="currentColor" strokeWidth="0.15" d="M20,0 C60,50 30,150 20,200 M40,0 C90,60 10,140 40,200 M60,0 C120,40 50,160 60,200 M80,0 C140,50 80,150 80,200 M100,0 C160,80 100,120 100,200 M120,0 C180,70 120,150 120,200 M140,0 C200,60 130,140 140,200 M160,0 C190,90 150,130 160,200" />
                <path fill="none" stroke="currentColor" strokeWidth="0.1" d="M0,0 C50,100 150,100 200,200 M200,0 C150,100 50,100 0,200 M100,0 C150,50 50,150 100,200 M0,100 C100,150 100,50 200,100" />
              </svg>
            </div>

            {/* Center Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(255,255,255,0.9)_0%,transparent_90%)] dark:bg-[radial-gradient(circle_at_top_center,rgba(30,41,59,0.5)_0%,transparent_90%)]"></div>
          </div>

          <div className="relative z-10 flex flex-col min-h-full">
            <style>{`
            .font-display { font-family: var(--font-display), serif; }
            .font-mono { font-family: var(--font-mono-plex), monospace; }
          `}</style>

            <div className={`w-full mx-auto px-4 py-4 sm:py-6 flex flex-col lg:flex-row gap-6 relative flex-1 ${documents.length === 0 ? 'max-w-4xl justify-center' : 'max-w-[1600px]'}`}>

              {/* Left Pane - Document Viewer */}
              {documents.length > 0 && isSourceVisible && (
                <div className="w-full lg:w-1/2 flex flex-col h-[600px] lg:h-[calc(100vh-4rem)] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm sticky top-6 z-20 print:hidden">
                  <DocumentViewer
                    activeDocument={
                      // Find document containing the active evidence, or just the first document
                      activeEvidence
                        ? documents.find(d => d.content?.includes(activeEvidence)) || documents[0]
                        : documents[0]
                    }
                    activeEvidence={activeEvidence}
                  />
                </div>
              )}

              {/* Right Pane Area */}
              <div className={`flex-1 transition-all duration-300 ${documents.length > 0 && isSourceVisible ? 'lg:w-1/2' : 'w-full max-w-4xl mx-auto'} ${isHistoryOpen ? 'lg:pr-6' : ''}`}>
                <header className="mb-8 pb-6 border-b-2 border-slate-900 dark:border-slate-700 print:hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-0.5 mb-2">
                        <img src="/logo.png" alt="Ruju Logo" className="w-16 h-16 object-contain drop-shadow-sm mix-blend-multiply dark:mix-blend-normal" />
                        <h1 className="font-display font-semibold tracking-tight text-4xl bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-blue-700 dark:from-white dark:to-blue-400">Ruju.ai</h1>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">Ask a question. Get an answer your sources actually back up.</p>
                    </div>
                    <div className="flex items-center gap-3 font-mono text-sm">
                      <button onClick={toggleDarkMode} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                        {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                      </button>
                      {documents.length > 0 && (
                        <button 
                          onClick={() => setIsSourceVisible(!isSourceVisible)} 
                          className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-[11px] font-mono shadow-sm ${isSourceVisible ? 'bg-blue-100 border-blue-200 text-blue-700 dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-400' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'}`}
                        >
                          <BookOpen size={14} /> {isSourceVisible ? 'Hide Source' : 'View Source'}
                        </button>
                      )}
                      <button onClick={() => setIsHistoryOpen(!isHistoryOpen)} className={`p-2 rounded-full transition-colors ${isHistoryOpen ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}>
                        <History size={16} />
                      </button>
                      {isLoaded && !isSignedIn && (
                        <>
                          <SignInButton mode="modal">
                            <button className="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Log In</button>
                          </SignInButton>
                          <SignUpButton mode="modal">
                            <button className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white transition shadow-lg shadow-blue-500/30">Sign Up</button>
                          </SignUpButton>
                        </>
                      )}
                      {isSignedIn && (
                        <>
                          <a
                            href="/settings#/subscription"
                            className="hidden sm:flex items-center justify-center gap-1.5 px-4 h-9 rounded-full border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-500 transition-all shadow-sm font-display small-caps font-bold tracking-widest text-[11px] leading-none pt-0.5"
                          >
                            <Sparkles size={14} /> Upgrade to Pro
                          </a>
                          <div className="hidden sm:flex h-9 items-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg shadow-sm overflow-hidden px-2 py-1">
                            <OrganizationSwitcher hidePersonal={false} />
                          </div>
                          <div className="relative w-8 h-8 rounded-md border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm flex items-center justify-center text-base overflow-hidden hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                            {!user?.hasImage && <span className="pointer-events-none drop-shadow-sm select-none">🕵️‍♂️</span>}
                            <div className={`absolute inset-0 flex items-center justify-center ${!user?.hasImage ? '[&_.cl-avatarBox]:opacity-0' : ''}`}>
                              <UserButton
                                userProfileMode="navigation"
                                userProfileUrl="/settings"
                                appearance={{
                                  elements: {
                                    userButtonPopoverCard: "font-sans shadow-xl border border-slate-200 dark:border-slate-800 rounded-sm",
                                    avatarBox: "!rounded-md",
                                    avatarImage: "!rounded-md object-cover"
                                  }
                                }}
                              >
                                <UserButton.MenuItems>
                                  <UserButton.Link label="Documentation" href="/docs" labelIcon={<BookOpen size={14} />} />
                                  <UserButton.Link label="FAQs" href="/help" labelIcon={<HelpCircle size={14} />} />
                                  <UserButton.Link label="Terms of Service" href="/terms" labelIcon={<FileText size={14} />} />
                                  <UserButton.Link label="Privacy Policy" href="/privacy" labelIcon={<Shield size={14} />} />
                                </UserButton.MenuItems>
                              </UserButton>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setShowHelp((s) => !s)} className="mt-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-100 dark:border-blue-800 text-[11px] font-mono hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-sm">
                    <Info size={14} /> {showHelp ? 'Hide Explanation' : 'How does this work?'}
                  </button>
                  {showHelp && (
                    <div className="mt-4 p-4 rounded-lg bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
                      <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        <strong>How Ruju.ai verifies truth:</strong>
                      </p>
                      <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-400 list-disc pl-5">
                        <li><strong>Infinite Context (RAG):</strong> Your documents are chunked and mathematically indexed in a Vector Database. Ruju retrieves only the exact paragraphs needed, allowing you to upload gigabytes of data.</li>
                        <li><strong>Multi-Agent Pipeline:</strong> A Planner splits your question, Researchers answer each angle, a Synthesizer merges them, and a Verifier extracts and checks every single claim against the source.</li>
                        <li><strong>Trust Score:</strong> You receive a quantifiable 0-100 score based on how much of the answer is explicitly backed up by the text.</li>
                        <li><strong>Deep Verification:</strong> Ruju cross-checks multiple independent answers to ensure logical consistency.</li>
                      </ul>
                    </div>
                  )}
                </header>

                <section
                  className={`mb-10 p-7 rounded-sm transition-all duration-300 border-x border-b border-t-4 shadow-md hover:shadow-xl hover:-translate-y-0.5 backdrop-blur-md bg-white/95 dark:bg-slate-900/95 border-slate-300 border-t-slate-800 dark:border-slate-700 dark:border-t-slate-300 print:hidden
                ${isDragging ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
                    <label className="font-display uppercase text-sm font-semibold tracking-[0.15em] text-slate-700 dark:text-slate-300">Exhibit A — Source Document</label>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-sm bg-white dark:bg-slate-900 overflow-hidden flex-1 sm:w-64">
                        <input
                          type="url"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder="Paste URL to audit..."
                          className="w-full px-3 py-1.5 text-[13px] outline-none bg-transparent dark:text-white"
                          onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                        />
                        <button onClick={handleUrlSubmit} disabled={isScraping || !urlInput} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-[12px] transition-colors disabled:opacity-50 border-l border-slate-300 dark:border-slate-700">
                          {isScraping ? <Loader2 size={14} className="animate-spin" /> : 'Scrape'}
                        </button>
                      </div>

                      <span className="text-slate-400 text-xs font-mono">OR</span>

                      <button onClick={() => fileInputRef.current && fileInputRef.current.click()} className="flex items-center gap-2 font-display font-medium px-4 py-1.5 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:-translate-y-0.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-[13px] text-slate-700 dark:text-slate-200 transition-all active:scale-95 whitespace-nowrap">
                        <Upload size={14} className="text-blue-600 dark:text-blue-400" /> Upload File
                      </button>
                      <input type="file" ref={fileInputRef} accept=".txt,text/plain,.pdf,.docx" className="hidden" onChange={handleFileUpload} />
                    </div>
                  </div>
                  {fileError && <div className="mb-2 text-xs text-red-600 dark:text-red-400">{fileError}</div>}

                  {documents.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {documents.map((doc, i) => (
                        <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[11px] font-mono shadow-sm">
                          {doc.loading ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                          <span className="truncate max-w-[200px]" title={doc.name}>{doc.name} {doc.loading ? '(Indexing...)' : ''}</span>
                          {!doc.loading && (
                            <button onClick={() => setDocuments(docs => docs.filter((_, idx) => idx !== i))} className="hover:text-red-500 transition-colors">
                              <XCircle size={12} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                    {/* The textarea is only for editing snippet. We can use a div for highlighting if activeEvidence is set */}
                    {activeEvidence ? (
                      <div className="w-full p-3 rounded text-sm h-[164px] overflow-y-auto border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 whitespace-pre-wrap leading-relaxed shadow-inner">
                        <HighlightedText text={sourceText} highlight={activeEvidence} />
                      </div>
                    ) : (
                      <textarea
                        value={snippetText}
                        onChange={(e) => setSnippetText(e.target.value)}
                        placeholder={documents.length > 0 ? "Add an optional extra text snippet here..." : "Paste the source text you want the answer checked against..."}
                        rows={documents.length > 0 ? 3 : 7}
                        className="w-full p-3 rounded text-sm resize-y border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none shadow-inner transition-shadow"
                      />
                    )}
                    {activeEvidence && (
                      <button onClick={() => setActiveEvidence('')} className="absolute top-2 right-4 text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded shadow text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700">Clear Highlight</button>
                    )}
                  </div>

                  <div className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {sourceText.trim() ? `${sourceText.trim().split(/\s+/).length} words total` : 'No document yet'}
                  </div>

                  <label className="font-display uppercase mt-8 block mb-3 text-sm font-semibold tracking-[0.15em] text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">The Question</label>
                  <input
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="What do you want to know?"
                    className="w-full p-3 rounded text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-shadow"
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5">
                    <label className="flex items-start gap-2 cursor-pointer select-none text-[12px] text-slate-600 dark:text-slate-400 group">
                      <input type="checkbox" checked={deepVerify} disabled={isRunning} onChange={(e) => setDeepVerify(e.target.checked)} className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-600" />
                      <span className="group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">Deep verification — cross-check the answer against itself (slower)</span>
                    </label>
                    <button
                      onClick={() => {
                        setExpandedClaim(null); setShowChunks(false); setShowNotes(false); setActiveEvidence('');
                        runPipeline(documents, snippetText, question);
                      }}
                      disabled={isRunning || documents.some(d => d.loading)}
                      className="px-6 py-2.5 rounded-sm font-semibold text-[13px] tracking-wide uppercase flex items-center justify-center gap-2 disabled:opacity-50 flex-shrink-0 cursor-pointer bg-gradient-to-r from-indigo-900 to-slate-800 text-white hover:from-indigo-800 hover:to-slate-700 dark:from-slate-200 dark:to-white dark:text-slate-900 dark:hover:from-white dark:hover:to-slate-100 shadow-[0_0_15px_rgba(30,58,138,0.4)] dark:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all active:scale-95 border border-indigo-700 dark:border-slate-300"
                    >
                      {isRunning ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} className="text-blue-300 dark:text-blue-600" />}
                      {isRunning ? 'Running…' : (documents.some(d => d.loading) ? 'Indexing...' : 'Run Verification')}
                    </button>
                  </div>
                  {error && (
                    <div className="mt-4 text-sm p-3 rounded-lg bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800">{error}</div>
                  )}
                </section>

                {stage !== 'idle' && (
                  <section className="mb-8 flex items-start print:hidden">
                    {activeStages.map((s, i) => (
                      <React.Fragment key={s.key}>
                        <StageNode label={s.label} status={getNodeStatus(s.key, stage)} icon={s.icon} />
                        {i < activeStages.length - 1 && (
                          <div className="flex-1 mt-4 h-[2px] bg-slate-200 dark:bg-slate-700" />
                        )}
                      </React.Fragment>
                    ))}
                  </section>
                )}

                {(stage === 'done' || (stage === 'synthesizing' && answer)) && (
                  <section className="space-y-6">

                    {/* Print Header */}
                    <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-6">
                      <div className="flex justify-between items-end">
                        <div className="flex items-center gap-1">
                          <img src="/logo.png" alt="Ruju.ai Logo" className="w-16 h-16 object-contain mix-blend-multiply dark:mix-blend-normal" />
                          <div>
                            <h1 className="font-display font-semibold tracking-tight text-4xl text-slate-900 leading-none">Ruju.ai</h1>
                            <p className="font-mono text-sm uppercase tracking-widest text-slate-500 mt-1">Verification Report</p>
                          </div>
                        </div>
                      </div>
                      <p className="text-base mt-6 text-slate-800 text-center mx-auto max-w-2xl"><strong>Question:</strong> {question}</p>
                    </div>

                    {stage === 'done' && (
                      <div className="flex flex-col items-center py-4 relative">
                        <StampBadge score={trustScore} />
                        <p className="mt-4 text-xs text-center text-slate-600 dark:text-slate-400 max-w-sm">
                          {claims.filter((c) => c.supported).length} of {claims.length || 0} claims confirmed against your source{consistency ? (consistency.consistent ? ' · self-consistent across re-runs' : ' · flagged as inconsistent across re-runs') : ''}.
                        </p>


                      </div>
                    )}

                    {subquestions.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {subquestions.map((sq, i) => (
                          <span key={i} className="font-mono px-2.5 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] shadow-sm">{sq}</span>
                        ))}
                      </div>
                    )}

                    <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md">
                      <div className="font-mono uppercase mb-3 flex justify-between items-center text-[11px] tracking-wider text-slate-500 dark:text-slate-400">
                        <span>The Answer</span>
                        {stage === 'synthesizing' && <span className="animate-pulse flex items-center gap-1 text-blue-600 dark:text-blue-400"><Loader2 size={10} className="animate-spin" /> Synthesizing...</span>}
                      </div>
                      <div className="text-sm leading-relaxed text-slate-900 dark:text-slate-100 prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-strong:text-slate-900 dark:prose-strong:text-white">
                        <ReactMarkdown>{answer}</ReactMarkdown>
                      </div>
                    </div>

                    {stage === 'done' && (
                      <div className="flex flex-wrap justify-end items-center gap-2 print:hidden w-full">
                        <button onClick={handleShare} disabled={isSharing} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm">
                          {isSharing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />} {isSharing ? 'Sharing...' : 'Share Link'}
                        </button>
                        <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                          <Download size={14} /> Export CSV
                        </button>
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm">
                          <Printer size={14} /> Print Report
                        </button>
                      </div>
                    )}

                    {claims.length > 0 && (
                      <div>
                        <div className="font-mono uppercase mb-3 text-[11px] tracking-wider text-slate-500 dark:text-slate-400">
                          Claim Docket — {claims.filter((c) => c.supported).length}/{claims.length} confirmed
                        </div>
                        <motion.div className="space-y-3" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
                          {claims.map((c, i) => (
                            <ClaimEntry key={i} claim={c} expanded={expandedClaim === i} onToggle={() => setExpandedClaim(expandedClaim === i ? null : i)} onHighlight={(evidence) => { setActiveEvidence(evidence); setIsSourceVisible(true); }} />
                          ))}
                        </motion.div>
                      </div>
                    )}

                    {consistency && (
                      <div className={`p-4 rounded-lg text-sm border ${consistency.consistent ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/10 dark:border-emerald-800/50 dark:text-emerald-400' : 'bg-red-50/50 border-red-200 text-red-800 dark:bg-red-900/10 dark:border-red-800/50 dark:text-red-400'}`}>
                        <strong className="font-mono uppercase text-[11px] tracking-wider">{consistency.consistent ? 'Consistent' : 'Inconsistent'} across re-runs — </strong>
                        <span className="opacity-90">{consistency.notes}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 border-t border-slate-200 dark:border-slate-800 print:hidden">
                      {subAnswers.length > 0 && (
                        <button onClick={() => setShowNotes((s) => !s)} className="font-mono flex items-center gap-1 cursor-pointer text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                          {showNotes ? <ChevronDown size={12} /> : <ChevronRight size={12} />} research notes ({subAnswers.length})
                        </button>
                      )}
                      {retrievedChunks.length > 0 && (
                        <button onClick={() => setShowChunks((s) => !s)} className="font-mono flex items-center gap-1 cursor-pointer text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                          {showChunks ? <ChevronDown size={12} /> : <ChevronRight size={12} />} {retrievedChunks.length} excerpts retrieved
                        </button>
                      )}
                    </div>

                    <AnimatePresence>
                      {showNotes && (
                        <motion.div key="notes" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden print:hidden">
                          {subAnswers.map((sa, i) => (
                            <div key={i} className="p-4 rounded-lg bg-slate-200/50 dark:bg-slate-800/50 text-xs shadow-inner">
                              <div className="font-mono mb-2 text-blue-700 dark:text-blue-400 font-medium">{sa.q}</div>
                              <div className="text-slate-600 dark:text-slate-300 leading-relaxed">{sa.a || <span className="animate-pulse">Researching...</span>}</div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                      {showChunks && (
                        <motion.div key="chunks" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden print:hidden">
                          {retrievedChunks.map((c, i) => (
                            <div key={i} className="p-3 rounded-lg font-mono text-[11px] bg-slate-200/50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 shadow-inner leading-relaxed">{c}</div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {(stage === 'done' || error) && (
                      <div className="pt-6 print:hidden flex items-center justify-center gap-3">
                        <button onClick={handleReset} className="font-mono flex items-center justify-center gap-1.5 cursor-pointer text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors bg-slate-200 dark:bg-slate-800 px-4 py-2 rounded-lg">
                          <RotateCcw size={12} /> Start New Query
                        </button>
                        <button
                          onClick={() => {
                            setExpandedClaim(null); setShowChunks(false); setShowNotes(false); setActiveEvidence('');
                            runPipeline(documents, snippetText, question);
                          }}
                          disabled={isRunning}
                          className="font-mono flex items-center justify-center gap-1.5 cursor-pointer text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors bg-blue-100 dark:bg-blue-900/50 px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                          <RotateCcw size={12} /> Rerun Query
                        </button>
                      </div>
                    )}
                  </section>
                )}

                {/* Mobile History View */}
                <AnimatePresence>
                  {isHistoryOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="lg:hidden mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 print:hidden"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <History size={16} />
                          <span className="font-mono uppercase text-[12px] tracking-wider">Verification History</span>
                        </div>
                        <button onClick={clearHistory} className="flex items-center gap-1 font-mono cursor-pointer text-[11px] hover:text-red-500 transition-colors">
                          <Trash2 size={11} /> clear
                        </button>
                      </div>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                        {history.length === 0 && <p className="text-sm text-slate-500">No history yet.</p>}
                        {history.map((h) => (
                          <div key={h.id} onClick={() => { setQuestion(h.question); setSourceText(h.sourceText || ''); loadState(h); setIsHistoryOpen(false); }} className="flex items-center justify-between text-xs py-3 px-4 rounded-lg gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-colors cursor-pointer">
                            <span className="truncate flex-1 font-medium">{h.question}</span>
                            <span className={`font-mono flex-shrink-0 font-bold ${scoreTier(h.score).text}`}>{h.score}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

            </div>
          </div>
        </div>

        {/* Desktop Sidebar History View (Docked) */}
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 350, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="hidden lg:block border-l border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 flex-shrink-0 h-screen sticky top-0 overflow-hidden print:hidden"
            >
              <div className="w-[350px] p-6 h-full flex flex-col">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <History size={16} />
                    <span className="font-mono uppercase text-[12px] font-bold tracking-wider">History</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={clearHistory} className="flex items-center gap-1 font-mono cursor-pointer text-[11px] hover:text-red-500 transition-colors text-slate-500">
                      <Trash2 size={11} /> clear
                    </button>
                    <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 flex-1 overflow-y-auto pr-1">
                  {history.length === 0 && <p className="text-sm text-slate-500">No past verifications.</p>}
                  {history.map((h) => (
                    <div key={h.id} onClick={() => { setQuestion(h.question); setSnippetText(h.sourceText || ''); setDocuments([]); loadState(h); setIsHistoryOpen(false); }} className="flex items-center justify-between text-xs py-3 px-4 rounded-lg gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500 transition-colors cursor-pointer group">
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-slate-800 dark:text-slate-200">{h.question}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{h.supported}/{h.total} claims verified</p>
                      </div>
                      <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-full border-2 flex-shrink-0 ${scoreTier(h.score).border} ${scoreTier(h.score).bg} ${scoreTier(h.score).text}`}>
                        <span className="font-mono font-bold text-xs">{h.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
