import { generateEmbedding } from '../utils/embed.js';

async function test() {
  console.log("Loading model and generating embedding...");
  const start = Date.now();
  const vector = await generateEmbedding("Hello world, this is a test of Xenova transformers.");
  console.log(`Generated embedding of length ${vector.length} in ${Date.now() - start}ms`);
}

test().catch(console.error);
