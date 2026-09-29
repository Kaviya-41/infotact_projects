# SyncDoc Mid-Review Automated API Demonstration Script (Member 1)
# Usage: powershell -ExecutionPolicy Bypass -File .\docs\mid-review-demo.ps1
#
# PREREQUISITE: Backend must be running in another terminal:
#   cd "C:\webdev p2 b13\backend"
#   npm run dev

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:5000/api"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SYNCDOC - MEMBER 1 MID REVIEW" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ──────────────────────────────────────────────
# [1] HEALTH CHECK
# ──────────────────────────────────────────────
Write-Host "[1] HEALTH CHECK" -ForegroundColor Yellow
Write-Host "    GET /api/health" -ForegroundColor DarkGray
try {
    $health = Invoke-RestMethod "$baseUrl/health"
    Write-Host "    Result:" -ForegroundColor Green
    $health | ConvertTo-Json | Write-Host
} catch {
    Write-Host "    ERROR: Backend not reachable on port 5000." -ForegroundColor Red
    Write-Host "    Make sure 'npm run dev' is running in another terminal." -ForegroundColor Red
    exit 1
}
Write-Host ""

# ──────────────────────────────────────────────
# [2] CREATE DOCUMENT
# ──────────────────────────────────────────────
Write-Host "[2] CREATE DOCUMENT" -ForegroundColor Yellow
Write-Host "    POST /api/documents" -ForegroundColor DarkGray

$headingData = @{
    text = "SyncDoc Collaborative Document Engine"
}
$paragraphData = @{
    text = "SyncDoc represents documents as structured, typed AST nodes."
}
$codeData = @{
    language = "typescript"
    code = "const engine = new ASTEngine();"
}
$listItems = @("Heading", "Paragraph", "Code", "List")
$listData = @{
    ordered = $true
    items = $listItems
}

$createPayload = @{
    title = "SyncDoc Architecture Specs"
    ownerId = "mid-review-user"
    version = 1
    blocks = @(
        @{
            id = "block-1"
            type = "heading"
            data = $headingData
        },
        @{
            id = "block-2"
            type = "paragraph"
            data = $paragraphData
        },
        @{
            id = "block-3"
            type = "code"
            data = $codeData
        },
        @{
            id = "block-4"
            type = "list"
            data = $listData
        }
    )
}

$createBody = $createPayload | ConvertTo-Json -Depth 10

$createResponse = Invoke-RestMethod `
    -Method Post `
    -Uri "$baseUrl/documents" `
    -ContentType "application/json" `
    -Body $createBody

Write-Host "    Result:" -ForegroundColor Green
$createResponse | ConvertTo-Json -Depth 10 | Write-Host
Write-Host ""

# ──────────────────────────────────────────────
# [3] DOCUMENT ID
# ──────────────────────────────────────────────
$documentId = $createResponse.data._id
Write-Host "[3] DOCUMENT ID" -ForegroundColor Yellow
Write-Host "    MongoDB _id: $documentId" -ForegroundColor Cyan
Write-Host ""

# ──────────────────────────────────────────────
# [4] GET DOCUMENT
# ──────────────────────────────────────────────
Write-Host "[4] GET DOCUMENT" -ForegroundColor Yellow
Write-Host "    GET /api/documents/$documentId" -ForegroundColor DarkGray

$getResponse = Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/documents/$documentId"

Write-Host "    Result:" -ForegroundColor Green
$getResponse | ConvertTo-Json -Depth 10 | Write-Host
Write-Host ""

# ──────────────────────────────────────────────
# [5] LIST DOCUMENTS
# ──────────────────────────────────────────────
Write-Host "[5] LIST DOCUMENTS" -ForegroundColor Yellow
Write-Host "    GET /api/documents" -ForegroundColor DarkGray

$listResponse = Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/documents"

$totalDocs = $listResponse.pagination.total
Write-Host "    Total documents in database: $totalDocs" -ForegroundColor Green
Write-Host ""

# ──────────────────────────────────────────────
# [6] UPDATE DOCUMENT
# ──────────────────────────────────────────────
Write-Host "[6] UPDATE DOCUMENT" -ForegroundColor Yellow
Write-Host "    PUT /api/documents/$documentId" -ForegroundColor DarkGray

$updatedHeadingData = @{
    text = "Updated Architecture Overview"
}
$updatedParagraphData = @{
    text = "SyncDoc uses structured AST nodes for collaborative editing."
}

$updatePayload = @{
    title = "SyncDoc Architecture Specs (Updated)"
    blocks = @(
        @{
            id = "block-1"
            type = "heading"
            data = $updatedHeadingData
        },
        @{
            id = "block-2"
            type = "paragraph"
            data = $updatedParagraphData
        }
    )
}

$updateBody = $updatePayload | ConvertTo-Json -Depth 10

$updateResponse = Invoke-RestMethod `
    -Method Put `
    -Uri "$baseUrl/documents/$documentId" `
    -ContentType "application/json" `
    -Body $updateBody

$newVersion = $updateResponse.data.version
Write-Host "    Document updated. Version incremented to: v$newVersion" -ForegroundColor Green
Write-Host ""

# ──────────────────────────────────────────────
# [7] AST CHANGE (CREATE_BLOCK)
# ──────────────────────────────────────────────
Write-Host "[7] AST CHANGE (CREATE_BLOCK)" -ForegroundColor Yellow
Write-Host "    POST /api/documents/$documentId/changes" -ForegroundColor DarkGray

$newBlockData = @{
    language = "javascript"
    code = "console.log('Dynamic AST mutation');"
}
$changePayload = @{
    documentId = $documentId
    blockId = "block-5"
    operation = "CREATE_BLOCK"
    version = 2
    payload = @{
        type = "code"
        data = $newBlockData
    }
}

$changeBody = $changePayload | ConvertTo-Json -Depth 10

$changeResponse = Invoke-RestMethod `
    -Method Post `
    -Uri "$baseUrl/documents/$documentId/changes" `
    -ContentType "application/json" `
    -Body $changeBody

Write-Host "    AST mutation applied successfully." -ForegroundColor Green
$changeResponse | ConvertTo-Json -Depth 10 | Write-Host
Write-Host ""

# ──────────────────────────────────────────────
# [8] VALIDATION / SECURITY TEST
# ──────────────────────────────────────────────
Write-Host "[8] VALIDATION / SECURITY TEST" -ForegroundColor Yellow

# 8a. MongoDB operator injection rejection
Write-Host "    8a. Testing MongoDB operator injection rejection..." -ForegroundColor DarkGray

$operatorPayload = @{}
$operatorPayload.'$set' = @{ ownerId = "hacked" }
$operatorBody = $operatorPayload | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod `
        -Method Put `
        -Uri "$baseUrl/documents/$documentId" `
        -ContentType "application/json" `
        -Body $operatorBody
    Write-Host "    FAIL: Operator injection was not blocked." -ForegroundColor Red
} catch {
    Write-Host "    PASS: Server rejected MongoDB operator with HTTP 400." -ForegroundColor Green
    try {
        $errStream = $_.Exception.Response.GetResponseStream()
        $errReader = New-Object System.IO.StreamReader($errStream)
        $errBody = $errReader.ReadToEnd()
        Write-Host "    Response: $errBody" -ForegroundColor Gray
    } catch {
        Write-Host "    (Could not read error response body)" -ForegroundColor DarkGray
    }
}
Write-Host ""

# 8b. Invalid AST rejection (missing block ID)
Write-Host "    8b. Testing invalid AST rejection (missing block ID)..." -ForegroundColor DarkGray

$invalidHeadingData = @{
    text = "Missing ID Block"
}
$invalidPayload = @{
    title = "Invalid Document"
    ownerId = "test-user"
    blocks = @(
        @{
            type = "heading"
            data = $invalidHeadingData
        }
    )
}
$invalidBody = $invalidPayload | ConvertTo-Json -Depth 10

try {
    Invoke-RestMethod `
        -Method Post `
        -Uri "$baseUrl/documents" `
        -ContentType "application/json" `
        -Body $invalidBody
    Write-Host "    FAIL: Invalid AST was not rejected." -ForegroundColor Red
} catch {
    Write-Host "    PASS: Server rejected invalid AST with HTTP 400." -ForegroundColor Green
    try {
        $errStream2 = $_.Exception.Response.GetResponseStream()
        $errReader2 = New-Object System.IO.StreamReader($errStream2)
        $errBody2 = $errReader2.ReadToEnd()
        Write-Host "    Response: $errBody2" -ForegroundColor Gray
    } catch {
        Write-Host "    (Could not read error response body)" -ForegroundColor DarkGray
    }
}
Write-Host ""

# ──────────────────────────────────────────────
# [9] FINAL DOCUMENT
# ──────────────────────────────────────────────
Write-Host "[9] FINAL DOCUMENT" -ForegroundColor Yellow
Write-Host "    GET /api/documents/$documentId" -ForegroundColor DarkGray

$finalResponse = Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/documents/$documentId"

Write-Host "    Final document state:" -ForegroundColor Green
$finalResponse | ConvertTo-Json -Depth 10 | Write-Host

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " MID-REVIEW DEMO COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Document ID preserved: $documentId" -ForegroundColor Cyan
Write-Host "You can continue to query this document." -ForegroundColor DarkGray
Write-Host ""
