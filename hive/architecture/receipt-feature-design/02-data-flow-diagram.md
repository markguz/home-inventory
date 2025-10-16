# Receipt Processing - Data Flow Diagram

## Complete Pipeline Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│ STAGE 1: IMAGE CAPTURE                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   User Action: Camera capture OR file upload                         │
│        │                                                              │
│        ▼                                                              │
│   [Image File]                                                        │
│        │                                                              │
│        ├─── Validation: type (JPEG/PNG), size (<10MB)                │
│        │                                                              │
│        ▼                                                              │
│   [Valid Image] ──────────────────────────────────────────┐          │
│                                                            │          │
└────────────────────────────────────────────────────────────┼──────────┘
                                                             │
┌────────────────────────────────────────────────────────────┼──────────┐
│ STAGE 2: IMAGE PREPROCESSING (Client-Side)                │          │
├────────────────────────────────────────────────────────────┼──────────┤
│                                                            │          │
│   [Valid Image] ◀──────────────────────────────────────────┘          │
│        │                                                              │
│        ├─── Strip EXIF metadata                                       │
│        ├─── Resize if > 1920px width                                  │
│        ├─── Enhance contrast                                          │
│        ├─── Auto-rotate based on orientation                          │
│        ├─── Convert to grayscale                                      │
│        │                                                              │
│        ▼                                                              │
│   [Preprocessed Image]                                                │
│        │                                                              │
│        ├─── Compress to < 2MB                                         │
│        │                                                              │
│        ▼                                                              │
│   [Optimized Image] ──────────────────────────────────────┐          │
│                                                            │          │
└────────────────────────────────────────────────────────────┼──────────┘
                                                             │
┌────────────────────────────────────────────────────────────┼──────────┐
│ STAGE 3: TEMPORARY STORAGE (Optional)                     │          │
├────────────────────────────────────────────────────────────┼──────────┤
│                                                            │          │
│   [Optimized Image] ◀──────────────────────────────────────┘          │
│        │                                                              │
│        ├─── POST /api/receipts/upload                                 │
│        │    (multipart/form-data)                                     │
│        │                                                              │
│        ▼                                                              │
│   Supabase Storage                                                    │
│   └─ receipts-temp/{userId}/{uuid}.jpg                                │
│        │                                                              │
│        ├─── Generate signed URL (24h expiry)                          │
│        │                                                              │
│        ▼                                                              │
│   {receiptId, imageUrl, expiresAt} ───────────────────────┐          │
│                                                            │          │
└────────────────────────────────────────────────────────────┼──────────┘
                                                             │
┌────────────────────────────────────────────────────────────┼──────────┐
│ STAGE 4: OCR PROCESSING (Client-Side)                     │          │
├────────────────────────────────────────────────────────────┼──────────┤
│                                                            │          │
│   [Optimized Image] + [Metadata] ◀─────────────────────────┘          │
│        │                                                              │
│        ├─── Load tesseract.js (if not cached)                         │
│        ├─── Initialize worker (eng.traineddata)                       │
│        │                                                              │
│        ▼                                                              │
│   Tesseract.recognize(image, {lang: 'eng'})                           │
│        │                                                              │
│        ├─── Progress events: 0% → 100%                                │
│        │    (loading, recognizing text, recognizing words)            │
│        │                                                              │
│        ▼                                                              │
│   OCR Result {                                                        │
│     text: "RAW TEXT...",                                              │
│     words: [{text, confidence, bbox}, ...],                           │
│     confidence: 0.85                                                  │
│   }                                                                   │
│        │                                                              │
│        ├─── If confidence < 0.3 ──────────────────────────┐          │
│        │                                         Suggest manual entry │
│        │                                         or server fallback   │
│        │                                                   │          │
│        ▼                                                   │          │
│   [OCR Text Data] ─────────────────────────────┐          │          │
│                                                 │          │          │
└─────────────────────────────────────────────────┼──────────┼──────────┘
                                                  │          │
┌─────────────────────────────────────────────────┼──────────┼──────────┐
│ STAGE 5: RECEIPT PARSING (Client-Side)         │          │          │
├─────────────────────────────────────────────────┼──────────┼──────────┤
│                                                 │          │          │
│   [OCR Text Data] ◀─────────────────────────────┘          │          │
│        │                                                   │          │
│        ├─── Extract merchant name (top of receipt)        │          │
│        ├─── Extract date (regex patterns)                 │          │
│        ├─── Extract total amount (bottom, after "TOTAL")  │          │
│        │                                                   │          │
│        ├─── Detect line items:                            │          │
│        │    • Pattern: <name> <price>                     │          │
│        │    • Pattern: <qty> x <name> @ <unit> = <total>  │          │
│        │    • Skip subtotals, tax, total lines            │          │
│        │                                                   │          │
│        ├─── Calculate confidence per item:                │          │
│        │    base = word.confidence                        │          │
│        │    + 0.15 if price detected                      │          │
│        │    + 0.10 if quantity detected                   │          │
│        │    + 0.10 if in item region                      │          │
│        │                                                   │          │
│        ▼                                                   │          │
│   Parsed Receipt {                                        │          │
│     merchantName: "Store Name",                           │          │
│     receiptDate: "2025-10-15",                            │          │
│     totalAmount: 45.67,                                   │          │
│     items: [                                              │          │
│       {                                                   │          │
│         name: "Product A",                                │          │
│         quantity: 2,                                      │          │
│         unitPrice: 5.99,                                  │          │
│         totalPrice: 11.98,                                │          │
│         confidence: 0.85,                                 │          │
│         boundingBox: {x, y, w, h}                         │          │
│       },                                                  │          │
│       ...                                                 │          │
│     ]                                                     │          │
│   }                                                       │          │
│        │                                                   │          │
│        ▼                                                   │          │
│   [Structured Data] ───────────────────────────┐          │          │
│                                                 │          │          │
└─────────────────────────────────────────────────┼──────────┼──────────┘
                                                  │          │
                                           [Manual Entry] ◀──┘
                                                  │
┌─────────────────────────────────────────────────┼──────────────────────┐
│ STAGE 6: DRAFT PERSISTENCE                     │                      │
├─────────────────────────────────────────────────┼──────────────────────┤
│                                                 │                      │
│   [Structured Data] ◀───────────────────────────┘                      │
│        │                                                               │
│        ├─── POST /api/receipts                                         │
│        │    {                                                          │
│        │      merchantName, receiptDate, totalAmount,                  │
│        │      imageUrl, rawOcrText, confidence,                        │
│        │      extractedItems: [...]                                    │
│        │    }                                                          │
│        │                                                               │
│        ▼                                                               │
│   BEGIN TRANSACTION                                                    │
│        ├─── INSERT INTO receipts (...)                                 │
│        │    RETURNING receipt_id                                       │
│        │                                                               │
│        ├─── INSERT INTO extracted_items (receipt_id, ...)              │
│        │    VALUES (...), (...), (...)  -- Batch insert                │
│        │                                                               │
│   COMMIT TRANSACTION                                                   │
│        │                                                               │
│        ▼                                                               │
│   {receiptId, status: "draft", extractedItems: [...]}                  │
│        │                                                               │
│        ▼                                                               │
│   [Draft Receipt Saved] ──────────────────────────────────┐           │
│                                                            │           │
└────────────────────────────────────────────────────────────┼───────────┘
                                                             │
┌────────────────────────────────────────────────────────────┼───────────┐
│ STAGE 7: USER REVIEW & EDITING                            │           │
├────────────────────────────────────────────────────────────┼───────────┤
│                                                            │           │
│   [Draft Receipt] ◀────────────────────────────────────────┘           │
│        │                                                               │
│        ├─── Display: Original image + Extracted items                  │
│        │                                                               │
│        ├─── User interactions:                                         │
│        │    • Edit item name, quantity, price                          │
│        │    • Delete false positives                                   │
│        │    • Add missed items manually                                │
│        │    • Assign categories/locations                              │
│        │    • Mark items as "edited" (confidence → 1.0)                │
│        │                                                               │
│        ├─── Auto-save changes (debounced):                             │
│        │    PATCH /api/receipts/:id                                    │
│        │    PATCH /api/receipts/:id/items/:itemId                      │
│        │                                                               │
│        ├─── Highlight by confidence:                                   │
│        │    🟢 High (0.8-1.0): Likely correct                          │
│        │    🟡 Medium (0.5-0.79): Review recommended                   │
│        │    🔴 Low (0.0-0.49): Likely needs editing                    │
│        │                                                               │
│        ├─── Sort options:                                              │
│        │    • By confidence (low first)                                │
│        │    • By position (top to bottom)                              │
│        │    • By price (high to low)                                   │
│        │                                                               │
│        ▼                                                               │
│   User clicks "Confirm & Add to Inventory"                             │
│        │                                                               │
│        ▼                                                               │
│   [Reviewed Items] ────────────────────────────────────────┐          │
│                                                             │          │
└─────────────────────────────────────────────────────────────┼──────────┘
                                                              │
┌─────────────────────────────────────────────────────────────┼──────────┐
│ STAGE 8: INVENTORY CREATION                                │          │
├─────────────────────────────────────────────────────────────┼──────────┤
│                                                             │          │
│   [Reviewed Items] ◀────────────────────────────────────────┘          │
│        │                                                               │
│        ├─── POST /api/receipts/:id/confirm                             │
│        │    {                                                          │
│        │      items: [                                                 │
│        │        {                                                      │
│        │          extractedItemId: "...",                              │
│        │          name: "Product A",                                   │
│        │          quantity: 2,                                         │
│        │          categoryId: "...",                                   │
│        │          locationId: "...",                                   │
│        │          ...inventoryItemFields                               │
│        │        },                                                     │
│        │        ...                                                    │
│        │      ]                                                        │
│        │    }                                                          │
│        │                                                               │
│        ▼                                                               │
│   BEGIN TRANSACTION                                                    │
│        │                                                               │
│        ├─── For each confirmed item:                                   │
│        │    INSERT INTO items (                                        │
│        │      name, quantity, category_id, location_id,                │
│        │      receipt_id, extracted_item_id, user_id, ...              │
│        │    ) RETURNING item_id                                        │
│        │                                                               │
│        ├─── UPDATE extracted_items                                     │
│        │    SET status = 'confirmed'                                   │
│        │    WHERE id IN (...)                                          │
│        │                                                               │
│        ├─── UPDATE receipts                                            │
│        │    SET processing_status = 'confirmed',                       │
│        │        updated_at = NOW()                                     │
│        │    WHERE id = receipt_id                                      │
│        │                                                               │
│   COMMIT TRANSACTION                                                   │
│        │                                                               │
│        ▼                                                               │
│   {                                                                    │
│     success: true,                                                     │
│     createdItems: [{itemId}, ...],                                     │
│     receipt: {id, status: "confirmed"}                                 │
│   }                                                                    │
│        │                                                               │
│        ▼                                                               │
│   [Inventory Items Created] ──────────────────────────────┐           │
│                                                            │           │
└────────────────────────────────────────────────────────────┼───────────┘
                                                             │
┌────────────────────────────────────────────────────────────┼───────────┐
│ STAGE 9: POST-PROCESSING                                  │           │
├────────────────────────────────────────────────────────────┼───────────┤
│                                                            │           │
│   [Success Response] ◀─────────────────────────────────────┘           │
│        │                                                               │
│        ├─── Client: Navigate to inventory view                         │
│        │             Show success toast with item count                │
│        │             Cache invalidation (React Query)                  │
│        │                                                               │
│        ├─── Server (async):                                            │
│        │    • If user preference: Move image to archive                │
│        │      receipts-temp/ → receipts-archive/                       │
│        │                                                               │
│        │    • If user preference OFF: Delete image immediately         │
│        │      DELETE from receipts-temp/                               │
│        │                                                               │
│        │    • Log analytics event:                                     │
│        │      - receipt_confirmed                                      │
│        │      - items_count: N                                         │
│        │      - processing_time: Xs                                    │
│        │      - avg_confidence: 0.XX                                   │
│        │                                                               │
│        ▼                                                               │
│   [Complete] ──────────────────────────────────────────────┐          │
│                                                             │          │
└─────────────────────────────────────────────────────────────┼──────────┘
                                                              │
                                                              ▼
                                                     User views inventory
```

## Error Handling Flows

### OCR Failure Flow
```
[Image] → [OCR Processing]
             │
             ├─── Success (confidence > 0.3) ──→ [Continue to Parsing]
             │
             └─── Failure/Low Confidence
                   │
                   ├─── Show error message
                   │
                   ├─── Options:
                   │    1. Retry with different settings
                   │    2. Use server-side OCR (fallback)
                   │    3. Manual entry mode
                   │    4. Cancel and re-capture
                   │
                   └─── User selects option → [Appropriate flow]
```

### Network Failure Flow
```
[API Call] → [Network Request]
               │
               ├─── Success → [Continue]
               │
               └─── Failure (timeout/5xx/no connection)
                     │
                     ├─── Show retry dialog
                     │
                     ├─── Save draft locally (IndexedDB)
                     │
                     └─── Auto-retry with exponential backoff
                           │
                           ├─── Success → [Continue]
                           │
                           └─── Max retries → [Save locally, sync later]
```

### Validation Failure Flow
```
[User Confirmation] → [Validate Items]
                        │
                        ├─── All valid → [Create Inventory Items]
                        │
                        └─── Validation errors
                              │
                              ├─── Missing required fields (name, quantity)
                              ├─── Invalid values (negative quantity)
                              ├─── Duplicate items
                              │
                              ├─── Highlight errors in UI
                              │
                              └─── User corrects → [Re-validate]
```

## Data State Transitions

```
Receipt Status State Machine:

  [draft] ←─────── Initial creation (STAGE 6)
     │
     ├─── User edits ──→ [draft] (stays in draft)
     │
     ├─── User confirms ──→ [processing]
     │                          │
     │                          ├─── Success ──→ [confirmed]
     │                          │
     │                          └─── Error ──→ [failed]
     │
     └─── User deletes ──→ [deleted] (soft delete)

Extracted Item Status:

  [pending] ←─────── Initial extraction (STAGE 5)
     │
     ├─── User edits ──→ [edited]
     │
     ├─── User deletes ──→ [rejected]
     │
     └─── Confirmation ──→ [confirmed] (+ inventory item created)
```

## Performance Optimization Points

| Stage | Optimization | Impact |
|-------|-------------|---------|
| Stage 2 | Use Canvas API offscreen | 30% faster preprocessing |
| Stage 4 | Web Worker for OCR | Non-blocking UI |
| Stage 4 | Cache tesseract data | 2s faster cold start |
| Stage 5 | Memoize parsing regex | 15% faster parsing |
| Stage 6 | Batch insert items | 50% fewer DB queries |
| Stage 8 | Transaction for atomicity | Prevent partial saves |
| All | React Query caching | Instant UI updates |

## Data Volume Estimates

| Data Type | Size | Retention | Storage |
|-----------|------|-----------|---------|
| Image (original) | 2-5 MB | 24 hours | Temp bucket |
| Image (archived) | 0.5-1 MB | 90 days (opt-in) | Archive bucket |
| Receipt metadata | 1-2 KB | Indefinite | Database |
| Extracted items | 0.5-1 KB each | Indefinite | Database |
| OCR raw text | 2-10 KB | Indefinite (debug) | Database |

**Example**: 1000 users × 10 receipts/month × 2 MB = 20 GB/month temporary storage (auto-deleted after 24h)
