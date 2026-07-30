'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Key, Plus, Trash2, Copy, CheckCircle2, AlertTriangle, KeyRound } from 'lucide-react';

export default function ApiKeysPage() {
  const { isLoaded, userId } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState(null); // The raw key is only shown once
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isLoaded && userId) {
      fetchKeys();
    }
  }, [isLoaded, userId]);

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/api-keys');
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    
    setCreating(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setKeys([data.apiKeyRecord, ...keys]);
        setRevealedKey(data.rawKey);
        setNewKeyName('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!confirm('Are you sure you want to revoke this API key? Any apps using it will immediately stop working.')) return;
    
    try {
      const res = await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setKeys(keys.filter(k => k.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(revealedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isLoaded || loading) return <div className="p-8 flex justify-center"><div className="animate-spin text-blue-600"><KeyRound /></div></div>;

  return (
    <div className="h-screen overflow-hidden bg-[#FAF9F6] dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-8 font-sans transition-colors duration-300">
      <div className="max-w-4xl mx-auto h-full flex flex-col">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-slate-300/60 dark:border-slate-800 gap-4 shrink-0">
          <h1 className="text-2xl font-bold font-display flex items-center gap-2 text-slate-900 dark:text-white">
            <Key className="text-blue-600" /> Developer API Keys
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 pb-8">
          {revealedKey && (
            <div className="mb-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-green-600 dark:text-green-500 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-800 dark:text-green-400 mb-1">New API Key Created!</h3>
                  <p className="text-sm text-green-700 dark:text-green-500 mb-4">
                    Please copy this key and save it somewhere secure. For security reasons, <strong>you will not be able to see it again.</strong>
                  </p>
                  
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-white dark:bg-black/40 border border-green-200 dark:border-green-800 rounded font-mono text-sm break-all text-slate-900 dark:text-slate-200">
                      {revealedKey}
                    </code>
                    <button 
                      onClick={copyToClipboard}
                      className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-medium"
                    >
                      {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm mb-8 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
              <h2 className="font-semibold mb-1 text-slate-900 dark:text-white">Create New Secret Key</h2>
              <form onSubmit={handleCreate} className="flex gap-3 mt-4">
                <input
                  type="text"
                  placeholder="Key Name (e.g., Chrome Extension)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
                  maxLength={40}
                  required
                />
                <button 
                  type="submit" 
                  disabled={creating || !newKeyName.trim()}
                  className="px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {creating ? <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Plus size={18} />}
                  Create Key
                </button>
              </form>
            </div>

            <div className="p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 font-medium">
                    <th className="px-6 py-4">Name</th>
                    <th className="px-6 py-4">Secret Key</th>
                    <th className="px-6 py-4">Created</th>
                    <th className="px-6 py-4">Last Used</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-100 dark:divide-slate-800">
                  {keys.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No API keys generated yet.</td></tr>
                  ) : keys.map(k => (
                    <tr key={k.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">{k.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-500">rj_......................{k.id.slice(-4)}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(k.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-slate-500">{k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleRevoke(k.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                          title="Revoke Key"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
