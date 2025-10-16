# Receipt Feature Test Matrix

## Overview

This matrix provides a quick reference for all test cases organized by priority, type, and implementation status.

---

## Test Count Summary

| Test Type | Total | P0 | P1 | P2 | Status |
|-----------|-------|----|----|----|----|
| Unit Tests | 41 | 15 | 18 | 8 | Not Started |
| Component Tests | 29 | 15 | 11 | 3 | Not Started |
| Integration Tests | 18 | 10 | 6 | 2 | Not Started |
| E2E Tests | 10 | 4 | 5 | 1 | Not Started |
| Performance Tests | 11 | 4 | 5 | 2 | Not Started |
| Security Tests | 17 | 12 | 4 | 1 | Not Started |
| Accessibility Tests | 10 | 7 | 3 | 0 | Not Started |
| **TOTAL** | **136** | **67** | **52** | **17** | **0% Complete** |

---

## Priority Definitions

- **P0 (Critical):** Must pass before release. Blocks deployment.
- **P1 (High):** Should pass before release. May proceed with known issues documented.
- **P2 (Medium):** Nice to have. Can be addressed post-release.
- **P3 (Low):** Future improvement. Not tracked in this matrix.

---

## Unit Tests (41 tests)

### OCR Processing Module (6 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| U-001 | extractTextFromImage() success | P0 | 1h | Tesseract mock |
| U-002 | extractTextFromImage() error handling | P0 | 1h | Tesseract mock |
| U-003 | extractTextFromImage() with options | P1 | 1h | Tesseract mock |
| U-004 | preprocessImage() | P1 | 2h | Image processing lib |
| U-005 | Worker initialization | P2 | 1h | Tesseract mock |
| U-006 | Memory cleanup | P1 | 1h | Tesseract mock |

### Receipt Parser Module (10 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| U-007 | parseReceiptText() - grocery | P0 | 2h | Mock OCR data |
| U-008 | parseReceiptText() - restaurant | P1 | 2h | Mock OCR data |
| U-009 | extractItems() | P0 | 2h | Mock text |
| U-010 | extractPrices() | P0 | 2h | Mock text |
| U-011 | extractDate() | P0 | 2h | Mock text |
| U-012 | extractTotal() | P1 | 1h | Mock text |
| U-013 | validateParsedData() | P0 | 2h | Zod schemas |
| U-014 | Empty text handling | P0 | 1h | None |
| U-015 | Malformed text | P1 | 2h | Mock corrupted data |
| U-016 | Very long item names | P2 | 1h | None |

### Price Parser Module (8 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| U-017 | Parse US format ($12.99) | P0 | 30m | None |
| U-018 | Parse EU format (12,99€) | P1 | 30m | None |
| U-019 | Parse UK format (£12.99) | P1 | 30m | None |
| U-020 | Parse without symbol | P1 | 30m | None |
| U-021 | Parse with thousands | P1 | 30m | None |
| U-022 | Parse negative amounts | P1 | 30m | None |
| U-023 | Invalid format handling | P0 | 30m | None |
| U-024 | Multiple symbols handling | P2 | 30m | None |

### Date Parser Module (7 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| U-025 | Parse US format (MM/DD/YYYY) | P0 | 30m | date-fns |
| U-026 | Parse EU format (DD-MM-YYYY) | P1 | 30m | date-fns |
| U-027 | Parse ISO format | P1 | 30m | date-fns |
| U-028 | Parse long format | P1 | 30m | date-fns |
| U-029 | No date found - use current | P0 | 30m | None |
| U-030 | Invalid date handling | P1 | 30m | None |
| U-031 | Ambiguous date handling | P2 | 1h | None |

### Data Validation Module (8 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| U-032 | Valid receipt data | P0 | 1h | Zod schemas |
| U-033 | Missing required fields | P0 | 1h | Zod schemas |
| U-034 | Invalid price types | P0 | 1h | Zod schemas |
| U-035 | Invalid date types | P1 | 1h | Zod schemas |
| U-036 | Empty items array | P1 | 30m | Zod schemas |
| U-037 | XSS in item names | P0 | 1h | Sanitization lib |
| U-038 | SQL injection attempts | P0 | 1h | Prisma queries |
| U-039 | Item name length limits | P1 | 30m | None |

### Helper Functions (2 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| U-040 | Item name normalization | P1 | 1h | None |
| U-041 | Quantity detection | P1 | 1h | Regex patterns |

**Unit Test Total Time: ~40 hours**

---

## Component Tests (29 tests)

### ReceiptUpload Component (8 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| C-001 | Render upload area | P0 | 30m | Testing Library |
| C-002 | File selection via input | P0 | 1h | Testing Library, user-event |
| C-003 | Drag and drop | P1 | 1h | Testing Library, user-event |
| C-004 | Invalid file type | P0 | 1h | Testing Library |
| C-005 | File too large | P0 | 1h | Testing Library |
| C-006 | Multiple files | P1 | 1h | Testing Library |
| C-007 | Cancel upload | P1 | 1h | Testing Library |
| C-008 | Retry after error | P1 | 1h | Testing Library |

### ReceiptPreview Component (6 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| C-009 | Display image preview | P0 | 1h | Testing Library |
| C-010 | Rotation controls | P1 | 1h | Testing Library |
| C-011 | Zoom controls | P2 | 1h | Testing Library |
| C-012 | Loading state | P0 | 30m | Testing Library |
| C-013 | Error state | P0 | 30m | Testing Library |
| C-014 | Remove image | P1 | 30m | Testing Library |

### ProcessingStatus Component (7 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| C-015 | Uploading state | P0 | 30m | Testing Library |
| C-016 | OCR processing state | P0 | 30m | Testing Library |
| C-017 | Parsing state | P0 | 30m | Testing Library |
| C-018 | Success state | P0 | 30m | Testing Library |
| C-019 | Error state | P0 | 30m | Testing Library |
| C-020 | Cancel button | P1 | 30m | Testing Library |
| C-021 | Progress percentage | P1 | 1h | Testing Library |

### ItemReviewList Component (8 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| C-022 | Display parsed items | P0 | 1h | Testing Library |
| C-023 | Edit item name | P0 | 1h | Testing Library, user-event |
| C-024 | Edit item price | P0 | 1h | Testing Library, user-event |
| C-025 | Remove item | P0 | 1h | Testing Library |
| C-026 | Category selection | P1 | 1h | Testing Library |
| C-027 | Location selection | P1 | 1h | Testing Library |
| C-028 | Select all items | P1 | 1h | Testing Library |
| C-029 | Save selected items | P0 | 1h | Testing Library, MSW |

**Component Test Total Time: ~23 hours**

---

## Integration Tests (18 tests)

### Receipt Upload API (7 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| I-001 | Upload valid image | P0 | 2h | Test DB, File mock |
| I-002 | Upload without auth | P0 | 1h | NextAuth mock |
| I-003 | Upload invalid file type | P0 | 1h | None |
| I-004 | Upload oversized file | P0 | 1h | None |
| I-005 | Upload malformed data | P1 | 1h | None |
| I-006 | Concurrent uploads | P1 | 2h | Test DB |
| I-007 | Rate limiting | P2 | 2h | Redis mock |

### Receipt Processing API (6 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| I-008 | Process uploaded receipt | P0 | 2h | Tesseract, Test DB |
| I-009 | Process with OCR failure | P0 | 1h | Tesseract mock |
| I-010 | Process empty receipt | P1 | 1h | Tesseract mock |
| I-011 | Process invalid receipt ID | P0 | 30m | Test DB |
| I-012 | Process unauthorized receipt | P0 | 1h | NextAuth mock |
| I-013 | Process already processed | P1 | 1h | Test DB |

### Database Integration (5 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| I-014 | Create items from receipt | P0 | 2h | Test DB, Prisma |
| I-015 | Transaction rollback | P0 | 2h | Test DB, Prisma |
| I-016 | Foreign key constraints | P0 | 1h | Test DB, Prisma |
| I-017 | Duplicate item detection | P1 | 1h | Test DB, Prisma |
| I-018 | Orphaned receipt cleanup | P2 | 1h | Test DB, Prisma |

**Integration Test Total Time: ~24 hours**

---

## E2E Tests (10 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| E-001 | Happy path workflow | P0 | 3h | Test env, fixtures |
| E-002 | Multiple items receipt | P0 | 2h | Test env, fixtures |
| E-003 | Edit before save | P1 | 2h | Test env, fixtures |
| E-004 | Category assignment | P1 | 2h | Test env, fixtures |
| E-005 | Error recovery | P0 | 2h | Test env |
| E-006 | Cancel workflow | P1 | 2h | Test env |
| E-007 | Mobile workflow | P1 | 2h | Test env, mobile config |
| E-008 | Keyboard navigation | P1 | 2h | Test env |
| E-009 | Duplicate detection | P2 | 2h | Test env, Test DB |
| E-010 | Network failure | P0 | 2h | Test env, MSW |

**E2E Test Total Time: ~21 hours**

---

## Performance Tests (11 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| P-001 | Single receipt OCR < 5s | P0 | 2h | Real Tesseract |
| P-002 | API upload < 2s | P0 | 1h | Test env |
| P-003 | Batch 5 receipts < 30s | P1 | 2h | Real Tesseract |
| P-004 | Large image (5MB) < 10s | P1 | 1h | Large test image |
| P-005 | Memory per receipt < 150MB | P1 | 2h | Memory profiling |
| P-006 | Concurrent 5 users | P1 | 3h | Load testing tool |
| P-007 | Database query < 100ms | P1 | 1h | Test DB |
| P-008 | Blurry image processing | P2 | 1h | Blurry fixture |
| P-009 | Rotated image processing | P2 | 1h | Rotated fixture |
| P-010 | Memory leak detection | P0 | 2h | Memory profiling |
| P-011 | CPU usage monitoring | P0 | 1h | CPU profiling |

**Performance Test Total Time: ~17 hours**

---

## Security Tests (17 tests)

### File Upload Security (6 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| S-001 | Executable upload rejection | P0 | 1h | Malicious file |
| S-002 | Path traversal prevention | P0 | 1h | Malicious filename |
| S-003 | Oversized file rejection | P0 | 1h | Large file |
| S-004 | Malicious image detection | P0 | 2h | Malicious fixture |
| S-005 | Double extension handling | P0 | 1h | None |
| S-006 | MIME type validation | P0 | 1h | Spoofed MIME |

### Data Injection (5 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| S-007 | XSS prevention | P0 | 1h | XSS payloads |
| S-008 | SQL injection prevention | P0 | 1h | SQL payloads |
| S-009 | Command injection prevention | P0 | 1h | Command payloads |
| S-010 | NoSQL injection prevention | P1 | 1h | NoSQL payloads |
| S-011 | LDAP injection prevention | P2 | 1h | LDAP payloads |

### Authentication & Authorization (6 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| S-012 | Upload without session | P0 | 30m | None |
| S-013 | Access other user's receipt | P0 | 1h | Test DB |
| S-014 | CSRF protection | P0 | 1h | CSRF tokens |
| S-015 | Session fixation prevention | P1 | 1h | NextAuth |
| S-016 | Brute force protection | P1 | 2h | Rate limiting |
| S-017 | JWT token validation | P1 | 1h | NextAuth |

**Security Test Total Time: ~19 hours**

---

## Accessibility Tests (10 tests)

| ID | Test Case | Priority | Estimated Time | Dependencies |
|----|-----------|----------|----------------|--------------|
| A-001 | No axe violations | P0 | 1h | jest-axe |
| A-002 | Keyboard navigation | P0 | 2h | Manual testing |
| A-003 | Screen reader support | P0 | 3h | NVDA/JAWS |
| A-004 | Focus indicators visible | P0 | 1h | Visual inspection |
| A-005 | Color contrast compliance | P0 | 1h | axe-core |
| A-006 | Alt text for images | P0 | 1h | Automated check |
| A-007 | Form labels present | P0 | 1h | Automated check |
| A-008 | ARIA attributes correct | P1 | 2h | Manual + automated |
| A-009 | Error announcements | P1 | 2h | Screen reader |
| A-010 | Loading states announced | P1 | 1h | Screen reader |

**Accessibility Test Total Time: ~15 hours**

---

## Test Dependency Graph

```
Prerequisites:
├── Test Database Setup (2h)
├── Test User Creation (1h)
├── Sample Receipt Images (4h)
├── Mock OCR Output Files (2h)
├── Expected Parsed Data (2h)
├── Database Seed Data (1h)
└── CI/CD Pipeline Config (3h)

Unit Tests (40h)
├── Can run immediately
└── Requires: Mocks, test data

Component Tests (23h)
├── Requires: Unit tests passing
└── Requires: Testing Library setup

Integration Tests (24h)
├── Requires: Unit tests passing
├── Requires: Test DB setup
└── Requires: Test users

E2E Tests (21h)
├── Requires: All other tests passing
├── Requires: Full test environment
└── Requires: Test fixtures

Performance Tests (17h)
├── Requires: E2E tests passing
└── Requires: Baseline measurements

Security Tests (19h)
├── Can run in parallel with unit tests
└── Requires: Security fixtures

Accessibility Tests (15h)
├── Requires: Component tests passing
└── Requires: jest-axe, manual testing tools
```

**Total Estimated Time: ~174 hours (Prerequisites: 15h + Tests: 159h)**

---

## Implementation Roadmap

### Phase 1: Setup & Unit Tests (Week 1-2)
- [ ] Set up test infrastructure (15h)
- [ ] Implement unit tests (40h)
- [ ] Target: 85% unit test coverage

### Phase 2: Component & Integration Tests (Week 3-4)
- [ ] Implement component tests (23h)
- [ ] Implement integration tests (24h)
- [ ] Target: 75% component coverage, 90% API coverage

### Phase 3: E2E & Performance Tests (Week 5)
- [ ] Implement E2E tests (21h)
- [ ] Implement performance tests (17h)
- [ ] Target: All critical workflows covered

### Phase 4: Security & Accessibility (Week 6)
- [ ] Implement security tests (19h)
- [ ] Implement accessibility tests (15h)
- [ ] Target: Zero vulnerabilities, WCAG 2.1 AA compliance

### Phase 5: CI/CD & Documentation (Week 7)
- [ ] Configure CI/CD pipeline (8h)
- [ ] Complete documentation (8h)
- [ ] Final review and sign-off (4h)

**Total Project Duration: ~7 weeks (174 hours)**

---

## Quick Reference: Test Locations

```
/tests
├── /unit
│   ├── /lib
│   │   ├── /ocr
│   │   │   └── tesseract-wrapper.test.ts
│   │   └── /receipt
│   │       ├── parser.test.ts
│   │       ├── price-parser.test.ts
│   │       ├── date-parser.test.ts
│   │       └── validation.test.ts
│   └── /helpers
│       └── normalization.test.ts
│
├── /components
│   ├── ReceiptUpload.test.tsx
│   ├── ReceiptPreview.test.tsx
│   ├── ProcessingStatus.test.tsx
│   └── ItemReviewList.test.tsx
│
├── /integration
│   ├── /api
│   │   └── /receipts
│   │       ├── upload.test.ts
│   │       └── process.test.ts
│   └── /db
│       └── receipt-items.test.ts
│
├── /e2e
│   ├── receipt-upload-happy-path.spec.ts
│   ├── receipt-multiple-items.spec.ts
│   ├── receipt-edit-items.spec.ts
│   ├── receipt-category-assignment.spec.ts
│   ├── receipt-error-recovery.spec.ts
│   ├── receipt-cancel-upload.spec.ts
│   ├── receipt-mobile-upload.spec.ts
│   ├── receipt-keyboard-nav.spec.ts
│   ├── receipt-duplicate-detection.spec.ts
│   └── receipt-network-failure.spec.ts
│
├── /performance
│   ├── receipt-processing.bench.ts
│   └── load-test.ts
│
├── /security
│   ├── file-upload-security.test.ts
│   ├── data-injection.test.ts
│   └── auth-security.test.ts
│
├── /accessibility
│   ├── receipt-upload-a11y.test.tsx
│   └── keyboard-navigation.test.tsx
│
└── /fixtures
    ├── /receipts (images)
    ├── /ocr-output (JSON)
    ├── /parsed-data (JSON)
    └── /db (seed data)
```

---

**Matrix Version:** 1.0
**Last Updated:** 2025-10-15
**Status:** Ready for Implementation
