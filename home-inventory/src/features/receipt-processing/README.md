# Receipt Processing Feature

## Quick Start

### Installation

The feature uses tesseract.js for OCR. It's already installed in the project dependencies.

```bash
npm install tesseract.js
```

### Basic Usage

```tsx
import { ReceiptProcessor } from '@/features/receipt-processing/components';

export default function ReceiptPage() {
  return (
    <div>
      <ReceiptProcessor />
    </div>
  );
}
```

## Features

✅ **Drag-and-drop file upload**
✅ **OCR processing with Tesseract.js**
✅ **Intelligent receipt parsing**
✅ **Item name, price, and quantity extraction**
✅ **Confidence scoring**
✅ **Editable review interface**
✅ **Type-safe with TypeScript**
✅ **Comprehensive test coverage**

## File Structure

```
receipt-processing/
├── components/          # React components
│   ├── ReceiptUpload.tsx
│   ├── ReceiptItemsReview.tsx
│   ├── ReceiptProcessor.tsx
│   └── index.ts
├── services/           # Business logic
│   ├── ocr.service.ts
│   └── parser.service.ts
├── types/              # TypeScript types
│   └── index.ts
├── utils/              # Utilities
│   └── validation.ts
└── README.md           # This file
```

## API Usage

### OCR Service

```typescript
import { getOcrService } from '@/features/receipt-processing/services/ocr.service';

const ocrService = getOcrService();
await ocrService.initialize();
const lines = await ocrService.processImage(imageBuffer);
```

### Parser Service

```typescript
import { createParserService } from '@/features/receipt-processing/services/parser.service';

const parser = createParserService();
const receipt = parser.parseReceipt(ocrLines);
console.log(receipt.items); // Extracted items
```

## Configuration

### Parser Options

```typescript
const parser = createParserService({
  minItemConfidence: 0.6,
  minPriceConfidence: 0.7,
  currencySymbol: '$',
  dateFormats: ['MM/DD/YYYY', 'DD/MM/YYYY']
});
```

## Testing

Run unit tests:
```bash
npm run test:unit
```

Run integration tests:
```bash
npm run test:integration
```

## Examples

### Custom Upload Handler

```typescript
import { ReceiptUpload } from '@/features/receipt-processing/components';

function MyComponent() {
  const handleReceipt = (parsedReceipt) => {
    console.log('Items:', parsedReceipt.items);
    console.log('Total:', parsedReceipt.total);
    console.log('Confidence:', parsedReceipt.confidence);
  };

  return <ReceiptUpload onReceiptProcessed={handleReceipt} />;
}
```

### Manual Processing

```typescript
import { getOcrService } from '@/features/receipt-processing/services/ocr.service';
import { createParserService } from '@/features/receipt-processing/services/parser.service';

async function processReceiptManually(imageBuffer: Buffer) {
  const ocr = getOcrService();
  await ocr.initialize();

  const lines = await ocr.processImage(imageBuffer);
  const parser = createParserService();
  const receipt = parser.parseReceipt(lines);

  return receipt;
}
```

## Troubleshooting

### OCR Not Working

- Ensure tesseract.js is properly installed
- Check image quality and resolution
- Verify image format (JPEG, PNG, WebP)

### Low Confidence Scores

- Use higher resolution images
- Ensure good lighting
- Avoid damaged or wrinkled receipts

### Items Not Detected

- Check receipt format (standard item + price layout)
- Adjust confidence thresholds
- Review parser configuration

## Performance Tips

1. **Singleton Pattern**: OCR worker is reused across requests
2. **File Size**: Keep images under 5MB for best performance
3. **Image Quality**: Balance quality vs. file size

## Contributing

Please read the main [RECEIPT_PROCESSING.md](/docs/RECEIPT_PROCESSING.md) documentation for detailed information about the architecture and contribution guidelines.

## License

Same as parent project.
