import { prisma } from '../../../utils/db';
import { Shield, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { notFound } from 'next/navigation';
import ShareActions from '../../../components/ShareActions';

function scoreTier(score) {
  if (score >= 80) return { label: 'VERIFIED', text: 'text-green-800 dark:text-green-400', border: 'border-green-800 dark:border-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
  if (score >= 50) return { label: 'PARTIAL', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-700 dark:border-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
  return { label: 'FLAGGED', text: 'text-red-700 dark:text-red-400', border: 'border-red-700 dark:border-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
}

export default async function SharedReportPage({ params }) {
  const { shareId } = await params;
  
  const chat = await prisma.chat.findUnique({
    where: { shareId },
    include: { messages: true }
  });

  if (!chat || chat.messages.length === 0) {
    notFound();
  }

  const data = typeof chat.messages[0].content === 'string' 
    ? JSON.parse(chat.messages[0].content) 
    : chat.messages[0].content;

  const { question, score, sourceText, answer, claims, consistency } = data;
  const tier = scoreTier(score);

  return (
    <div className="min-h-screen transition-colors duration-300 bg-white dark:bg-slate-950 print:bg-white text-slate-900 dark:text-slate-100">
      
      {/* Print Header */}
      <div className="hidden print:block mb-8 mt-8 text-center border-b-2 border-slate-900 pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src="/logo.png" alt="Ruju.ai Logo" className="w-12 h-12 object-contain mix-blend-multiply dark:mix-blend-normal" />
          <h1 className="font-display text-3xl font-bold text-slate-900">Ruju.ai Verification Report</h1>
        </div>
        <p className="text-base mt-4 text-slate-800 text-center mx-auto max-w-2xl"><strong>Question:</strong> {question}</p>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        
        <header className="mb-10 text-center print:hidden">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <img src="/logo.png" alt="Ruju Logo" className="w-8 h-8 object-contain mix-blend-multiply dark:mix-blend-normal" />
            <h1 className="font-display text-2xl font-bold tracking-tight">Ruju.ai Public Report</h1>
          </div>
          <p className="text-sm text-slate-500">Shared Verification Report</p>
        </header>

        <section className="mb-8 flex flex-col items-center">
          <div className={`flex flex-col items-center justify-center rounded-full flex-shrink-0 border-[3px] ${tier.border} ${tier.bg} ${tier.text} shadow-sm backdrop-blur-sm`} style={{ width: 132, height: 132 }}>
            <span className="font-display font-bold leading-none text-4xl">{score}</span>
            <span className="font-mono tracking-widest mt-1 text-[10px]">{tier.label}</span>
          </div>
          <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 text-center max-w-lg">
            <strong>Question:</strong> {question}
          </p>
          <ShareActions claims={claims} />
        </section>

        <section className="space-y-6">
          <div className="p-5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="font-mono uppercase mb-3 text-[11px] tracking-wider text-slate-500">The Answer</div>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer}</p>
          </div>

          {claims && claims.length > 0 && (
            <div>
              <div className="font-mono uppercase mb-3 text-[11px] tracking-wider text-slate-500">
                Claim Docket — {claims.filter(c => c.supported).length}/{claims.length} confirmed
              </div>
              <div className="space-y-3">
                {claims.map((c, i) => (
                  <div key={i} className={`p-4 rounded-lg border ${c.supported ? 'bg-green-50/50 dark:bg-green-900/10 border-green-600/30' : 'bg-red-50/50 dark:bg-red-900/10 border-red-600/30'}`}>
                    <div className="flex items-start gap-2">
                      {c.supported ? <CheckCircle2 size={16} className="text-green-600 mt-0.5" /> : <XCircle size={16} className="text-red-600 mt-0.5" />}
                      <span className="text-sm flex-1 font-medium">{c.claim}</span>
                    </div>
                    {c.evidence && (
                      <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 italic bg-white/50 dark:bg-black/20 p-2 rounded border border-black/5 dark:border-white/5">
                        "{c.evidence}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 border-t border-slate-200 dark:border-slate-800 pt-6">
            <div className="font-mono uppercase mb-3 text-[11px] tracking-wider text-slate-500 flex items-center gap-1">
              <FileText size={14} /> Source Material
            </div>
            <div className="text-xs leading-relaxed whitespace-pre-wrap text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50 p-4 rounded-lg max-h-96 overflow-y-auto">
              {sourceText}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
