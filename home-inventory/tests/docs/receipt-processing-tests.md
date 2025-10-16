# Receipt Processing E2E Tests

Comprehensive end-to-end test suite for the receipt processing workflow.

## 📋 Overview

This test suite validates the complete user journey from uploading a receipt image through OCR processing, item review, editing, and finally adding items to the inventory.

## 🎯 Test Coverage

### 1. Navigation Tests
- ✅ Navigate to `/receipts` page
- ✅ Verify page loads with upload area
- ✅ Check for breadcrumb navigation (if implemented)
- ✅ Verify all UI elements are present

### 2. Upload Tests
- ✅ Upload via file input (click to select)
- ✅ Upload via drag-and-drop
- ✅ Display file name after selection
- ✅ Show processing state with loader
- ✅ Handle upload success

### 3. Item Review Tests
- ✅ Display extracted items in table format
- ✅ Show all fields (name, price, quantity, confidence)
- ✅ Display confidence badges (High/Medium/Low)
- ✅ Edit item name inline
- ✅ Edit item price
- ✅ Edit item quantity
- ✅ Delete individual items
- ✅ Disable confirm button when no items
- ✅ Cancel review and return to upload
- ✅ Display receipt metadata (merchant, date, total)

### 4. Item Creation Tests
- ✅ Confirm items to add to inventory
- ✅ Show "Creating items..." state
- ✅ Display success toast notification
- ✅ Redirect to items page
- ⏳ **TODO**: Verify items created in database (pending implementation)

### 5. Error Handling Tests
- ✅ Reject invalid file types (HTML5 validation)
- ⏳ Reject files over 10MB limit
- ⏳ Handle OCR processing errors
- ✅ Handle network errors during upload
- ✅ Display appropriate error messages

### 6. Multiple Receipts Tests
- ✅ Process multiple receipts sequentially
- ✅ Reset state between receipts
- ✅ Verify independent processing

### 7. Performance & Quality Tests
- ✅ Complete OCR within 30 seconds
- ✅ Display confidence scores
- ✅ Extract reasonable number of items (1-100)
- ✅ Measure processing time

### 8. Accessibility Tests
- ✅ Accessible upload area
- ✅ Proper input types and attributes
- ✅ Accessible buttons with labels
- ✅ Keyboard navigation support

### 9. Mobile Tests
- ✅ Responsive layout on mobile viewport
- ✅ Touch-friendly controls
- ✅ Scrollable/stackable table layout

## 📁 Test Files

### Main Test Suite
- **`tests/e2e/receipt-processing.spec.ts`**
  - Complete E2E test suite
  - 30+ test scenarios
  - Mobile-specific tests
  - Performance benchmarks

### Test Fixtures
- **`tests/fixtures/receipt-fixtures.ts`**
  - Mock OCR data
  - Mock extracted items
  - Mock parsed receipts
  - Helper functions for test data generation

### Test Helpers
- **`tests/helpers/receipt-test-helpers.ts`**
  - API mocking utilities
  - File upload helpers
  - Item editing helpers
  - Performance measurement tools
  - Toast notification helpers

## 🚀 Running Tests

### Run All Receipt Processing Tests
```bash
cd home-inventory
npx playwright test receipt-processing
```

### Run Specific Test Group
```bash
# Navigation tests only
npx playwright test receipt-processing -g "Navigation Test"

# Upload tests only
npx playwright test receipt-processing -g "Upload Test"

# Review tests only
npx playwright test receipt-processing -g "Item Review Test"
```

### Run Mobile Tests
```bash
npx playwright test receipt-processing -g "Mobile"
```

### Run with UI Mode
```bash
npx playwright test receipt-processing --ui
```

### Debug Mode
```bash
npx playwright test receipt-processing --debug
```

### Run in Specific Browser
```bash
# Chrome only
npx playwright test receipt-processing --project=chromium

# Firefox only
npx playwright test receipt-processing --project=firefox

# All browsers
npx playwright test receipt-processing --project=chromium --project=firefox --project=webkit
```

## 📊 Test Results

### View HTML Report
```bash
npx playwright show-report
```

### View Traces (for failed tests)
```bash
npx playwright show-trace playwright-report/trace.zip
```

## 🧪 Test Data

### Sample Receipts
Located in `/sample_receipts/`:
- `heb.jpg` - H-E-B grocery receipt
- `wholefoods.jpeg` - Whole Foods receipt
- `Untitled.jpeg` - Generic receipt

### Mock Data
Available in `tests/fixtures/receipt-fixtures.ts`:
- `mockOcrLines` - Sample OCR output
- `mockExtractedItems` - Sample parsed items
- `mockParsedReceipt` - Complete receipt data
- `mockLowConfidenceReceipt` - Low-quality receipt
- `mockLargeReceipt` - Receipt with 25+ items

## 🎭 Helper Functions

### Toast Helpers
```typescript
import { waitForToast } from '../helpers/receipt-test-helpers';

await waitForToast(page, 'Found', 30000);
```

### Upload Helpers
```typescript
import { uploadReceiptFile, waitForProcessingComplete } from '../helpers/receipt-test-helpers';

await uploadReceiptFile(page, RECEIPT_HEB);
await waitForProcessingComplete(page);
```

### Item Editing
```typescript
import { editItemName, editItemPrice, deleteItem } from '../helpers/receipt-test-helpers';

await editItemName(page, 0, 'New Item Name');
await editItemPrice(page, 0, '12.99');
await deleteItem(page, 0);
```

### API Mocking
```typescript
import { mockSuccessfulProcessing, mockFailedProcessing } from '../helpers/receipt-test-helpers';
import { mockParsedReceipt } from '../fixtures/receipt-fixtures';

// Mock successful processing
await mockSuccessfulProcessing(page, mockParsedReceipt);

// Mock failure
await mockFailedProcessing(page, 'OCR processing failed');
```

## 🔍 Debugging Tips

### 1. Slow Down Tests
```typescript
test.use({
  launchOptions: { slowMo: 500 }
});
```

### 2. Take Screenshots
```typescript
await page.screenshot({ path: 'debug-screenshot.png' });
```

### 3. Pause Execution
```typescript
await page.pause();
```

### 4. Console Logging
Check browser console in test:
```typescript
page.on('console', msg => console.log(msg.text()));
```

### 5. Network Logging
Monitor API calls:
```typescript
page.on('request', request =>
  console.log('>>', request.method(), request.url())
);
page.on('response', response =>
  console.log('<<', response.status(), response.url())
);
```

## 📝 Test Scenarios Detail

### Scenario 1: Happy Path
1. Login to application
2. Navigate to `/receipts`
3. Upload receipt image
4. Wait for OCR processing (up to 30s)
5. Review extracted items
6. Edit item details if needed
7. Confirm and add to inventory
8. Verify redirect to items page
9. **TODO**: Verify items appear in database

### Scenario 2: Edit and Delete Flow
1. Upload receipt
2. Edit multiple item names
3. Adjust prices and quantities
4. Delete unwanted items
5. Confirm remaining items

### Scenario 3: Error Recovery
1. Upload receipt
2. Simulate network error
3. Verify error message
4. Retry upload
5. Verify success

### Scenario 4: Multiple Receipts
1. Process first receipt
2. Add items to inventory
3. Return to upload page
4. Process second receipt
5. Verify independent processing

## 🎯 Performance Benchmarks

### Expected Performance
- **OCR Processing**: < 30 seconds
- **Page Load**: < 3 seconds
- **UI Responsiveness**: < 100ms
- **Toast Notifications**: < 500ms to appear

### Measured Metrics
The test suite includes performance measurement:
```typescript
const { duration, itemCount } = await measureProcessingTime(page, receiptPath);
console.log(`Processed ${itemCount} items in ${duration}ms`);
```

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Item Creation**: Backend implementation is TODO
   - Tests verify UI flow
   - Database verification pending
   - Items currently not saved to database

2. **OCR Accuracy**: Varies by receipt quality
   - Low-quality images may fail
   - Some metadata may not extract
   - Price parsing can be inconsistent

3. **Test File Sizes**: Large receipt images increase test time
   - HEB receipt: ~58KB, ~10-15s processing
   - Consider smaller test images for faster CI

### Workarounds
- Use mock API responses for faster unit tests
- Skip slow tests in development with `test.skip()`
- Use smaller receipt images for CI pipeline

## 🔄 CI/CD Integration

### GitHub Actions Configuration
```yaml
- name: Run Receipt Processing E2E Tests
  run: |
    cd home-inventory
    npx playwright test receipt-processing
  env:
    BASE_URL: http://localhost:3000
    USERNAME: ${{ secrets.TEST_USERNAME }}
    PASSWORD: ${{ secrets.TEST_PASSWORD }}
```

### Test Artifacts
- HTML report generated in `playwright-report/`
- Screenshots on failure in `test-results/`
- Video recordings (if enabled)
- Trace files for debugging

## 📦 Dependencies

### Required
- `@playwright/test@1.56.0` - Test framework
- Sample receipt images in `/sample_receipts/`
- Running Next.js dev server on port 3000
- Test user credentials in environment variables

### Optional
- Database seed data for item verification
- Mock service worker for API testing
- Visual regression testing tools

## 🎓 Best Practices

### 1. Use Descriptive Test Names
✅ Good: `should display extracted items with all fields`
❌ Bad: `test items`

### 2. Isolate Tests
- Each test should be independent
- Use `beforeEach` for setup
- Clean up after tests

### 3. Use Page Object Model (Future Enhancement)
Consider extracting page interactions:
```typescript
class ReceiptPage {
  async uploadReceipt(filePath: string) { ... }
  async waitForProcessing() { ... }
  async getItemCount() { ... }
}
```

### 4. Handle Async Operations
- Always await page interactions
- Use proper timeouts for OCR
- Handle race conditions

### 5. Meaningful Assertions
```typescript
// ✅ Good
await expect(page.locator('text=Review Receipt Items')).toBeVisible();

// ❌ Bad
expect(await page.locator('h2').textContent()).toBe('Review Receipt Items');
```

## 🚧 Future Enhancements

### Short Term
- [ ] Add database verification tests
- [ ] Implement batch upload tests
- [ ] Add visual regression tests
- [ ] Create page object models
- [ ] Add API integration tests

### Long Term
- [ ] Load testing with many receipts
- [ ] Cross-browser compatibility suite
- [ ] Automated screenshot comparison
- [ ] Performance regression detection
- [ ] Multi-user concurrent testing

## 📞 Support

### Issues & Questions
- Check existing test output: `npx playwright show-report`
- Review test logs in console
- Check GitHub issues for known problems

### Contributing
When adding new tests:
1. Follow existing test structure
2. Add to appropriate test group
3. Update this documentation
4. Ensure tests pass in CI
5. Add test data to fixtures if needed

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Receipt Processing Implementation](../../src/features/receipt-processing/)
- [Test Fixtures](../fixtures/receipt-fixtures.ts)
- [Test Helpers](../helpers/receipt-test-helpers.ts)
