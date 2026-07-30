'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Minus, Search, MessageCircle } from 'lucide-react';

const FAQS = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What types of files can I upload to Ruju.ai?",
        a: "Currently, Ruju.ai natively supports parsing for PDF (.pdf) documents and plain text via the snippet box. Our Jina Reader integration also allows you to paste public URLs to instantly scrape and verify web articles, blogs, and documentation pages."
      },
      {
        q: "How does the Trust Score work?",
        a: "The Trust Score is a boolean metric calculated by the Verifier Agent. It extracts every distinct factual claim from the synthesized answer, and attempts to find a verbatim quote in the source document to back it up. The Trust Score is the percentage of claims that were successfully backed by direct evidence. If a claim cannot be verified, the score drops."
      }
    ]
  },
  {
    category: "Billing & Credits",
    questions: [
      {
        q: "How are credits consumed?",
        a: "One credit is consumed per verification run (which executes the entire 4-stage agent pipeline: Planning, Research, Synthesis, and Verification). Uploading documents and scraping URLs does not cost credits until you click 'Run Verification'."
      },
      {
        q: "Do team members share a credit pool?",
        a: "Yes. If you invite members to your Clerk Organization Workspace, all verifications run by any member will draw from the organization's centralized credit pool."
      }
    ]
  },
  {
    category: "Data & Privacy",
    questions: [
      {
        q: "Are my uploaded documents used to train AI models?",
        a: "Absolutely not. Ruju.ai utilizes enterprise APIs (like Groq) which strictly prohibit the retention or use of customer data for model training. Your documents are ephemeral and only used for the context of your specific verification."
      },
      {
        q: "How secure is my data?",
        a: "All data is encrypted in transit (TLS) and at rest. Vector embeddings are stored securely in our isolated PostgreSQL (pgvector) database, and authentication is handled entirely by Clerk's SOC2-compliant infrastructure."
      }
    ]
  }
];

export default function HelpPage() {
  const [openFaq, setOpenFaq] = useState('');

  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8 font-sans transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
            <ArrowLeft size={16} /> Back to App
          </Link>
          <div className="flex items-center gap-1.5 opacity-80">
            <img src="/logo.png" alt="Ruju Logo" className="w-8 h-8 object-contain mix-blend-multiply dark:mix-blend-normal" />
            <span className="font-display font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-blue-700 dark:from-white dark:to-blue-400">Ruju.ai</span>
          </div>
        </header>

        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4 font-display">How can we help?</h1>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">Find answers to common questions about verification, billing, and team workspaces.</p>
        </div>

        <div className="space-y-12">
          {FAQS.map((section, idx) => (
            <div key={idx}>
              <h2 className="text-xl font-display font-semibold mb-6 pb-2 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">{section.category}</h2>
              <div className="space-y-3">
                {section.questions.map((faq, fidx) => {
                  const id = `${idx}-${fidx}`;
                  const isOpen = openFaq === id;
                  return (
                    <div 
                      key={id} 
                      className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900/50 overflow-hidden transition-all duration-200"
                    >
                      <button 
                        onClick={() => setOpenFaq(isOpen ? '' : id)}
                        className="w-full text-left px-6 py-4 flex items-center justify-between focus:outline-none focus-visible:bg-slate-50 dark:focus-visible:bg-slate-800"
                      >
                        <span className="font-medium text-slate-800 dark:text-slate-200">{faq.q}</span>
                        <div className="text-slate-400 shrink-0 ml-4">
                          {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                        </div>
                      </button>
                      <div className={`px-6 text-slate-600 dark:text-slate-400 leading-relaxed transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 pb-5 opacity-100' : 'max-h-0 opacity-0'}`}>
                        {faq.a}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 p-8 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl text-center">
          <MessageCircle className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
          <h3 className="font-semibold text-lg mb-2 text-slate-900 dark:text-slate-100">Still have questions?</h3>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-6 max-w-md mx-auto">We're here to help. Reach out to our enterprise support team for custom integrations, large-scale processing limits, or general inquiries.</p>
          <a href="mailto:support@ruju.ai" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 transition-colors">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
