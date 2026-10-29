const MAX_FILE_BYTES = 20 * 1024 * 1024
const MAX_TEXT_CHARACTERS = 80_000

export async function extractDocumentText(file) {
  if (file.size > MAX_FILE_BYTES) throw new Error('This prototype supports files up to 20 MB.')

  const extension = file.name.split('.').pop()?.toLowerCase()
  let text

  if (extension === 'txt') {
    text = await file.text()
  } else if (extension === 'pdf') {
    text = await extractPdf(file)
  } else if (extension === 'docx') {
    text = await extractDocx(file)
  } else {
    throw new Error('Choose a PDF, DOCX, or TXT document.')
  }

  text = text.split('\u0000').join('').trim()
  if (!text) throw new Error('No selectable text was found. Scanned PDFs need OCR, which this prototype does not include yet.')
  if (text.length > MAX_TEXT_CHARACTERS) throw new Error('This document is too long for the prototype. Use a shorter document or split it into sections.')

  return text
}

async function extractPdf(file) {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const pages = []

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber)
      const content = await page.getTextContent()
      const pageText = content.items.map((item) => 'str' in item ? item.str : '').filter(Boolean).join(' ').trim()
      if (pageText) pages.push(`[Page ${pageNumber}]\n${pageText}`)
      if (pages.join('\n\n').length > MAX_TEXT_CHARACTERS) {
        throw new Error('This document is too long for the prototype. Use a shorter document or split it into sections.')
      }
    }
  } finally {
    await pdf.destroy()
  }

  return pages.join('\n\n')
}

async function extractDocx(file) {
  const mammothModule = await import('mammoth/mammoth.browser')
  const mammoth = mammothModule.default || mammothModule
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
  return result.value
}

