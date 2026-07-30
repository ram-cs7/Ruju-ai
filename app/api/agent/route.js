import { groq } from '@ai-sdk/groq';
import { streamText, generateObject } from 'ai';
import { z } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { Redis } from '@upstash/redis';
import { prisma } from '../../../utils/db';

const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const MAX_INPUT_CHARS = 60_000;

// Initialize Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export const maxDuration = 300;

export async function POST(request) {
  // 1. Authenticate the user
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: { message: 'Unauthorized. Please log in.' } }, { status: 401 });
  }

  // 2. Rate Limiting via Upstash Redis
  const rateLimitKey = `rate_limit:${userId}`;
  const currentRequests = await redis.incr(rateLimitKey);
  if (currentRequests === 1) {
    await redis.expire(rateLimitKey, 60); // 1 minute window
  }
  if (currentRequests > 30) {
    return Response.json({ error: { message: 'Rate limit reached. Wait a minute and try again.' } }, { status: 429 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: { message: 'Server is missing GROQ_API_KEY.' } },
      { status: 500 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return Response.json({ error: { message: 'Invalid request body.' } }, { status: 400 });
  }

  const { action, payload } = body || {};
  
  if (JSON.stringify(payload || {}).length > MAX_INPUT_CHARS) {
    return Response.json(
      { error: { message: 'Source document is too large for this deployment. Try a shorter excerpt.' } },
      { status: 413 }
    );
  }

  if (!action || !payload) {
    return Response.json({ error: { message: 'Missing action or payload.' } }, { status: 400 });
  }

  try {
    // 3. Database Credit Check (Only deduct on 'plan', which is the start of the pipeline)
    if (action === 'plan') {
      const user = await prisma.user.upsert({
        where: { id: userId },
        update: {}, // Don't reset credits on every run
        create: {
          id: userId,
          email: 'user@example.com', // In a real app, you'd fetch the email from Clerk via webhook
          credits: 1000,
        },
      });

      if (user.subscriptionStatus === 'free' && user.credits <= 0) {
        return Response.json(
          { error: { message: 'You have run out of credits. Please upgrade to Pro.' } },
          { status: 402 } // Payment Required
        );
      }

      // Deduct a credit
      if (user.subscriptionStatus === 'free') {
        await prisma.user.update({
          where: { id: userId },
          data: { credits: { decrement: 1 } },
        });
      }
    }

    const model = groq(MODEL);
    
    switch (action) {
      case 'plan': {
        const { question } = payload;
        const { object } = await generateObject({
          model,
          system: 'You are the Planner agent in a verification pipeline. Break the question into 2 to 4 focused sub-questions that together would fully answer it. Keep them concise. Output in JSON format.',
          prompt: question,
          schema: z.object({
            subquestions: z.array(z.string()).min(1).max(4).describe('The list of sub-questions'),
          }),
        });
        return Response.json(object);
      }
      
      case 'research': {
        const { system, subQuestion } = payload;
        const result = streamText({
          model,
          system,
          prompt: `Sub-question: ${subQuestion}`,
          maxTokens: 500,
        });
        return new Response(result.textStream);
      }

      case 'synthesize': {
        const { question, subAnswers } = payload;
        const prompt = `Original question: ${question}\n\n${subAnswers.map((sa) => `Sub-question: ${sa.q}\nAnswer: ${sa.a}`).join('\n\n')}`;
        const result = streamText({
          model,
          system: "You are the Synthesizer agent. Combine the sub-answers below into one clear, coherent answer to the original question. Remove redundancy, keep every distinct factual point, and don't add anything not present in the sub-answers.",
          prompt,
          maxTokens: 900,
        });
        return new Response(result.textStream);
      }

      case 'verify': {
        const { system, answer } = payload;
        const { generateObject } = await import('ai');
        const { object } = await generateObject({
          model,
          system: system + `\n\nExtract every distinct factual claim in the draft answer. For each, decide if it is directly and clearly supported by the excerpts. Output in JSON format.`,
          prompt: `Draft answer:\n${answer}`,
          schema: z.object({
            claims: z.array(z.object({
              claim: z.string().describe('The distinct factual claim'),
              supported: z.boolean().describe('Is the claim directly and clearly supported by the excerpts?'),
              evidence: z.string().describe('EXACT verbatim quote from the source text that supports the claim. Do not paraphrase. Or empty string if unsupported')
            }))
          }),
        });
        return Response.json(object);
      }

      case 'consistency': {
        const { question, answers } = payload;
        const prompt = `Question: ${question}\n\nAnswer A: ${answers[0]}\n\nAnswer B: ${answers[1]}\n\nAnswer C: ${answers[2]}`;
        const { object } = await generateObject({
          model,
          system: 'Compare three independently generated answers to the same question. Decide if they agree on the key facts, or materially contradict each other.',
          prompt,
          schema: z.object({
            consistent: z.boolean().describe('True if all answers agree on key facts'),
            notes: z.string().describe('One short sentence explaining why they are or are not consistent')
          }),
        });
        return Response.json(object);
      }

      default:
        return Response.json({ error: { message: 'Invalid action.' } }, { status: 400 });
    }
  } catch (e) {
    console.error('Agent route error:', e);
    return Response.json(
      { error: { message: 'Could not complete the agent request: ' + e.message } },
      { status: 502 }
    );
  }
}
