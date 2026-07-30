import { auth } from '@clerk/nextjs/server';
import { prisma } from '../../../utils/db';
import { chunkText, generateEmbedding } from '../../../utils/embed';

export async function POST(req) {
  const { userId, orgId } = await auth();
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { name, content } = await req.json();
    if (!name || !content) return Response.json({ error: 'Missing name or content' }, { status: 400 });

    // Ensure user exists in Prisma DB
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return Response.json({ error: 'User not found in DB. Run a verification first to sync account.' }, { status: 400 });
    }

    // 1. Create Document record
    const document = await prisma.document.create({
      data: { userId, organizationId: orgId || null, name }
    });

    // 2. Chunk text
    const chunks = chunkText(content);
    
    // 3. Process chunks (generate embeddings and save)
    // We do this sequentially to not overload the embedding model
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk);
      
      // pgvector requires the format '[1,2,3]' rather than Postgres array format '{1,2,3}'
      const vectorString = `[${embedding.join(',')}]`;
      
      // Use raw SQL to insert pgvector
      await prisma.$executeRaw`
        INSERT INTO "DocumentChunk" (id, "documentId", content, embedding, "createdAt")
        VALUES (
          gen_random_uuid()::text,
          ${document.id},
          ${chunk},
          ${vectorString}::vector,
          NOW()
        )
      `;
    }

    return Response.json({ success: true, documentId: document.id, chunksProcessed: chunks.length });
  } catch (err) {
    console.error('Error processing document:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
