# SyncDoc Backend Export API Contract (Member 1 → Member 3 Handoff)

## Overview

The Export API allows the frontend (Member 3's React Editor) to trigger document exports in either **HTML** or **PDF** format.

---

## Endpoint Details

### `GET /api/documents/:id/export`

#### Path Parameters
- `id` (string, required): 24-character hex MongoDB ObjectId of the document.

#### Query Parameters
- `format` (string, **required**): Target export format.
  - `format=html` → Renders complete HTML5 document.
  - `format=pdf` → Renders PDF binary document.
- `download` (string, optional): Pass `download=true` to force browser file attachment download (`Content-Disposition: attachment`).

---

## Example Requests & Responses

### 1. HTML Export Request
```http
GET /api/documents/60c72b2f9b1d8b2b8c8b4567/export?format=html
```

#### Success Response (200 OK)
- **Content-Type**: `text/html; charset=utf-8`
- **Body**: Complete HTML5 document string
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Document Title</title>
  <style>...</style>
</head>
<body>
  <h1>Heading Content</h1>
  <p>Paragraph text</p>
  <pre><code class="language-typescript">code...</code></pre>
</body>
</html>
```

---

### 2. PDF Export Request
```http
GET /api/documents/60c72b2f9b1d8b2b8c8b4567/export?format=pdf
```

#### Success Response (200 OK)
- **Content-Type**: `application/pdf`
- **Content-Disposition**: `attachment; filename="Document_Title.pdf"`
- **Body**: Binary PDF Buffer

---

## Error Handling

### 1. Missing `format` Query Parameter
```http
GET /api/documents/60c72b2f9b1d8b2b8c8b4567/export
```
#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Missing required query parameter 'format'. Supported formats: html, pdf"
}
```

### 2. Unsupported `format` Value
```http
GET /api/documents/60c72b2f9b1d8b2b8c8b4567/export?format=docx
```
#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Invalid export format 'docx'. Supported formats: html, pdf"
}
```

### 3. Invalid Document ID
```http
GET /api/documents/invalid-id/export?format=html
```
#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "message": "Invalid document ID"
}
```

### 4. Document Not Found
```http
GET /api/documents/60c72b2f9b1d8b2b8c8b9999/export?format=html
```
#### Error Response (404 Not Found)
```json
{
  "success": false,
  "message": "Document not found"
}
```

---

## Frontend Integration Tips for Member 3

1. **Triggering PDF Download in Browser**:
```typescript
const downloadPdf = async (documentId: string) => {
  const response = await fetch(`/api/documents/${documentId}/export?format=pdf`);
  if (!response.ok) throw new Error("Export failed");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `document_${documentId}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
};
```

2. **Embedding HTML Preview**:
```typescript
const fetchHtmlPreview = async (documentId: string) => {
  const response = await fetch(`/api/documents/${documentId}/export?format=html`);
  const htmlText = await response.text();
  return htmlText;
};
```
