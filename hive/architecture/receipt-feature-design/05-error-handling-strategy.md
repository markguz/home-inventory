# Error Handling Strategy - Receipt Processing

## Error Handling Principles

1. **Fail Gracefully**: Never leave user in broken state
2. **Provide Context**: Clear error messages with actionable guidance
3. **Enable Recovery**: Always offer path forward (retry, manual entry, help)
4. **Preserve Data**: Auto-save drafts, prevent data loss
5. **Log for Analysis**: Track errors to improve system
6. **Degrade Gradually**: Fallback from automated to manual workflows

---

## Error Categories & Handling

### 1. Image Upload Errors

#### 1.1 Invalid File Type

**Error Code**: `INVALID_FILE_TYPE`

**Cause**: User uploads unsupported file format (PDF, HEIC, etc.)

**Detection**: Client-side file type validation before upload

**Handling**:
```typescript
try {
  await uploadImage(file);
} catch (error) {
  if (error.code === 'INVALID_FILE_TYPE') {
    showToast({
      type: 'error',
      title: 'Unsupported File Type',
      message: 'Please upload a JPEG or PNG image',
      action: {
        label: 'Try Again',
        onClick: () => triggerFileUpload()
      }
    });
  }
}
```

**Prevention**:
- Accept attribute: `<input accept="image/jpeg,image/png" />`
- Client-side validation before upload
- Server-side validation as backup

---

#### 1.2 File Too Large

**Error Code**: `FILE_TOO_LARGE`

**Cause**: Image exceeds 10 MB limit

**Detection**: Client-side size check

**Handling**:
```typescript
if (file.size > 10 * 1024 * 1024) {
  // Attempt client-side compression
  const compressed = await compressImage(file, {
    maxSizeMB: 2,
    maxWidthOrHeight: 1920
  });

  if (compressed.size > 10 * 1024 * 1024) {
    showError({
      title: 'Image Too Large',
      message: 'Unable to compress image below 10 MB. Try taking a new photo.',
      actions: ['Retake Photo', 'Cancel']
    });
  } else {
    await uploadImage(compressed);
  }
}
```

**Prevention**:
- Auto-compress images before upload
- Provide camera quality settings
- Show file size before upload

---

#### 1.3 Network Failure During Upload

**Error Code**: `UPLOAD_FAILED`

**Cause**: Network interruption, timeout, server error

**Detection**: Upload request timeout or HTTP error

**Handling**:
```typescript
const uploadWithRetry = async (file: File, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadImage(file);
    } catch (error) {
      if (attempt === maxRetries) {
        showError({
          title: 'Upload Failed',
          message: 'Unable to upload image after multiple attempts',
          actions: [
            { label: 'Try Again', onClick: () => uploadWithRetry(file) },
            { label: 'Save Locally', onClick: () => saveToIndexedDB(file) }
          ]
        });
        throw error;
      }
      await sleep(1000 * attempt); // Exponential backoff
    }
  }
};
```

**Recovery**:
- Auto-retry with exponential backoff (1s, 2s, 4s)
- Save to IndexedDB for later sync
- Show upload progress
- Allow manual retry

---

#### 1.4 Storage Quota Exceeded

**Error Code**: `QUOTA_EXCEEDED`

**Cause**: User has exceeded storage limit

**Detection**: API returns 507 Insufficient Storage

**Handling**:
```typescript
if (error.code === 'QUOTA_EXCEEDED') {
  showModal({
    title: 'Storage Limit Reached',
    message: 'You have reached your storage limit. Delete old receipts or upgrade your plan.',
    actions: [
      { label: 'View Receipts', onClick: () => navigateTo('/receipts') },
      { label: 'Upgrade Plan', onClick: () => navigateTo('/settings/billing') },
      { label: 'Continue Without Image', onClick: () => proceedWithoutImage() }
    ]
  });
}
```

**Prevention**:
- Show storage usage indicator
- Auto-delete expired images
- Compress archived images
- Prompt cleanup before uploads

---

### 2. OCR Processing Errors

#### 2.1 OCR Engine Initialization Failure

**Error Code**: `OCR_INIT_FAILED`

**Cause**: Tesseract.js fails to load (network, browser compatibility)

**Detection**: Worker initialization promise rejects

**Handling**:
```typescript
let ocrWorker: Tesseract.Worker | null = null;

const initOCR = async () => {
  try {
    ocrWorker = await Tesseract.createWorker('eng', 1, {
      cacheMethod: 'refresh' // Force reload if cached version is corrupt
    });
  } catch (error) {
    logger.error('OCR initialization failed', error);

    // Fallback to server-side OCR
    showNotification({
      type: 'warning',
      message: 'Using server-side processing due to browser limitations'
    });

    return { useServerSide: true };
  }
};
```

**Fallback**:
- Attempt server-side OCR API
- Offer manual entry mode
- Show browser compatibility warning

---

#### 2.2 No Text Detected

**Error Code**: `NO_TEXT_DETECTED`

**Cause**: Image too blurry, low contrast, or not a receipt

**Detection**: OCR returns empty text or confidence < 0.1

**Handling**:
```typescript
const result = await ocrWorker.recognize(image);

if (!result.data.text.trim() || result.data.confidence < 0.1) {
  showGuidance({
    title: 'Unable to Read Receipt',
    message: 'Please ensure the receipt is clear and well-lit',
    tips: [
      '✓ Use good lighting',
      '✓ Avoid shadows and glare',
      '✓ Keep camera steady',
      '✓ Ensure text is in focus'
    ],
    actions: [
      { label: 'Retake Photo', icon: 'camera' },
      { label: 'Upload Different Image', icon: 'upload' },
      { label: 'Enter Items Manually', icon: 'keyboard' }
    ]
  });
}
```

**Prevention**:
- Real-time camera preview with quality indicator
- Auto-focus and exposure adjustment
- Edge detection overlay
- Quality check before OCR

---

#### 2.3 Low Confidence Extraction

**Error Code**: `LOW_CONFIDENCE_EXTRACTION`

**Cause**: OCR succeeds but confidence scores are low (< 0.3)

**Detection**: Overall confidence score below threshold

**Handling**:
```typescript
if (overallConfidence < 0.3) {
  showWarning({
    title: 'Low Recognition Quality',
    message: 'We detected some text, but accuracy may be low. Please review carefully.',
    confidence: overallConfidence,
    actions: [
      {
        label: 'Review Items',
        onClick: () => proceedToReview({ highlightLowConfidence: true })
      },
      {
        label: 'Try Better Image',
        onClick: () => restartCapture()
      },
      {
        label: 'Use Server Processing',
        onClick: () => processOnServer()
      }
    ]
  });
}
```

**UX Enhancements**:
- Highlight low-confidence items in yellow/red
- Sort by confidence (low first) for review
- Show original image alongside for verification
- Enable easy editing

---

#### 2.4 OCR Processing Timeout

**Error Code**: `OCR_TIMEOUT`

**Cause**: Processing takes too long (> 30 seconds)

**Detection**: Processing promise timeout

**Handling**:
```typescript
const recognizeWithTimeout = async (image: ImageLike, timeoutMs = 30000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('OCR_TIMEOUT')), timeoutMs)
  );

  try {
    return await Promise.race([
      ocrWorker.recognize(image),
      timeoutPromise
    ]);
  } catch (error) {
    if (error.message === 'OCR_TIMEOUT') {
      showDialog({
        title: 'Processing Taking Longer Than Expected',
        message: 'This receipt may be complex or your device is busy.',
        actions: [
          { label: 'Keep Waiting', onClick: () => continueProcessing() },
          { label: 'Cancel & Retry', onClick: () => cancelAndRetry() },
          { label: 'Enter Manually', onClick: () => switchToManualEntry() }
        ]
      });
    }
    throw error;
  }
};
```

**Prevention**:
- Show progress indicator with percentage
- Use web worker to prevent UI blocking
- Optimize image resolution (1920px max width)
- Allow background processing

---

### 3. Parsing Errors

#### 3.1 No Items Detected

**Error Code**: `NO_ITEMS_PARSED`

**Cause**: OCR text doesn't match receipt patterns

**Detection**: Parser returns empty items array

**Handling**:
```typescript
if (parsedItems.length === 0) {
  showReviewScreen({
    rawText: ocrResult.text,
    message: 'Unable to automatically detect items. Please review and add manually.',
    suggestions: extractPossibleItems(ocrResult.text), // Basic pattern matching
    actions: [
      { label: 'Add Items Manually', onClick: () => openManualEntry() },
      { label: 'View OCR Text', onClick: () => showRawOCR() },
      { label: 'Try Different Image', onClick: () => restart() }
    ]
  });
}
```

**Graceful Degradation**:
- Show OCR text for manual parsing
- Provide item input form pre-filled with detected text
- Allow copy-paste from OCR text

---

#### 3.2 Malformed Data (Invalid Prices)

**Error Code**: `INVALID_PRICE_FORMAT`

**Cause**: Price parsing fails (e.g., "1O.99" instead of "10.99")

**Detection**: Price regex fails or produces invalid number

**Handling**:
```typescript
const parsePrice = (text: string): number | null => {
  try {
    // Clean common OCR errors
    const cleaned = text
      .replace(/[Oo]/g, '0') // O → 0
      .replace(/[Il]/g, '1')  // I/l → 1
      .replace(/[S$]/g, '5')  // S → 5
      .replace(/[^\d.]/g, ''); // Remove non-digits

    const price = parseFloat(cleaned);

    if (isNaN(price) || price < 0 || price > 99999) {
      return null; // Mark for review
    }

    return price;
  } catch {
    return null;
  }
};

// In item review UI
if (item.totalPrice === null) {
  markForReview(item, {
    field: 'totalPrice',
    reason: 'Unable to parse price',
    originalText: item.rawText,
    confidence: 0.0
  });
}
```

**UI Treatment**:
- Highlight invalid fields in red
- Show original OCR text for reference
- Pre-focus input for quick correction
- Provide common price suggestions

---

### 4. Validation Errors

#### 4.1 Missing Required Fields

**Error Code**: `VALIDATION_ERROR`

**Cause**: User tries to confirm items without required data

**Detection**: Client-side validation before API call

**Handling**:
```typescript
const validateBeforeConfirm = (items: ExtractedItem[]) => {
  const errors: ValidationError[] = [];

  items.forEach((item, index) => {
    if (!item.name?.trim()) {
      errors.push({
        itemIndex: index,
        field: 'name',
        message: 'Item name is required'
      });
    }

    if (!item.quantity || item.quantity < 1) {
      errors.push({
        itemIndex: index,
        field: 'quantity',
        message: 'Quantity must be at least 1'
      });
    }

    if (!item.categoryId) {
      errors.push({
        itemIndex: index,
        field: 'categoryId',
        message: 'Category is required'
      });
    }
  });

  if (errors.length > 0) {
    highlightErrors(errors);
    showToast({
      type: 'error',
      message: `Please fix ${errors.length} validation error(s) before continuing`
    });
    return false;
  }

  return true;
};
```

**Prevention**:
- Real-time validation as user edits
- Disable "Confirm" button until valid
- Show validation summary at top
- Auto-focus first error field

---

#### 4.2 Duplicate Items

**Error Code**: `DUPLICATE_ITEM`

**Cause**: User accidentally creates duplicate items

**Detection**: Check for matching name + category during confirmation

**Handling**:
```typescript
const checkDuplicates = async (items: InventoryItem[]) => {
  const existingItems = await fetchExistingItems();
  const duplicates: DuplicateMatch[] = [];

  items.forEach(item => {
    const match = existingItems.find(existing =>
      existing.name.toLowerCase() === item.name.toLowerCase() &&
      existing.categoryId === item.categoryId
    );

    if (match) {
      duplicates.push({ newItem: item, existingItem: match });
    }
  });

  if (duplicates.length > 0) {
    const action = await showDuplicateDialog({
      duplicates,
      options: [
        'Increase quantity of existing items',
        'Create as separate items',
        'Skip duplicate items'
      ]
    });

    return handleDuplicateResolution(action, duplicates);
  }
};
```

**User Options**:
- Merge with existing (increase quantity)
- Create as separate items
- Skip duplicates
- Review each individually

---

### 5. Network/API Errors

#### 5.1 Request Timeout

**Error Code**: `REQUEST_TIMEOUT`

**Cause**: API call exceeds timeout (30s)

**Detection**: Fetch timeout

**Handling**:
```typescript
const apiCallWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs = 30000
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      // Save draft locally
      await saveDraftLocally(options.body);

      showError({
        title: 'Request Timed Out',
        message: 'Your changes have been saved locally',
        actions: [
          { label: 'Retry Now', onClick: () => retry() },
          { label: 'Continue Offline', onClick: () => continueOffline() }
        ]
      });
    }
    throw error;
  }
};
```

**Recovery**:
- Auto-save to IndexedDB
- Retry with exponential backoff
- Allow offline mode
- Sync when online

---

#### 5.2 Server Error (5xx)

**Error Code**: `SERVER_ERROR`

**Cause**: Server-side failure

**Detection**: HTTP 500-599 response

**Handling**:
```typescript
if (response.status >= 500) {
  logger.error('Server error', {
    status: response.status,
    url: response.url,
    body: await response.text()
  });

  showError({
    title: 'Server Error',
    message: 'Something went wrong on our end. Please try again.',
    errorCode: `ERR_${response.status}`,
    actions: [
      { label: 'Retry', onClick: () => retry() },
      { label: 'Report Issue', onClick: () => reportBug() },
      { label: 'Save Locally', onClick: () => saveLocally() }
    ]
  });
}
```

**User Actions**:
- Auto-retry after delay
- Show error code for support
- Save locally for later sync
- Report bug with context

---

#### 5.3 Rate Limit Exceeded

**Error Code**: `RATE_LIMIT_EXCEEDED`

**Cause**: User exceeds API rate limits

**Detection**: HTTP 429 response

**Handling**:
```typescript
if (response.status === 429) {
  const retryAfter = response.headers.get('Retry-After');
  const waitSeconds = parseInt(retryAfter || '60');

  showWarning({
    title: 'Please Slow Down',
    message: `You've made too many requests. Please wait ${waitSeconds} seconds.`,
    countdown: waitSeconds,
    onComplete: () => enableRetry()
  });

  // Auto-retry after wait period
  setTimeout(() => {
    retry();
  }, waitSeconds * 1000);
}
```

**Prevention**:
- Client-side rate limiting
- Batch operations when possible
- Show rate limit status
- Queue requests locally

---

### 6. Database Errors

#### 6.1 Transaction Failure

**Error Code**: `TRANSACTION_FAILED`

**Cause**: Database constraint violation, deadlock

**Detection**: API returns 500 with transaction error

**Handling**:
```typescript
try {
  await confirmReceipt(receiptId, items);
} catch (error) {
  if (error.code === 'TRANSACTION_FAILED') {
    logger.error('Transaction failed', { receiptId, items, error });

    // Rollback is automatic, but verify state
    const receiptState = await fetchReceipt(receiptId);

    if (receiptState.processingStatus === 'draft') {
      showError({
        title: 'Unable to Complete',
        message: 'Your items were not added. Please try again.',
        actions: [
          { label: 'Retry', onClick: () => retryConfirmation() },
          { label: 'Review Items', onClick: () => backToReview() }
        ]
      });
    }
  }
}
```

**Data Integrity**:
- Transactions ensure all-or-nothing
- Verify state after errors
- Never leave partial data
- Log for debugging

---

#### 6.2 Foreign Key Violation

**Error Code**: `FOREIGN_KEY_VIOLATION`

**Cause**: Referenced category/location doesn't exist

**Detection**: Database constraint error

**Handling**:
```typescript
if (error.code === '23503') { // PostgreSQL FK violation
  const invalidRefs = parseInvalidReferences(error.detail);

  showError({
    title: 'Invalid References',
    message: 'Some categories or locations no longer exist',
    details: invalidRefs,
    actions: [
      { label: 'Fix References', onClick: () => showReferenceFixer(invalidRefs) },
      { label: 'Cancel', onClick: () => cancel() }
    ]
  });
}
```

**Prevention**:
- Validate references before submission
- Refresh category/location lists periodically
- Handle deleted entities gracefully

---

## Error Logging & Monitoring

### Client-Side Logging

```typescript
const logger = {
  error: (message: string, context: any) => {
    console.error(message, context);

    // Send to analytics
    analytics.track('error_occurred', {
      message,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    });

    // Store locally for debugging
    storeErrorLog({ message, context, timestamp: Date.now() });
  }
};
```

### Error Metrics to Track

1. **OCR Success Rate**: % of receipts with confidence > 0.5
2. **Processing Time**: P50, P95, P99 latencies
3. **Error Rates by Type**: Group by error code
4. **Retry Success Rate**: % of retries that succeed
5. **Fallback Usage**: % using manual entry vs. server OCR
6. **User Abandonment**: % who cancel after errors

### Alerting Thresholds

```typescript
const alerts = {
  OCR_FAILURE_RATE: 0.15, // Alert if > 15% fail
  API_ERROR_RATE: 0.05,   // Alert if > 5% fail
  AVG_PROCESSING_TIME: 15000, // Alert if > 15s
  RATE_LIMIT_HITS: 100    // Alert if > 100/hour
};
```

---

## User-Facing Error Messages

### Best Practices

1. **Be Specific**: "Unable to read receipt text" not "OCR failed"
2. **Provide Context**: Explain why error occurred
3. **Offer Solutions**: Always give 2-3 action options
4. **Be Empathetic**: "We're sorry" for system errors
5. **Use Plain Language**: No technical jargon
6. **Show Progress**: If retrying, show status

### Error Message Template

```typescript
interface ErrorDisplay {
  title: string;          // Short, clear headline
  message: string;        // Explanation with context
  severity: 'error' | 'warning' | 'info';
  icon?: string;
  actions: Action[];      // 1-3 actionable options
  dismissible: boolean;
  helpLink?: string;      // Link to docs/support
  errorCode?: string;     // For support reference
}
```

---

## Graceful Degradation Path

```
┌─────────────────────┐
│ Full Automation     │ Client-side OCR + parsing
└──────────┬──────────┘
           │ (if fails)
           ▼
┌─────────────────────┐
│ Server-Side OCR     │ Better accuracy, costs server resources
└──────────┬──────────┘
           │ (if fails or unavailable)
           ▼
┌─────────────────────┐
│ OCR + Manual Review │ Show OCR text, user extracts items
└──────────┬──────────┘
           │ (if OCR fails)
           ▼
┌─────────────────────┐
│ Fully Manual Entry  │ User types items while viewing image
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Items Added         │ Success!
└─────────────────────┘
```

Always ensure users can accomplish their goal, even if automation fails.
