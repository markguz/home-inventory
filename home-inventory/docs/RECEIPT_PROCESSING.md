# Receipt Processing Feature

## Overview

The receipt processing feature allows users to upload receipt images and automatically extract items to add to their inventory. It uses OCR (Optical Character Recognition) with Tesseract.js to read receipt text and intelligent parsing to extract item names, prices, and quantities.

## Architecture

### Components

```
src/features/receipt-processing/
├── components/
│   ├── ReceiptUpload.tsx          # File upload with drag-drop
│   ├── ReceiptItemsReview.tsx     # Review and edit extracted items
│   ├── ReceiptProcessor.tsx       # Main orchestration component
│   └── index.ts                   # Barrel export
├── services/
│   ├── ocr.service.ts             # Tesseract.js wrapper for OCR
│   └── parser.service.ts          # Receipt text parsing logic
├── types/
│   └── index.ts                   # TypeScript type definitions
└── utils/
    └── validation.ts              # File and data validation
```

### API Endpoints

- **POST /api/receipts/process**
  - Accepts: multipart/form-data with image file
  - Returns: Parsed receipt with extracted items
  - Authentication: Required (user session)

## Usage

### 1. Import the Component

```tsx
import { ReceiptProcessor } from '@/features/receipt-processing/components';

export default function ReceiptPage() {
  return <ReceiptProcessor />;
}
```

### 2. Upload a Receipt

Users can:
- Drag and drop a receipt image (JPEG, PNG, WebP)
- Click to select a file from their device
- Maximum file size: 10MB

### 3. Review Extracted Items

The system automatically extracts:
- Item names
- Prices
- Quantities
- Merchant name (if available)
- Receipt date (if available)
- Total, subtotal, and tax amounts

Users can:
- Edit item names and prices
- Adjust quantities
- Remove unwanted items
- View confidence scores for each extraction

### 4. Add to Inventory

Once confirmed, items are ready to be added to the inventory system.

## Technical Details

### OCR Processing

The OCR service uses Tesseract.js with the following characteristics:
- Language: English (eng)
- Confidence scoring: 0-1 scale
- Line-by-line text extraction
- Bounding box coordinates (optional)

### Parsing Logic

The parser service identifies items using:

1. **Price Pattern Matching**
   - Detects: `$12.99`, `12.99`, `$12`, etc.
   - Handles comma and period decimal separators

2. **Quantity Detection**
   - Pattern: `3 x Item Name`
   - Defaults to quantity 1 if not specified

3. **Metadata Extraction**
   - Merchant: Usually in first few lines
   - Date: Multiple format support (MM/DD/YYYY, etc.)
   - Totals: Subtotal, tax, and grand total

4. **Confidence Filtering**
   - Minimum item confidence: 0.6
   - Minimum price confidence: 0.7
   - Overall confidence calculated from:
     - OCR confidence (40%)
     - Item extraction rate (30%)
     - Average item confidence (30%)

### Validation

**File Upload**
- Size limit: 10MB
- Supported types: JPEG, PNG, WebP
- Client-side and server-side validation

**Extracted Items**
- Name: 1-200 characters
- Price: Numeric, nullable
- Quantity: Positive integer
- Confidence: 0-1 range

## Configuration

### Parser Configuration

```typescript
const config = {
  minItemConfidence: 0.6,      // Minimum OCR confidence for items
  minPriceConfidence: 0.7,     // Minimum confidence for prices
  currencySymbol: '$',         // Expected currency symbol
  dateFormats: [               // Supported date formats
    'MM/DD/YYYY',
    'DD/MM/YYYY',
    'YYYY-MM-DD'
  ]
};
```

## Testing

### Unit Tests

```bash
npm run test:unit
```

Tests cover:
- Receipt parser logic
- Item extraction
- Price and quantity parsing
- Confidence calculation
- Validation utilities

### Integration Tests

```bash
npm run test:integration
```

Tests cover:
- API endpoint authentication
- File upload validation
- Error handling
- Response format

## Error Handling

The feature handles the following error cases:

1. **File Upload Errors**
   - Invalid file type
   - Oversized file
   - Missing file

2. **OCR Errors**
   - Initialization failure
   - Processing failure
   - Low quality images

3. **Parsing Errors**
   - No items detected
   - Low confidence results
   - Invalid data formats

## Performance Considerations

1. **OCR Worker Singleton**
   - Worker initialized once and reused
   - Reduces initialization overhead
   - Memory efficient for multiple requests

2. **File Size Limits**
   - 10MB limit prevents memory issues
   - Balances quality vs. processing time

3. **Confidence Thresholds**
   - Filters low-quality extractions
   - Reduces manual review time
   - Improves data accuracy

## Future Enhancements

1. **Auto-categorization**
   - ML-based category prediction
   - Learn from user corrections

2. **Batch Processing**
   - Process multiple receipts at once
   - Background job queue

3. **Receipt History**
   - Store parsed receipts
   - Track processing accuracy
   - Analytics and insights

4. **Multi-language Support**
   - Additional Tesseract language packs
   - Configurable per user

5. **Mobile Optimization**
   - Camera capture integration
   - Real-time preview
   - Optimized for mobile networks

## Troubleshooting

### Low Accuracy

If OCR accuracy is low:
- Ensure good lighting when photographing receipts
- Avoid wrinkled or damaged receipts
- Use higher resolution images
- Check that text is clearly legible

### Performance Issues

If processing is slow:
- Reduce image size before upload
- Ensure stable network connection
- Check server resources

### Items Not Detected

If items aren't being extracted:
- Verify receipt format is standard (item, price pattern)
- Check confidence thresholds in configuration
- Review parser logic for receipt type

## Dependencies

- **tesseract.js**: ^6.0.1 - OCR engine
- **@paralleldrive/cuid2**: ^2.2.2 - Unique ID generation
- **zod**: ^4.1.12 - Schema validation

## API Reference

See `/src/features/receipt-processing/types/index.ts` for complete TypeScript type definitions.

## Contributing

When contributing to the receipt processing feature:

1. Maintain TypeScript type safety
2. Add tests for new functionality
3. Update documentation
4. Follow existing code patterns
5. Consider edge cases (unusual receipt formats)

## License

Same as parent project.
