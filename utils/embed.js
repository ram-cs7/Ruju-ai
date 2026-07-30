import { pipeline, env } from '@xenova/transformers';

// Configure env for serverless/local usage
env.allowRemoteModels = true;
env.allowLocalModels = false; 

class PipelineSingleton {
  static task = 'feature-extraction';
  static model = 'Xenova/all-MiniLM-L6-v2';
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance === null) {
      this.instance = pipeline(this.task, this.model, { progress_callback });
    }
    return this.instance;
  }
}

export async function generateEmbedding(text) {
  try {
    const embedder = await PipelineSingleton.getInstance();
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
  } catch (error) {
    console.error('Embedding error:', error);
    throw error;
  }
}

export function chunkText(text, maxWords = 400) {
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = [];

  for (const word of words) {
    currentChunk.push(word);
    if (currentChunk.length >= maxWords) {
      chunks.push(currentChunk.join(' '));
      // Overlap by 50 words to maintain context
      currentChunk = currentChunk.slice(-50);
    }
  }
  
  if (currentChunk.length > 50 || (chunks.length === 0 && currentChunk.length > 0)) {
    chunks.push(currentChunk.join(' '));
  }
  
  return chunks;
}
