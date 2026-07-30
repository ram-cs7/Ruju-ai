'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CreditCard, Activity, CheckCircle2, Mail, MapPin } from 'lucide-react';
import { useAuth, UserProfile } from '@clerk/nextjs';

export default function SettingsPage() {
  const { isLoaded, isSignedIn } = useAuth();

  return (
    <div className="h-screen overflow-hidden bg-[#FAF9F6] dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8 font-sans transition-colors duration-300">
      <div className="max-w-5xl mx-auto h-full flex flex-col">

        {/* Header */}
        <header className="flex items-center justify-between mb-8 pb-4 border-b border-slate-300/60 dark:border-slate-800">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors">
            <ArrowLeft size={14} /> Back to Workspace
          </Link>
          <div className="flex items-center gap-2 opacity-90">
            <img src="/logo.png" alt="Ruju Logo" className="w-6 h-6 object-contain mix-blend-multiply dark:mix-blend-normal" />
            <span className="font-display font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-blue-700 dark:from-white dark:to-blue-400">Settings</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-0">
          {isLoaded && isSignedIn ? (
            <UserProfile
              routing="hash"
              appearance={{
                elements: {
                  rootBox: "shadow-xl rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-full w-full",
                  card: "w-full h-full rounded-none shadow-none bg-white/95 dark:bg-slate-900/95 backdrop-blur-md",
                  navbar: "border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50",
                  headerTitle: "font-display text-xl",
                  navbarButton: "font-sans",
                  pageScrollBox: "p-8",
                  avatarBox: "!rounded-md",
                  avatarImage: "!rounded-md object-cover",
                },
                variables: {
                  colorPrimary: '#0f172a',
                }
              }}
            >
              <UserProfile.Page label="Usage Details" labelIcon={<Activity size={14} />} url="usage">
                <UsageDetails />
              </UserProfile.Page>
              <UserProfile.Page label="Subscription" labelIcon={<CreditCard size={14} />} url="subscription">
                <SubscriptionDetails />
              </UserProfile.Page>
              <UserProfile.Page label="Contact Support" labelIcon={<Mail size={14} />} url="contact">
                <ContactDetails />
              </UserProfile.Page>
            </UserProfile>
          ) : (
            <div className="p-8 text-center text-slate-500 font-display italic">
              Please log in to manage your account details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UsageDetails() {
  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="font-display text-2xl font-semibold mb-1">Current Usage</h2>
        <p className="text-slate-500 text-sm mb-6">Track your verification limits and system storage.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 w-full">
        <div className="p-5 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Verifications</div>
          <div className="text-3xl font-display font-semibold">14 <span className="text-sm text-slate-400 font-sans">/ 50</span></div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-500 w-[28%] h-full rounded-full"></div>
          </div>
        </div>
        <div className="p-5 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-mono text-slate-500 mb-1 uppercase tracking-wider">Storage Used</div>
          <div className="text-3xl font-display font-semibold">12 <span className="text-sm text-slate-400 font-sans">MB</span></div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 w-[15%] h-full rounded-full"></div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
        <h3 className="font-display font-semibold mb-2">Developer Access</h3>
        <p className="text-sm text-slate-500 mb-4">Connect Ruju.ai directly to your application or custom agent using your personal API keys.</p>
        <Link href="/settings/api-keys" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-md font-medium text-sm hover:opacity-90 transition-opacity">
          Manage API Keys &rarr;
        </Link>
      </div>
    </div>
  );
}

function SubscriptionDetails() {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Failed to initiate checkout', error);
      setIsUpgrading(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="font-display text-2xl font-semibold mb-1">Subscription Plan</h2>
        <p className="text-slate-500 text-sm mb-6">Manage your Ruju.ai billing and features.</p>
      </div>

      <div className="flex flex-col gap-4 w-full">
        {/* Free Tier */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-display text-xl font-bold">Free</h3>
              <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-widest border border-slate-300 dark:border-slate-700">Active</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Basic verification for casual use. Includes up to 50 deep-verifications per month.
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold">$0</span>
              <span className="text-slate-500 text-xs font-mono uppercase tracking-widest">/mo</span>
            </div>
            <button className="w-full sm:w-auto px-6 py-2 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-default font-display small-caps font-bold tracking-widest text-[11px]">
              Current Plan
            </button>
          </div>
        </div>

        {/* Pro Tier */}
        <div className="bg-gradient-to-r from-white to-amber-50/50 dark:from-slate-900 dark:to-slate-950 border-2 border-amber-300 dark:border-amber-700/50 rounded-lg p-5 shadow-sm relative overflow-hidden group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-amber-400 to-amber-600"></div>
          <div className="flex-1 pl-2">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-xl font-bold text-amber-900 dark:text-amber-500">Pro Dossier</h3>
              <Sparkles size={16} className="text-amber-600 dark:text-amber-500" />
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Unlimited deep-verifications, priority agent processing, and advanced export capabilities.
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto pl-2 sm:pl-0">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-display font-bold">$7</span>
              <span className="text-slate-500 text-xs font-mono uppercase tracking-widest">/mo</span>
            </div>
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="w-full sm:w-auto px-6 py-2 rounded-full border border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-500 transition-all shadow-sm font-display small-caps font-bold tracking-widest text-[11px] flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isUpgrading ? 'Processing...' : 'Upgrade to Pro'}
            </button>
          </div>
        </div>

        {/* Enterprise Tier */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-display text-xl font-bold">Enterprise</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Dedicated support, API access, and custom SLA for organizations with high volume needs.
            </p>
          </div>
          <div className="flex items-center gap-6 shrink-0 w-full sm:w-auto">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-display font-bold text-slate-700 dark:text-slate-300">Custom</span>
            </div>
            <Link href="/contact" className="w-full sm:w-auto px-6 py-2 rounded-full border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 transition-colors shadow-sm font-display small-caps font-bold tracking-widest text-[11px] flex items-center justify-center">
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactDetails() {
  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="font-display text-2xl font-semibold mb-1">Contact Support</h2>
        <p className="text-slate-500 text-sm mb-6">Need help with a verification? We're here for you.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 w-full">
        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm bg-slate-50 dark:bg-slate-800/50">
          <Mail className="text-blue-500 mb-3" size={20} />
          <h3 className="font-semibold mb-1">Email Support</h3>
          <p className="text-sm text-slate-500 mb-3">We aim to respond within 24 hours.</p>
          <a href="mailto:support@ruju.ai" className="text-blue-600 dark:text-blue-400 font-medium hover:underline text-sm font-mono">support@ruju.ai</a>
        </div>

        <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-md shadow-sm bg-slate-50 dark:bg-slate-800/50">
          <MapPin className="text-slate-500 mb-3" size={20} />
          <h3 className="font-semibold mb-1">Headquarters</h3>
          <p className="text-sm text-slate-500">123 Verification Way<br />San Francisco, CA 94105</p>
        </div>
      </div>
    </div>
  );
}
