'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
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

        <div className="prose prose-slate dark:prose-invert prose-blue max-w-none prose-headings:font-display">
          <h1>Privacy Policy</h1>
          <p className="lead">Last updated: July 2026</p>

          <p>
            At Ruju.ai, we understand that verification involves sensitive and proprietary data. We built our entire architecture around security and privacy to ensure your source documents remain strictly yours.
          </p>

          <h2>1. Data We Collect</h2>
          <p>When you interact with the Ruju.ai verification engine, we collect:</p>
          <ul>
            <li><strong>Account Information:</strong> Name, email address, and authentication data managed securely via Clerk.</li>
            <li><strong>Source Material:</strong> PDF documents you upload and the text content of URLs you scrape via Jina Reader.</li>
            <li><strong>Verification History:</strong> The questions you ask, the synthesized answers, and the factual claims extracted by our agent pipeline.</li>
          </ul>

          <h2>2. No LLM Training Clause</h2>
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 my-6 rounded-r-md">
            <p className="m-0 font-medium text-slate-800 dark:text-slate-200">
              Ruju.ai and its infrastructure partners (including Groq) explicitly do NOT use your uploaded documents, scraped URLs, or verification questions to train, fine-tune, or improve any large language models (LLMs). Your data is ephemeral to the inference process.
            </p>
          </div>

          <h2>3. How We Process Your Data</h2>
          <p>
            Your uploaded documents are processed into text embeddings and stored in an isolated PostgreSQL (pgvector) database. When you request a verification, relevant chunks of this text are sent securely to the Groq API for inference. Groq processes these chunks strictly to generate your answer and immediately discards them.
          </p>
          
          <h2>4. Third-Party Service Providers</h2>
          <p>We rely on SOC2-compliant enterprise partners to operate our service securely:</p>
          <ul>
            <li><strong>Clerk:</strong> Manages authentication, multi-tenant organizations (Team Workspaces), and secure user sessions.</li>
            <li><strong>Groq:</strong> Provides the high-speed LPU inference engine required to run our agent pipeline.</li>
            <li><strong>Upstash:</strong> Manages our Redis rate-limiting infrastructure.</li>
            <li><strong>Stripe:</strong> Processes secure payments and subscriptions. Ruju.ai never stores your credit card details.</li>
          </ul>

          <h2>5. Team Workspaces</h2>
          <p>
            If you create or join a Clerk Organization within Ruju.ai, be aware that workspace administrators can view the verification history, uploaded documents, and credit usage associated with that specific organization.
          </p>

          <h2>6. Contact Us</h2>
          <p>
            If you have specific compliance requirements or questions regarding data retention, please contact our privacy team at <a href="mailto:privacy@ruju.ai">privacy@ruju.ai</a>.
          </p>
        </div>
      </div>
    </div>
  );
}
