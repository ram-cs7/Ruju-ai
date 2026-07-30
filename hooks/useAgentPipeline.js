import { useState, useCallback } from 'react';
import { retrieveTopChunks } from '../utils/retrieval';

// Simple function to stream text from our custom API
async function streamFromAgent(action, payload, onChunk) {
  const res = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message || `Agent error (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = '';
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    fullText += chunk;
    onChunk(fullText, chunk);
  }
  
  return fullText;
}

// Simple function to get JSON from our custom API
async function jsonFromAgent(action, payload) {
  const res = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error(data?.error?.message || `Agent error (${res.status})`);
  }
  return data;
}

// Simple function to stream a partial JSON object back from our custom API
async function streamObjectFromAgent(action, payload, onPartial) {
  const res = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  });
  
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data?.error?.message || `Agent error (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let finalObject = {};
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep last incomplete line
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const partial = JSON.parse(line);
          finalObject = partial;
          onPartial(partial);
        } catch(e) {}
      }
    }
  }
  return finalObject;
}

export function useAgentPipeline({ deepVerify, onSaveHistory }) {
  const [stage, setStage] = useState('idle');
  const [subquestions, setSubquestions] = useState([]);
  const [subAnswers, setSubAnswers] = useState([]);
  const [retrievedChunks, setRetrievedChunks] = useState([]);
  const [answer, setAnswer] = useState('');
  const [claims, setClaims] = useState([]);
  const [trustScore, setTrustScore] = useState(null);
  const [consistency, setConsistency] = useState(null);
  const [error, setError] = useState('');

  const reset = useCallback(() => {
    setStage('idle');
    setSubquestions([]);
    setSubAnswers([]);
    setAnswer('');
    setClaims([]);
    setTrustScore(null);
    setConsistency(null);
    setRetrievedChunks([]);
    setError('');
  }, []);

  const runPipeline = useCallback(async (documents, snippetText, question) => {
    const hasSource = documents.length > 0 || snippetText.trim();
    if (!hasSource || !question.trim()) {
      setError("Add a source document/snippet and a question before running.");
      return;
    }
    
    reset();
    setStage('retrieving');
    
    try {
      // 1. Vector Search for Chunks
      const documentIds = documents.map(d => d.id).filter(id => !id.includes('.'));
      
      let vectorChunks = [];
      if (documentIds.length > 0) {
        const res = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentIds, query: question, limit: 7 })
        });
        const data = await res.json();
        if (data.chunks) vectorChunks = data.chunks;
      }
      
      // Combine vector chunks with the manual snippet text
      const allChunks = [...vectorChunks];
      if (snippetText.trim()) allChunks.push(snippetText.trim());
      
      setRetrievedChunks(allChunks);
      const context = allChunks.join('\n\n---\n\n');

      // 2. Planning
      setStage('planning');
      const planData = await jsonFromAgent('plan', { question });
      const subqs = (planData.subquestions || [question]).slice(0, 4);
      setSubquestions(subqs);

      // 3. Researching
      setStage('researching');
      const systemPrompt = `You are the Researcher agent. Answer using ONLY the source excerpts below \u2014 no outside knowledge. If the excerpts don't cover it, say so plainly instead of guessing.\n\nSOURCE EXCERPTS:\n${context}`;
      
      const streamedAnswers = new Array(subqs.length).fill('');
      setSubAnswers(subqs.map((sq) => ({ q: sq, a: '' })));

      const rawSubAnswers = await Promise.all(
        subqs.map((sq, i) => 
          streamFromAgent('research', { system: systemPrompt, subQuestion: sq }, (fullText) => {
            streamedAnswers[i] = fullText;
            // Spread to trigger re-render
            setSubAnswers(subqs.map((q, idx) => ({ q, a: streamedAnswers[idx] })));
          })
        )
      );
      
      const combinedAnswers = subqs.map((sq, i) => ({ q: sq, a: rawSubAnswers[i] }));
      setSubAnswers(combinedAnswers);

      setStage('synthesizing');
      setAnswer(''); // Clear before streaming
      const synthesis = await streamFromAgent('synthesize', {
        question,
        subAnswers: combinedAnswers
      }, (fullText) => {
        setAnswer(fullText); // Update UI as it types
      });

      setStage('verifying');
      let claimsList = [];
      const verifyData = await jsonFromAgent('verify', {
        system: `SOURCE EXCERPTS:\n${context}`,
        answer: synthesis
      });
      if (verifyData && verifyData.claims) {
        claimsList = verifyData.claims;
        setClaims(claimsList);
      }

      let consistencyData = null;
      if (deepVerify) {
        setStage('consistency');
        const [altA, altB] = await Promise.all([
          streamFromAgent('research', { system: systemPrompt, subQuestion: question }, () => {}),
          streamFromAgent('research', { system: systemPrompt, subQuestion: question }, () => {})
        ]);
        
        consistencyData = await jsonFromAgent('consistency', {
          question,
          answers: [synthesis, altA, altB]
        });
        setConsistency(consistencyData);
      }

      const supportedCount = claimsList.filter((c) => c.supported).length;
      const totalClaims = claimsList.length || 1;
      let score = Math.round((supportedCount / totalClaims) * 100);
      if (deepVerify && consistencyData && consistencyData.consistent === false) {
        score = Math.max(0, score - 25);
      }
      
      setTrustScore(score);
      setStage('done');

      onSaveHistory({ 
        question, 
        score, 
        total: claimsList.length, 
        supported: supportedCount,
        sourceText: context,
        answer: synthesis,
        claims: claimsList,
        subquestions: subqs,
        subAnswers: combinedAnswers,
        retrievedChunks: allChunks,
        consistency: consistencyData
      });
      
    } catch (e) {
      setError(e.message || 'The pipeline hit an error. Try again.');
      setStage('error');
    }
  }, [deepVerify, onSaveHistory, reset]);

  const loadState = useCallback((savedState) => {
    setStage('done');
    setSubquestions(savedState.subquestions || []);
    setSubAnswers(savedState.subAnswers || []);
    setAnswer(savedState.answer || '');
    setClaims(savedState.claims || []);
    setTrustScore(savedState.score || null);
    setConsistency(savedState.consistency || null);
    setRetrievedChunks(savedState.retrievedChunks || []);
    setError('');
  }, []);

  return {
    stage,
    subquestions,
    subAnswers,
    retrievedChunks,
    answer,
    claims,
    trustScore,
    consistency,
    error,
    runPipeline,
    reset,
    loadState
  };
}
