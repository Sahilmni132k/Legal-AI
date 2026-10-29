# LegalFlow AI

A demo-ready legal document review prototype. It supports Firebase sign-in, local text extraction from PDF/DOCX/TXT files, AI summaries, and contract findings linked to exact quoted source passages.

## Local development

```sh
npm install
npm run dev
```

Vite serves the React app and the local review endpoint at `/api/review-document`. The function reads client-safe Firebase values from `.env.local` and server secrets from `.env`.

## Firebase Authentication setup

1. Create a Firebase project and register a web app.
2. In **Authentication → Sign-in method**, enable **Email/Password** and **Google**.
3. Copy `.env.example` to `.env.local` and fill in `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` from the Firebase web app config.
4. Add `localhost` and your deployed hostname under **Authentication → Settings → Authorized domains**.

## AI endpoint setup

1. Copy `.env.server.example` to `.env`.
2. Set `OPENAI_API_KEY` to an API key for your OpenAI Platform project. Keep it server-side; never put it in a `VITE_` variable.
3. Set `FIREBASE_SERVICE_ACCOUNT_JSON` to the Firebase Admin service account JSON for the same Firebase project. For `.env`, use the complete JSON as one single-quoted, single-line value. Never commit or share this private key.
4. Restart `npm run dev` after changing either environment file.

The AI endpoint verifies the Firebase ID token before calling OpenAI. It accepts up to 80,000 extracted characters, uses structured output, requests `store: false`, returns no document text, and discards any finding whose quote is not an exact match in the source text. Text is sent to the configured AI provider only after the user requests a summary or review. Do not submit confidential legal documents unless your organization approves that provider and workflow.

## Deploy to Netlify

The repository includes `netlify.toml` for the Vite build, SPA routing, and the `review-document` function. In Netlify, set these variables:

- Build scope: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
- Functions scope: `OPENAI_API_KEY` and `FIREBASE_SERVICE_ACCOUNT_JSON` as secrets; optionally set `OPENAI_MODEL` (defaults to `gpt-6-astra`).

Redeploy after adding or changing the environment values. Add the resulting Netlify hostname to Firebase Authentication's authorized domains.

## Limits

- Scanned PDFs need OCR, which is not included.
- Legal research/case-law lookup and persistent document storage are not implemented.
- AI output is informational, can be wrong, and must be reviewed by a qualified lawyer. Exact quotes are source-linked; they do not guarantee that the analysis is complete or legally correct.
- The deployed function depends on your Firebase and OpenAI account configuration, quotas, and enabled sign-in providers.

