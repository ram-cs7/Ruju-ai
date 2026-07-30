import * as cheerio from 'cheerio';
import { auth } from '@clerk/nextjs/server';

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return Response.json({ error: 'Missing URL parameter.' }, { status: 400 });
    }

    let fetchUrl = url;
    if (!fetchUrl.startsWith('http://') && !fetchUrl.startsWith('https://')) {
      fetchUrl = 'https://' + fetchUrl;
    }

    // Use Jina Reader to convert any URL (including SPAs) to clean Markdown
    const response = await fetch('https://r.jina.ai/' + fetchUrl, {
      headers: {
        'Accept': 'text/plain',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL. Status: ${response.status}`);
    }

    let finalContent = await response.text();

    // Check for login walls or overly short content
    if (!finalContent || finalContent.length < 50) {
      return Response.json({ error: 'Could not extract enough meaningful text from this URL. It might be behind a login wall.' }, { status: 400 });
    }
    
    // Quick heuristic to detect login walls returned by SPAs
    if (finalContent.toLowerCase().includes('login to your account') && finalContent.length < 500) {
      return Response.json({ error: 'This URL appears to be behind a login wall and cannot be automatically scraped.' }, { status: 400 });
    }

    // Extract a title from the markdown if Jina provided one, else use URL
    let title = fetchUrl;
    const titleMatch = finalContent.match(/^Title: (.*)$/m);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    return Response.json({ content: finalContent, title });

  } catch (err) {
    console.error('Scraping error:', err);
    return Response.json({ error: 'Failed to scrape URL. It may be protected, invalid, or behind a login wall.' }, { status: 500 });
  }
}
