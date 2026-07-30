import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { prisma } from '../../utils/db';
import { Users, FileText, Activity } from 'lucide-react';
import Link from 'next/link';
import { OrganizationSwitcher, UserButton } from '@clerk/nextjs';

export const metadata = { title: "Admin Dashboard | Ruju.ai" };

export default async function Dashboard() {
  const { userId, orgId, orgRole } = await auth();

  if (!userId) redirect('/');
  if (!orgId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md border border-slate-200">
          <h1 className="text-2xl font-bold mb-4">Team Workspaces Only</h1>
          <p className="text-slate-600 mb-6">The Admin Dashboard is only available for Company Organizations.</p>
          <div className="flex justify-center mb-6">
            <OrganizationSwitcher hidePersonal={true} />
          </div>
          <Link href="/" className="text-blue-600 hover:underline">Return to App</Link>
        </div>
      </div>
    );
  }

  // Fetch all chats for this organization
  const chats = await prisma.chat.findMany({
    where: { organizationId: orgId },
    include: { user: true, _count: { select: { messages: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  const documents = await prisma.document.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-8">
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display tracking-tight">Workspace Admin</h1>
          <p className="text-slate-500">Manage your team's verifications and documents</p>
        </div>
        <div className="flex gap-4 items-center">
          <OrganizationSwitcher hidePersonal={false} />
          <UserButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><FileText size={18} /> Team Documents</h2>
            <div className="space-y-3">
              {documents.length === 0 ? <p className="text-slate-500 text-sm">No documents uploaded.</p> : documents.map(doc => (
                <div key={doc.id} className="text-sm border-b border-slate-100 dark:border-slate-800 pb-2">
                  <p className="font-medium truncate">{doc.name}</p>
                  <p className="text-xs text-slate-500">{new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4"><Activity size={18} /> Recent Verifications</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-sm text-slate-500">
                    <th className="pb-3 pr-4">Team Member</th>
                    <th className="pb-3 pr-4">Query</th>
                    <th className="pb-3 pr-4">Messages</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {chats.length === 0 ? (
                    <tr><td colSpan="4" className="py-4 text-slate-500">No verifications yet.</td></tr>
                  ) : chats.map(chat => (
                    <tr key={chat.id} className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="py-3 pr-4 font-medium">{chat.user?.email || chat.userId}</td>
                      <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{chat.title || 'Unknown'}</td>
                      <td className="py-3 pr-4 text-slate-500">{chat._count.messages}</td>
                      <td className="py-3 text-slate-500">{new Date(chat.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
