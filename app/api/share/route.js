import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../utils/db';

export async function POST(request) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { chatId } = await request.json();
  if (!chatId) return Response.json({ error: 'Missing chatId' }, { status: 400 });

  const chat = await prisma.chat.findUnique({ where: { id: chatId, userId } });
  if (!chat) return Response.json({ error: 'Chat not found' }, { status: 404 });

  if (chat.shareId) {
    return Response.json({ shareId: chat.shareId });
  }

  const newShareId = crypto.randomUUID();
  await prisma.chat.update({
    where: { id: chatId },
    data: { shareId: newShareId }
  });

  return Response.json({ shareId: newShareId });
}

export async function GET(request) {
  const url = new URL(request.url);
  const shareId = url.searchParams.get('shareId');
  if (!shareId) return Response.json({ error: 'Missing shareId' }, { status: 400 });

  const chat = await prisma.chat.findUnique({
    where: { shareId },
    include: { messages: true }
  });

  if (!chat) return Response.json({ error: 'Shared report not found' }, { status: 404 });

  return Response.json(chat);
}
