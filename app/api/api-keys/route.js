import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../utils/db';
import crypto from 'crypto';

export async function GET() {
  const { userId, orgId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const keys = await prisma.apiKey.findMany({
      where: orgId ? { organizationId: orgId } : { userId, organizationId: null },
      orderBy: { createdAt: 'desc' }
    });
    return Response.json({ keys });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { userId, orgId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name } = await req.json();
    if (!name) return Response.json({ error: 'Name is required' }, { status: 400 });

    // Generate a secure random string
    const rawKey = 'rj_' + crypto.randomBytes(32).toString('base64url');
    
    // Hash it for storage
    const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');

    const apiKeyRecord = await prisma.apiKey.create({
      data: {
        key: hashedKey,
        name,
        userId: orgId ? null : userId,
        organizationId: orgId || null,
      }
    });

    return Response.json({ 
      success: true, 
      rawKey, // Send once, never stored
      apiKeyRecord: {
        id: apiKeyRecord.id,
        name: apiKeyRecord.name,
        createdAt: apiKeyRecord.createdAt,
        lastUsedAt: apiKeyRecord.lastUsedAt,
      } 
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const { userId, orgId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  try {
    // Ensure they own it
    const key = await prisma.apiKey.findUnique({ where: { id } });
    if (!key) return Response.json({ error: 'Not found' }, { status: 404 });
    
    if (orgId && key.organizationId !== orgId) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!orgId && key.userId !== userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.apiKey.delete({ where: { id } });
    
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
