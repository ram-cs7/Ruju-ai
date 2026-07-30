# Ruju.ai - Verification Engine

Ruju.ai is a powerful B2B multi-agent verification pipeline designed to eliminate AI hallucination. Rather than blindly generating answers, Ruju.ai forces AI agents to strictly verify their own claims against the raw source documents and web links you provide. 

A **Planner** breaks your question into analytical angles, **Researchers** scour your source document to answer each one, a **Synthesizer** merges those into a unified answer, and a **Verifier** extracts every factual claim in that answer and cross-checks it against the source. The output is a highly trusted, fully-cited answer with a neon highlighter pointing you exactly to where the claim exists in the document.

---

## 🚀 Features

- **Agentic Pipeline**: Planner → Researcher → Synthesizer → Verifier pipeline ensures accuracy and grounds the AI entirely in your context.
- **RAG & Split-Pane Highlighting**: Vector-search backing with a sleek Split-Pane Document Viewer that highlights the exact quoted evidence inside your uploaded PDFs and text files.
- **Universal Web Scraping**: Instantly scrape and verify public URLs via Jina Reader. Paste a link, and Ruju.ai will extract the text and verify claims against it.
- **Team Workspaces**: Full B2B SaaS multi-tenant isolation via Clerk Organizations. Invite team members and securely share your verification reports and documents.
- **Enterprise API & Extension**: Developer API keys allow for programmatic verification via REST API, or directly in your browser using the Ruju Chrome Extension.
- **Auditor-Ready CSV Exports**: Export the claim docket to CSV for compliance, spreadsheets, or internal reporting.
- **Modern Aesthetic**: Premium, responsive UI that scales seamlessly to mobile devices and automatically supports your system's light/dark preference.
- **Authentication & Billing**: Secure login, signup, and profile management powered by Clerk, with complete built-in Stripe billing.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Database**: Prisma ORM with PostgreSQL (pgvector enabled)
- **Authentication**: Clerk (with Organizations for B2B)
- **LLM Provider**: Groq API (defaults to `llama-3.1-70b-versatile` for high-speed agent interactions)
- **Rate Limiting**: Upstash Redis
- **File Parsing**: `pdfjs-dist` (v3) for PDF extraction, Jina Reader for web scraping

---

## 💻 Running Locally

**Requirements:** Node.js 20 or newer, and access to a PostgreSQL database.

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the example environment file and fill it out:
```bash
cp .env.local.example .env.local
```

You will need the following keys:
- **Groq API Key**: Get a free key at [console.groq.com](https://console.groq.com/keys)
- **Clerk Auth Keys**: Set up a free Next.js project at [clerk.com](https://clerk.com). **Note:** You must enable the "Organizations" feature in your Clerk dashboard to use Team Workspaces.
- **Database URL**: Set up a free Postgres database with `pgvector` enabled (e.g., [Supabase](https://supabase.com)) and paste the Prisma connection pool string.
- **Upstash Redis**: Get a free Redis database at [upstash.com](https://upstash.com) and copy the `UPSTASH_REDIS_REST_URL` and `TOKEN`.

### 3. Initialize Database Schema
Push the Prisma schema to your database and generate the Prisma Client:
```bash
npx prisma db push
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```
Your application will be available at [http://localhost:3000](http://localhost:3000).

---

## 🏗 Architecture Overview

1. **Upload & Ingest**: Users upload documents or provide URLs. The server uses `pdfjs-dist` to parse local PDFs, and Jina Reader to scrape web URLs. The text is chunked and embedded via `@xenova/transformers` (`Xenova/all-MiniLM-L6-v2`) and stored in PostgreSQL (`pgvector`).
2. **Retrieve Context**: When a user asks a verification question, the system retrieves the most relevant chunks using vector cosine similarity.
3. **Agent Pipeline (`useAgentPipeline`)**:
   - **Plan**: Determines how to tackle the question.
   - **Research**: Investigates the chunks for evidence.
   - **Synthesize**: Formulates a complete draft.
   - **Verify**: Rips the draft apart, extracting every claim and determining boolean Support metrics.
4. **Display**: The `DocumentViewer` UI conditionally renders PDF iframes or highlighted raw text based on the active evidence the user selects from the Verifier docket.

---

## 📄 License
Commercial License - All Rights Reserved.
