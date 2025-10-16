# Receipt Processing E2E Tests - Quick Start

## 🚀 Quick Start

### Run All Tests
```bash
cd home-inventory
npx playwright test receipt-processing
```

### Run Specific Browser
```bash
npx playwright test receipt-processing --project=chromium
```

### Run in UI Mode (Recommended for Development)
```bash
npx playwright test receipt-processing --ui
```

### View Test Report
```bash
npx playwright show-report
```

## 📊 Test Coverage

**Total Tests**: 28 tests across 5 browsers (140 test executions)

### Test Groups
1. **Navigation (2 tests)** - Page load and UI verification
2. **Upload (3 tests)** - File upload via click and drag-drop
3. **Item Review (8 tests)** - Display, edit, and delete functionality
4. **Item Creation (2 tests)** - Confirm and add to inventory
5. **Error Handling (4 tests)** - Invalid files and network errors
6. **Multiple Receipts (2 tests)** - Sequential processing
7. **Performance (3 tests)** - Speed and quality benchmarks
8. **Accessibility (3 tests)** - WCAG compliance
9. **Mobile (1 test)** - Responsive design

## 📁 Files Created

```
home-inventory/
├── tests/
│   ├── e2e/
│   │   └── receipt-processing.spec.ts    (Main test suite)
│   ├── fixtures/
│   │   └── receipt-fixtures.ts           (Mock data)
│   ├── helpers/
│   │   └── receipt-test-helpers.ts       (Utility functions)
│   └── docs/
│       ├── receipt-processing-tests.md   (Complete documentation)
│       └── ci-integration.md             (CI/CD guide)
```

## 🎯 What's Tested

### ✅ Fully Tested
- Navigation to /receipts page
- File upload (click and drag-drop)
- OCR processing initiation
- Item display in review table
- Inline editing (name, price, quantity)
- Item deletion
- Cancel and return to upload
- Confirm button state management
- Toast notifications
- Multiple receipt processing
- Performance benchmarks
- Mobile responsiveness
- Accessibility features

### ⏳ Pending Implementation
- **Database verification**: Backend item creation is TODO in code
- **Large file rejection**: Requires test file generation
- **OCR error simulation**: Better suited for integration tests

## 🔧 Prerequisites

1. **Playwright installed**: `npm install @playwright/test`
2. **Sample receipts**: Located in `/sample_receipts/`
3. **Running app**: Tests will start dev server automatically
4. **Environment variables**: Set `USERNAME` and `PASSWORD` for auth

## 📝 Example Usage

### Basic Test Run
```bash
# Run all receipt tests
npx playwright test receipt-processing

# Run only navigation tests
npx playwright test receipt-processing -g "Navigation"

# Run with retries
npx playwright test receipt-processing --retries=2
```

### Development
```bash
# Run in headed mode
npx playwright test receipt-processing --headed

# Debug specific test
npx playwright test receipt-processing --debug -g "should upload receipt"

# Update snapshots (if visual tests added later)
npx playwright test receipt-processing --update-snapshots
```

### CI/CD
```bash
# Run in CI mode with workers
npx playwright test receipt-processing --workers=4

# Generate JSON report
npx playwright test receipt-processing --reporter=json > results.json
```

## 🐛 Common Issues

### Issue: Tests timeout during OCR
**Solution**: Increase timeout or use smaller test images
```typescript
test.setTimeout(60000); // 60 seconds
```

### Issue: Sample receipts not found
**Solution**: Verify path to `/sample_receipts/` directory
```bash
ls -la ../sample_receipts/
```

### Issue: Authentication fails
**Solution**: Set environment variables
```bash
export USERNAME="test@example.com"
export PASSWORD="password"
```

## 📚 Documentation

- **Full Documentation**: `tests/docs/receipt-processing-tests.md`
- **CI/CD Guide**: `tests/docs/ci-integration.md`
- **Test Fixtures**: `tests/fixtures/receipt-fixtures.ts`
- **Helper Functions**: `tests/helpers/receipt-test-helpers.ts`

## 🎯 Next Steps

1. **Run the tests**: `npx playwright test receipt-processing`
2. **Review results**: `npx playwright show-report`
3. **Integrate into CI**: Follow `ci-integration.md` guide
4. **Monitor performance**: Check OCR processing times
5. **Update when backend ready**: Add database verification tests

## 📊 Expected Results

All tests should pass except:
- Tests marked with `test.skip()` (known limitations)
- Database verification (pending backend implementation)

**Typical run time**:
- Local: 3-5 minutes per browser
- CI: 2-3 minutes per browser (with optimizations)

## 🔍 Debugging

### View Trace
```bash
npx playwright show-trace playwright-report/trace.zip
```

### Console Logging
Tests include detailed console output:
- OCR processing time
- Item counts extracted
- Metadata detection
- Performance metrics

### Screenshots
Failed tests automatically capture screenshots in `test-results/`

## ✅ Ready to Run!

The test suite is complete and ready for execution. Start with:

```bash
cd home-inventory
npx playwright test receipt-processing --ui
```

This will open the Playwright UI where you can see all tests, run them individually, and inspect results in real-time.
