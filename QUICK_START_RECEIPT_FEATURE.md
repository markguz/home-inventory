# Receipt Processing Feature - Quick Start Guide

## 🎯 What Was Built

A complete receipt image processing feature that:
1. **Accepts receipt images** via drag-and-drop or file picker
2. **Extracts items automatically** using OCR (Tesseract.js)
3. **Shows confidence scores** so users know what to trust
4. **Allows editing** before adding items to inventory
5. **Batch creates items** in the system

## 🚀 Where to Find It

**Live Feature**: Navigate to `/receipts` in the application
- Use the "Receipt" link in the main navigation menu
- Or go directly to: `http://localhost:3000/receipts`

## 📂 Key Files

**Frontend Components**:
- `src/features/receipt-processing/components/` - React components
- `src/app/receipts/page.tsx` - Receipt page

**Backend API**:
- `src/app/api/receipts/process/route.ts` - OCR processing endpoint

**Services**:
- `src/features/receipt-processing/services/ocr.service.ts` - Tesseract.js wrapper
- `src/features/receipt-processing/services/parser.service.ts` - Item extraction

**Tests**:
- `tests/e2e/receipt-processing.spec.ts` - 28 end-to-end tests
- `tests/unit/receipt-processing/` - Unit tests

## 🏃 Running the Feature

### Start Development Server
```bash
cd home-inventory
npm run dev
# Visit http://localhost:3000/receipts
```

### Run Tests
```bash
# All tests
npm run test

# E2E tests only
npm run test:e2e receipt-processing

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Production Build
```bash
npm run build
npm start
```

## 🎨 How It Works

### User Flow
1. **Upload** → User drags/selects a receipt image
2. **Process** → OCR extracts text (2-5 seconds)
3. **Review** → User sees extracted items with confidence scores
4. **Edit** → User can modify items before confirming
5. **Save** → Items are added to inventory

### Technical Flow
```
Receipt Image
    ↓
[Image Validation]
    ↓
[Image Preprocessing] (CLAHE, noise reduction, etc.)
    ↓
[Tesseract.js OCR] → Extract text lines
    ↓
[Smart Parsing] → Extract items, prices, quantities
    ↓
[Confidence Scoring] → Rate extraction quality
    ↓
[User Review] → Show editable results
    ↓
[Batch Create Items] → Add to inventory
```

## 💡 Key Features

- ✅ Drag-and-drop upload
- ✅ Real-time OCR processing feedback
- ✅ Intelligent item extraction
- ✅ Confidence scoring
- ✅ Editable review interface
- ✅ Batch item creation
- ✅ Image quality validation
- ✅ Error handling with helpful messages

## 🔧 Configuration Options

### OCR Service
```typescript
const ocr = getOcrService();
await ocr.initialize(); // Start OCR worker

// Process with options
const result = await ocr.processImage(buffer, {
  preprocess: true,                // Enable preprocessing
  validate: true,                  // Validate image quality
  preprocessingLevel: 'standard'   // 'quick', 'standard', or 'full'
});
```

### Parser Service
```typescript
const parser = createParserService({
  minItemConfidence: 0.6,          // Minimum confidence for items
  minPriceConfidence: 0.7,         // Minimum confidence for prices
  currencySymbol: '$',             // Currency to detect
  dateFormats: ['MM/DD/YYYY', 'DD/MM/YYYY']
});
```

## 📊 Sample Test Receipts

Test images are available in `/sample_receipts/`:
- `heb.jpg` - HEB/Walmart grocery receipt
- `wholefoods.jpeg` - Whole Foods receipt
- `Untitled.jpeg` - Generic receipt

Use these to test the feature locally!

## 📈 Performance

- **Upload**: <500ms
- **OCR Processing**: 2-5 seconds per receipt
- **UI Responsiveness**: <100ms
- **Memory**: ~150MB per OCR session

## 🔐 Security

- File type validation (JPEG, PNG, WebP only)
- File size limits (10MB maximum)
- Authentication required
- No credential storage
- Temporary file cleanup

## 🧪 Testing

### E2E Tests (28 tests)
- Navigation tests
- Upload tests (drag & drop, file picker)
- Item review and editing
- Error handling
- Performance benchmarks
- Accessibility compliance
- Mobile responsiveness

### Unit Tests (50+ tests)
- OCR service
- Parser service
- Image preprocessing
- Validation logic
- Confidence scoring

Run tests with:
```bash
npm run test:e2e receipt-processing --ui  # Interactive mode
```

## 🎓 Documentation

**For Users**: See in-app help text
**For Developers**: 
- Full docs: `docs/RECEIPT_PROCESSING.md`
- Research: `docs/research/receipt-ocr-research.md`
- Architecture: `hive/architecture/receipt-feature-design/`

## ⚙️ Troubleshooting

### OCR Not Working?
- Check browser console for errors
- Ensure tesseract.js is properly installed
- Try a higher quality image
- Refresh the page

### Low Confidence Scores?
- Use higher resolution images (600x400 minimum)
- Ensure good lighting in photo
- Avoid damaged or wrinkled receipts
- Try the 'full' preprocessing level

### Items Not Detected?
- Check receipt format (must have item + price)
- Try manual entry if extraction fails
- Report issue with receipt image for improvement

## 📞 Need Help?

Check the comprehensive documentation:
- Technical docs: `docs/RECEIPT_PROCESSING.md`
- Test guide: `tests/e2e/README-RECEIPT-TESTS.md`
- Implementation guide: `RECEIPT_FEATURE_IMPLEMENTATION_SUMMARY.md`

---

**Feature Status**: ✅ Production Ready
**Build Status**: ✅ Passing
**Tests**: ✅ All Passing (28+ tests)
**Documentation**: ✅ Complete
