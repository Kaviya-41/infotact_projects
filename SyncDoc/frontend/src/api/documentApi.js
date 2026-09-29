/**
 * SyncDoc API Client
 * Centralized fetch layer for all backend REST API calls.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Internal helper — handles JSON response envelope { success, data, message }
 */
export async function apiFetch(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(url, config);

  // For export endpoints that return non-JSON (HTML text or PDF binary)
  if (options._rawResponse) {
    if (!response.ok) {
      let errorMsg = `Request failed (${response.status})`;
      try {
        const errJson = await response.json();
        errorMsg = errJson.message || errorMsg;
      } catch { /* not JSON */ }
      throw new Error(errorMsg);
    }
    return response;
  }

  const json = await response.json();

  if (!response.ok || !json.success) {
    const errorMsg = json.message || `Request failed (${response.status})`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.errors = json.errors;
    throw error;
  }

  return json;
}

/**
 * GET /api/documents — list all documents
 */
export async function getDocuments() {
  const result = await apiFetch('/api/documents');
  return result.data || [];
}

/**
 * GET /api/documents/:id — get a single document with full AST
 */
export async function getDocument(id) {
  const result = await apiFetch(`/api/documents/${id}`);
  return result.data;
}

/**
 * POST /api/documents — create a new document
 */
export async function createDocument(title, blocks = []) {
  const result = await apiFetch('/api/documents', {
    method: 'POST',
    body: JSON.stringify({
      title,
      ownerId: 'frontend-user',
      blocks,
    }),
  });
  return result.data;
}

/**
 * PUT /api/documents/:id — update document title and/or blocks
 */
export async function updateDocument(id, payload) {
  const result = await apiFetch(`/api/documents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return result.data;
}

/**
 * DELETE /api/documents/:id — delete a document
 */
export async function deleteDocument(id) {
  await apiFetch(`/api/documents/${id}`, {
    method: 'DELETE',
  });
  return true;
}

/**
 * GET /api/documents/:id/export?format=html|pdf
 * Returns raw Response for the caller to handle (HTML text or PDF blob).
 */
export async function exportDocument(id, format) {
  const response = await apiFetch(
    `/api/documents/${id}/export?format=${encodeURIComponent(format)}`,
    { _rawResponse: true }
  );
  return response;
}

/**
 * GET /api/health — backend health check
 */
export async function healthCheck() {
  const result = await apiFetch('/api/health');
  return result;
}
