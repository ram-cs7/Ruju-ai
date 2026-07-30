import { prisma } from '../../../../utils/db';
import { generateEmbedding } from '../../../../utils/embed';
import { generateObject, generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { z } from 'zod';
import crypto from 'crypto';

const MODEL = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

// Helper to verify Bearer token
async function authenticateKey(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const rawKey = authHeader.split(' ')[1];
  const hashedKey = crypto.createHash('sha256').update(rawKey).digest('hex');
  
  const keyRecord = await prisma.apiKey.findUnique({
    where: { key: hashedKey }
  });

  if (keyRecord) {
    // Update last used async
    prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() }
    }).catch(console.error);
    return keyRecord;
  }
  return null;
}

export async function POST(req) {
  const keyRecord = await authenticateKey(req);
  if (!keyRecord) {
    return Response.json({ error: 'Unauthorized. Invalid API Key.' }, { status: 401 });
  }

  try {
    const { question, documentIds } = await req.json();
    if (!question || !documentIds || !Array.isArray(documentIds)) {
      return Response.json({ error: 'Missing question or documentIds array.' }, { status: 400 });
    }

    // 1. Authorize access to documents
    const validDocs = await prisma.document.findMany({
      where: {
        id: { in: documentIds },
        ...(keyRecord.organizationId 
            ? { organizationId: keyRecord.organizationId } 
            : { userId: keyRecord.userId, organizationId: null })
      },
      select: { id: true }
    });
    
    const validDocIds = validDocs.map(d => d.id);
    if (validDocIds.length === 0) {
      return Response.json({ error: 'No accessible documents found.' }, { status: 404 });
    }

    const model = groq(MODEL);

    // 2. Plan (Decompose Question)
    const { object: plan } = await generateObject({
      model,
      system: 'You are the Planner agent in a verification pipeline. Break the question into 1-3 focused sub-questions.',
      prompt: question,
      schema: z.object({
        claims: z.array(z.string().describe('A specific factual claim or sub-question to verify.')),
      }),
    });

    const report = { question, claims: [] };

    // 3. Process each claim sequentially
    for (const claim of plan.claims) {
      // 3a. Search RAG
      const queryEmbedding = await generateEmbedding(claim);
      const idList = validDocIds.map(id => `'${id}'`).join(',');
      
      const searchResults = await prisma.$queryRawUnsafe(`
        SELECT content, 1 - (embedding <=> $1::vector) as similarity
        FROM "DocumentChunk"
        WHERE "documentId" IN (${idList})
        ORDER BY embedding <=> $1::vector
        LIMIT 3
      `, `[${queryEmbedding.join(',')}]`);

      const evidence = searchResults.map(r => r.content).join('\n\n');

      // 3b. Verify Claim
      const { object: verification } = await generateObject({
        model,
        system: `You are the Verifier agent. Determine if the claim is supported ONLY by the provided evidence. 
                 Return status VERIFIED, REFUTED, or UNVERIFIABLE.`,
        prompt: `Claim/Question: ${claim}\n\nEvidence:\n${evidence}`,
        schema: z.object({
          status: z.enum(['VERIFIED', 'REFUTED', 'UNVERIFIABLE']),
          reasoning: z.string(),
          quote: z.string().nullable().describe('Exact quote from evidence that supports this.'),
        }),
      });

      report.claims.push({
        claim,
        status: verification.status,
        reasoning: verification.reasoning,
        evidence_quote: verification.quote
      });
    }

    return Response.json(report);

  } catch (err) {
    console.error('API Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
