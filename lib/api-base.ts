/**
 * The one place the backend's base URL is decided.
 *
 * `lib/api.ts` and `lib/product-api.ts` both talk to the same FastAPI service
 * and used to carry their own defaults — and they disagreed: one pointed at
 * `localhost:3000/api`, which is the Next app itself, so a deploy with the
 * variable unset answered 404 to every call instead of failing visibly.
 *
 * The value must include the `/api` segment, e.g. http://localhost:8000/api.
 */

const DEV_FALLBACK = 'http://localhost:8000/api'

function resolveApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')

  // In production an unset base is a deployment mistake, not something to
  // paper over with a localhost default that can never work. Fail loudly.
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not set. Point it at the NoteAI backend, ' +
        'including the /api segment (for example https://api.example.com/api).'
    )
  }

  return DEV_FALLBACK
}

/**
 * Deliberately a getter rather than a module-level constant: evaluating at
 * import time would throw during the production *build*, where the variable
 * legitimately may not be present, instead of at the moment a request is made.
 */
export function apiUrl(): string {
  return resolveApiUrl()
}

/** Builds a full URL for a `/v1/...` path. */
export function apiPath(path: string): string {
  return `${apiUrl()}${path}`
}
