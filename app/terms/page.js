'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
          <h1>Terms of Service</h1>
          <p className="lead">Last updated: July 2026</p>

          <p>
            Welcome to Ruju.ai. By accessing our platform, Chrome extension, or developer APIs, you agree to be bound by these Terms of Service.
          </p>

          <h2>1. Use of the Verification Service</h2>
          <p>
            Ruju.ai provides an automated verification pipeline. While our agents are designed to strictly ground claims in the provided source documents and eliminate hallucination, you acknowledge that AI systems are probabilistic. Ruju.ai is intended as an assistance tool. You should manually review critical verifications before relying on them for legal, medical, or financial decisions.
          </p>

          <h2>2. Acceptable Use & URL Scraping</h2>
          <p>Our platform includes a URL scraping feature powered by Jina Reader. You agree to use this feature responsibly and in compliance with the law. You shall not:</p>
          <ul>
            <li>Scrape websites that explicitly prohibit automated data extraction in their Terms of Service.</li>
            <li>Extract data from domains containing sensitive, illegal, or non-consensual personal information.</li>
            <li>Use the Ruju.ai scraper for mass denial-of-service or targeted harassment.</li>
          </ul>

          <h2>3. API Keys and Rate Limits</h2>
          <p>
            Enterprise users are granted API keys to integrate our verification engine. You are responsible for keeping these keys secure. Ruju.ai enforces rate limits to ensure stability across our multi-tenant architecture. Attempting to bypass these rate limits through multiple accounts or automated masking is a violation of these terms and will result in immediate account termination.
          </p>

          <h2>4. Credits and Billing</h2>
          <p>
            Verifications consume credits. Credits are non-refundable once consumed. For users on the Free tier, your credits do not rollover. For Pro and Enterprise users, billing is handled securely through Stripe, and you may cancel your subscription at any time.
          </p>
          
          <h2>5. Intellectual Property</h2>
          <p>
            You retain all rights to the source documents you upload. Ruju.ai claims no ownership over your proprietary data. Ruju.ai retains all intellectual property rights to the verification pipeline, the source code, the UI/UX designs, and the overarching agent architecture.
          </p>

          <h2>6. Limitation of Liability</h2>
          <p>
            In no event shall Ruju.ai or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the verification engine, even if Ruju.ai has been notified orally or in writing of the possibility of such damage.
          </p>
        </div>
      </div>
    </div>
  );
}
