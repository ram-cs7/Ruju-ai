import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../utils/db';
import { generateEmbedding } from '../../../utils/embed';

export async function POST(req) {
  const { userId, orgId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { documentIds, query, limit = 7 } = await req.json();
    
    if (!documentIds || documentIds.length === 0) {
      return Response.json({ chunks: [] });
    }

    // Authorization: Verify user/org has access to these documents
    const validDocs = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        ...(orgId ? { organizationId: orgId } : { userId, organizationId: null })
      },
      select: { id: true }
    });
    
    const validDocIds = validDocs.map(d => d.id);
    if (validDocIds.length === 0) {
      return Response.json({ chunks: [] });
    }

    const queryEmbedding = await generateEmbedding(query);

    // Convert array of string IDs to a format safe for raw SQL in Prisma
    const idList = validDocIds.map(id => `'${id}'`).join(',');
    
    // We use raw SQL to query pgvector
    const results = await prisma.$queryRawUnsafe(`
      SELECT content, 1 - (embedding <=> $1::vector) as similarity
      FROM "DocumentChunk"
      WHERE "documentId" IN (${idList})
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `, `[${queryEmbedding.join(',')}]`, limit);

    return Response.json({ chunks: results.map(r => r.content) });
  } catch (err) {
    console.error('Vector search error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
