import { prisma } from '../../../utils/db';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const chats = await prisma.chat.findMany({
      where: orgId ? { organizationId: orgId } : { userId, organizationId: null },
      include: { messages: true },
      orderBy: { createdAt: 'desc' },
      take: 15,
    });
    return Response.json(chats);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { userId, orgId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { title, messages } = body;

  try {
    // Ensure user exists (in case webhook failed or local dev)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      const clerkUser = await currentUser();
      if (clerkUser) {
        await prisma.user.create({
          data: {
            id: userId,
            email: clerkUser.emailAddresses[0]?.emailAddress || 'unknown@example.com',
          }
        });
      }
    }
    const chat = await prisma.chat.create({
      data: {
        userId,
        organizationId: orgId || null,
        title: title || 'New Verification',
        messages: {
          create: messages.map(m => ({
            role: m.role,
            content: JSON.stringify(m.content), // Storing whatever payload they have as string
          })),
        },
      },
    });
    return Response.json(chat);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
