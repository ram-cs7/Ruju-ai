import { pipeline, env } from '@xenova/transformers';

// Skip local model checks and use the remote HuggingFace Hub directly
env.allowLocalModels = false;
env.useBrowserCache = false; 

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

function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function retrieveTopChunks(text, query, topK = 7) {
  if (!text || !query) return [];

  const chunks = [];
  let currentChunk = '';
  const sentences = text.split(/([.?!]+)/);
  
  for (let i = 0; i < sentences.length; i += 2) {
    const sentence = (sentences[i] + (sentences[i+1] || '')).trim();
    if (!sentence) continue;
    
    if (currentChunk.length + sentence.length > 800) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  try {
    const extractor = await PipelineSingleton.getInstance();
    
    const queryOutput = await extractor(query, { pooling: 'mean', normalize: true });
    const queryEmbedding = Array.from(queryOutput.data);

    // Transformers.js handles arrays of strings nicely for batch extraction
    const chunkOutputs = await extractor(chunks, { pooling: 'mean', normalize: true });
    const chunkEmbeddings = chunkOutputs.tolist(); 

    const scoredChunks = chunks.map((chunk, i) => {
      const score = cosineSimilarity(queryEmbedding, chunkEmbeddings[i]);
      return { chunk, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK).map(s => s.chunk);

  } catch (err) {
    console.warn('Transformers embedding failed, falling back to lexical matching:', err);
    // Simple lexical fallback
    const queryWords = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    const scoredChunks = chunks.map(chunk => {
      const chunkLower = chunk.toLowerCase();
      let score = 0;
      if (chunkLower.includes(query.toLowerCase())) score += 10;
      queryWords.forEach(qw => {
        const regex = new RegExp(`\\b${qw}\\b`, 'g');
        const matches = chunkLower.match(regex);
        if (matches) score += matches.length;
      });
      return { chunk, score };
    });
    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK).map(s => s.chunk);
  }
}
