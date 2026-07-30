'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Search, ShieldCheck, Brain, FileText, Globe, Download, Sparkles, CreditCard, Share2 } from 'lucide-react';

export default function DocumentationPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8 font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
            <ArrowLeft size={16} /> Back to App
          </Link>
          <div className="flex items-center gap-1.5 opacity-80">
            <img src="/logo.png" alt="Ruju Logo" className="w-8 h-8 object-contain mix-blend-multiply dark:mix-blend-normal" />
            <span className="font-display font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-blue-700 dark:from-white dark:to-blue-400">Ruju.ai</span>
          </div>
        </header>

        <h1 className="text-4xl font-bold tracking-tight mb-2 font-display">Documentation</h1>
        <p className="text-slate-500 mb-10 text-lg">Comprehensive guide to the Ruju.ai verification engine.</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar Navigation */}
          <div className="md:col-span-1 hidden md:block">
            <nav className="sticky top-8 space-y-1">
              <a href="#how-it-works" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300">How it Works</a>
              <a href="#pipeline" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300">Agent Pipeline</a>
              <a href="#scraping" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300">Web Scraping</a>
              <a href="#workspaces" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300">Team Workspaces</a>
              <a href="#api" className="block px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300">Developer API</a>
            </nav>
          </div>

          {/* Main Content */}
          <div className="md:col-span-3 space-y-16">
            
            {/* How it works */}
            <section id="how-it-works" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Brain size={20} />
                </div>
                <h2 className="text-2xl font-semibold font-display tracking-tight">How does Ruju.ai work?</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Standard Large Language Models (LLMs) are prone to hallucination. When you ask them a question, they generate text based on statistical probabilities of words, not verified facts. 
                <strong className="text-slate-900 dark:text-white font-medium"> Ruju.ai solves this by restricting the AI's knowledge purely to the documents and web links you provide.</strong>
              </p>
              
              <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><BookOpen size={18} className="text-slate-400" /> The Split-Pane Verification Viewer</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                  When the AI provides an answer, how do you know you can trust it? Our proprietary split-pane viewer completely demystifies the AI's output.
                </p>
                <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-400 list-disc pl-5">
                  <li><strong>The Left Pane</strong> contains the AI's fully verified answer, broken down into distinct factual claims.</li>
                  <li><strong>The Right Pane</strong> contains your raw source document (PDF) or scraped web text.</li>
                  <li>Clicking on any highlighted claim in the left pane instantly scrolls and highlights the <strong>exact verbatim sentence</strong> in the original document that proves the claim is true.</li>
                </ul>
              </div>
            </section>

            {/* Pipeline */}
            <section id="pipeline" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Sparkles size={20} />
                </div>
                <h2 className="text-2xl font-semibold font-display tracking-tight">The 4-Stage Agent Pipeline</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Instead of sending your document to a single AI, Ruju.ai orchestrates a team of specialized AI agents working in sequence to guarantee accuracy.
              </p>
              
              <div className="grid gap-4">
                <div className="flex gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-mono text-xs font-bold bg-slate-200 dark:bg-slate-800 w-6 h-6 rounded flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">1</div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">The Planner</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Takes your complex question and breaks it down into 2 to 4 distinct, highly focused sub-questions that need to be answered to fully resolve your query.</p>
                  </div>
                </div>
                
                <div className="flex gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-mono text-xs font-bold bg-slate-200 dark:bg-slate-800 w-6 h-6 rounded flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">2</div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">The Researchers</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">A fleet of independent agents take each sub-question and aggressively scan the vector-embedded chunks of your document, extracting purely factual answers.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
                  <div className="font-mono text-xs font-bold bg-slate-200 dark:bg-slate-800 w-6 h-6 rounded flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">3</div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-1">The Synthesizer</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">Merges all the raw research back into a single, cohesive, easy-to-read answer, removing redundancies while preserving every factual point.</p>
                  </div>
                </div>

                <div className="flex gap-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30">
                  <div className="font-mono text-xs font-bold bg-red-200 dark:bg-red-900/50 w-6 h-6 rounded flex items-center justify-center text-red-700 dark:text-red-400 shrink-0">4</div>
                  <div>
                    <h4 className="font-semibold text-red-900 dark:text-red-400 mb-1">The Verifier</h4>
                    <p className="text-sm text-red-800/80 dark:text-red-300/80">The most ruthless agent. It rips the synthesized answer apart into distinct claims. It checks every single claim against the source document. If a claim cannot be proven with a verbatim quote, it is marked as unsupported and your Trust Score drops.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Web Scraping */}
            <section id="scraping" className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Globe size={20} />
                </div>
                <h2 className="text-2xl font-semibold font-display tracking-tight">Universal Web Scraping</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
                You aren't limited to static files. Paste any public URL into the verification engine, and Ruju.ai utilizes the advanced <strong>Jina Reader API</strong> to bypass popups, cookie banners, and dynamic rendering to extract the pure text content of the page.
              </p>
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-lg">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  <strong>How to use:</strong> Simply toggle from "Upload File" to "Scrape" on the main dashboard, paste your target URL, and Ruju will ingest the entire webpage into its vector database in seconds, ready for cross-examination.
                </p>
              </div>
            </section>
            
            {/* Developer API */}
            <section id="api" className="scroll-mt-8 border-t border-slate-200 dark:border-slate-800 pt-12 mt-12">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <ShieldCheck size={20} />
                </div>
                <h2 className="text-2xl font-semibold font-display tracking-tight">Developer API</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Enterprise users can integrate the Ruju.ai verification engine directly into their own applications. Go to your <Link href="/settings" className="text-blue-600 dark:text-blue-400 underline">Settings</Link> to generate an API key.
              </p>
            </section>
          </div>
        </div>

      </div>
    </div>
  );
}
