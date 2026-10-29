import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { Buffer } from 'node:buffer'
import process from 'node:process'

function localReviewFunction() {
  return {
    name: 'legalflow-local-review-function',
    configureServer(server) {
      server.middlewares.use('/api/review-document', async (request, response, next) => {
        try {
          const chunks = []
          let byteLength = 0
          for await (const chunk of request) {
            byteLength += chunk.length
            if (byteLength > 600_000) {
              response.statusCode = 413
              response.end(JSON.stringify({ error: 'The request is too large.' }))
              return
            }
            chunks.push(chunk)
          }

          const requestHeaders = { 'Content-Type': request.headers['content-type'] || 'application/json' }
          if (request.headers.authorization) requestHeaders.Authorization = request.headers.authorization
          const webRequest = new Request('http://localhost/api/review-document', {
            method: request.method,
            headers: requestHeaders,
            body: ['GET', 'HEAD'].includes(request.method) ? undefined : Buffer.concat(chunks),
          })
          const { default: handler } = await import('./netlify/functions/review-document.mjs')
          const result = await handler(webRequest)
          response.statusCode = result.status
          for (const [name, value] of result.headers) response.setHeader(name, value)
          response.end(Buffer.from(await result.arrayBuffer()))
        } catch (error) {
          next(error)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const fileEnvironment = loadEnv(mode, process.cwd(), '')
  for (const [name, value] of Object.entries(fileEnvironment)) {
    if (process.env[name] === undefined) process.env[name] = value
  }

  return {
    plugins: [react(), localReviewFunction()],
    server: { host: '127.0.0.1' },
  }
})

