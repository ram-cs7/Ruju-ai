export async function parseFile(file) {
  const extension = file.name.split('.').pop().toLowerCase();

  try {
    if (extension === 'txt') {
      return await file.text();
    } else if (extension === 'pdf') {
      return await parsePDF(file);
    } else if (extension === 'docx') {
      return await parseDOCX(file);
    } else {
      throw new Error("Unsupported file format. Please upload .txt, .pdf, or .docx.");
    }
  } catch (error) {
    console.error("File parsing error:", error);
    throw new Error(`Failed to read ${extension.toUpperCase()} file: ` + error.message);
  }
}

async function parsePDF(file) {
  // Dynamically import to prevent SSR issues in Next.js
  const pdfjsLib = await import('pdfjs-dist');
  
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += strings.join(' ') + '\n\n';
  }
  
  return fullText;
}

async function parseDOCX(file) {
  const mammothModule = await import('mammoth');
  const mammoth = mammothModule.default || mammothModule;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
