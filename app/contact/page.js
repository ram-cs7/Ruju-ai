'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, MapPin, Send, Settings } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#FAF9F6] dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8 sm:p-12 font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-12 border-b-2 border-slate-900 dark:border-slate-700 pb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 font-medium transition-colors">
            <ArrowLeft size={16} />
            Back to Ruju.ai
          </Link>
          <div className="flex items-center gap-2 opacity-90">
            <img src="/logo.png" alt="Ruju Logo" className="w-8 h-8 object-contain mix-blend-multiply dark:mix-blend-normal" />
            <span className="font-display font-semibold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-blue-700 dark:from-white dark:to-blue-400">Settings</span>
          </div>
        </header>

        {/* Content */}
        <div className="grid md:grid-cols-[250px_1fr] gap-12">
          
          {/* Sidebar */}
          <nav className="flex flex-col gap-2 font-display small-caps tracking-wider text-sm font-semibold">
            <Link href="/settings" className="px-4 py-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-400 transition flex items-center gap-2">
              <Settings size={14} /> General Settings
            </Link>
            <div className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded text-slate-900 dark:text-slate-100 flex items-center gap-2 border border-slate-300 dark:border-slate-700 shadow-sm">
              <Mail size={14} /> Contact Support
            </div>
          </nav>

          {/* Main Panel */}
          <div className="space-y-12">
            
            {/* Contact Info */}
            <section>
              <div className="flex items-center gap-2 mb-6">
                <Mail size={18} className="text-slate-500" />
                <h2 className="font-display text-2xl font-semibold">Get in Touch</h2>
              </div>
              
              <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-sm p-8 shadow-sm">
                <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-lg">
                  Have a question about your account, billing, or need help with a complex verification? Our support team is here to assist you.
                </p>
                
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded">
                      <Mail size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email Support</h3>
                      <p className="text-sm text-slate-500 mb-1">We aim to respond within 24 hours.</p>
                      <a href="mailto:support@ruju.ai" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">support@ruju.ai</a>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Headquarters</h3>
                      <p className="text-sm text-slate-500">123 Verification Way<br/>San Francisco, CA 94105</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
