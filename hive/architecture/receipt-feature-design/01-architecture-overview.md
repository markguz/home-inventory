# Receipt Image Processing Feature - Architecture Overview

## Executive Summary

This document defines the architecture for adding receipt image processing to the Home Inventory application. Users can capture or upload receipt images, extract items automatically via OCR, review and edit extracted data, and add confirmed items to their inventory with full audit trail.

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   Camera/    │    │    Image     │    │  Tesseract.js│          │
│  │   Upload UI  │───▶│ Preprocessing│───▶│  OCR Engine  │          │
│  └──────────────┘    └──────────────┘    └──────┬───────┘          │
│                                                   │                   │
│                                                   ▼                   │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │  Inventory   │◀───│   Review &   │◀───│    Receipt   │          │
│  │     View     │    │  Confirmation│    │    Parser    │          │
│  └──────────────┘    └──────┬───────┘    └──────────────┘          │
│                              │                                        │
└──────────────────────────────┼────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  POST /api/receipts/upload      │  Upload temporary image            │
│  POST /api/receipts             │  Create draft receipt              │
│  GET  /api/receipts/:id         │  Retrieve receipt details          │
│  PATCH /api/receipts/:id        │  Update receipt metadata           │
│  POST /api/receipts/:id/confirm │  Convert to inventory items        │
│  DELETE /api/receipts/:id       │  Delete draft receipt              │
│                                                                       │
│  [Optional] POST /api/receipts/process  │  Server-side OCR fallback  │
│                                                                       │
└───────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DATABASE LAYER                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐          │
│  │   receipts   │    │  extracted_  │    │    items     │          │
│  │              │───▶│    items     │    │  (existing)  │          │
│  └──────────────┘    └──────────────┘    └──────┬───────┘          │
│         │                                        │                   │
│         └────────────────────────────────────────┘                   │
│                    (receipt_id foreign key)                          │
│                                                                       │
└───────────────────────────────┬─────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       STORAGE LAYER                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────┐    ┌──────────────────────────┐      │
│  │   receipts-temp/         │    │   receipts-archive/      │      │
│  │   (24h auto-expire)      │    │   (optional, user pref)  │      │
│  └──────────────────────────┘    └──────────────────────────┘      │
│                                                                       │
│  Supabase Storage with signed URLs and encryption                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Processing Strategy: Hybrid Approach

### Primary: Client-Side Processing
- **OCR Engine**: Tesseract.js (WebAssembly)
- **Benefits**: Privacy (no upload needed), no server costs, immediate feedback
- **Limitations**: Depends on device performance, accuracy varies

### Fallback: Server-Side Processing (Optional)
- **OCR Engine**: Google Vision API / AWS Textract / Azure Computer Vision
- **Benefits**: Higher accuracy, consistent results, GPU acceleration
- **Use Cases**: User reports poor results, low confidence scores (<0.3)

## Key Architectural Decisions

### ADR-001: Client-First Processing
**Decision**: Process receipts primarily on client-side with optional server enhancement.
**Rationale**: Balances privacy, cost, and accuracy. Most receipts process successfully client-side.
**Trade-offs**: Variable accuracy across devices, larger client bundle size.

### ADR-002: Review Before Addition
**Decision**: All extracted items require user review before inventory addition.
**Rationale**: OCR is not 100% accurate. User review prevents inventory corruption.
**Trade-offs**: Extra step in workflow, but prevents data quality issues.

### ADR-003: Temporary Image Storage
**Decision**: Store images temporarily (24h) by default, permanent storage opt-in only.
**Rationale**: Privacy-first approach. Most users don't need long-term receipt storage.
**Trade-offs**: Can't re-process after 24h without re-upload.

### ADR-004: Soft Link to Receipts
**Decision**: Add optional receipt_id to items table rather than hard requirement.
**Rationale**: Preserves existing manual entry workflow, adds audit capability.
**Trade-offs**: Some items won't have receipt link (manually entered).

## Component Responsibilities

### Client Components
1. **ReceiptCapture**: Camera/upload interface
2. **ImagePreprocessor**: Enhancement, rotation, cropping
3. **OCRProcessor**: Tesseract.js integration with progress reporting
4. **ReceiptParser**: Extract structured data from OCR text
5. **ReviewInterface**: Display extracted items with editing capabilities
6. **ConfirmationService**: Batch create inventory items

### API Services
1. **ImageUploadService**: Temporary storage with signed URLs
2. **ReceiptService**: CRUD operations on receipts
3. **ExtractionService**: Manage extracted items
4. **ConfirmationService**: Convert extracted → inventory items
5. **CleanupService**: Background job for expired image deletion

### Database Schema
1. **receipts**: Receipt metadata and processing status
2. **extracted_items**: OCR results before confirmation
3. **items**: Existing inventory items (add receipt_id FK)

## Non-Functional Requirements

### Performance
- Image upload: < 3 seconds (2MB images)
- Client-side OCR: < 15 seconds (typical receipt)
- API response time: < 500ms (excluding OCR)
- Support concurrent processing for multiple receipts

### Scalability
- Handle 1000+ receipts per user
- Support 100 concurrent users
- Auto-scale storage and compute resources

### Reliability
- 95% OCR success rate (any confidence level)
- 99.9% API uptime
- Automatic retry on transient failures
- Data durability (receipts, items)

### Security
- End-to-end encryption for images
- Row-level security for all data
- Rate limiting on all endpoints
- Input validation and sanitization

### Privacy
- Minimal data retention (24h default)
- User consent for permanent storage
- GDPR compliance (right to deletion, export)
- No cross-user data sharing

## Technology Stack

### Client-Side
- **OCR**: Tesseract.js v5.x
- **Image Processing**: Canvas API, sharp (if server-side)
- **UI Framework**: React, TypeScript
- **State Management**: React Query, Zustand
- **File Upload**: Direct to Supabase Storage

### Server-Side
- **Runtime**: Node.js v20+
- **API**: Next.js API Routes / Supabase Edge Functions
- **Database**: PostgreSQL 15+ (Supabase)
- **Storage**: Supabase Storage (S3-compatible)
- **Caching**: Redis (optional, for rate limiting)

### Optional Enhancements
- **Server OCR**: Google Vision API (fallback)
- **Background Jobs**: Supabase Edge Functions with pg_cron
- **Analytics**: PostHog / Plausible (anonymous)

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PRODUCTION STACK                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Frontend (Vercel)                                                   │
│  ├── Next.js Static/SSR                                              │
│  ├── Client-side OCR (tesseract.js)                                  │
│  └── Image preprocessing                                             │
│                                                                       │
│  Backend (Supabase)                                                  │
│  ├── PostgreSQL (receipts, extracted_items, items)                   │
│  ├── Storage (images with auto-expire)                               │
│  ├── Edge Functions (API routes)                                     │
│  ├── Realtime (optional: live OCR progress)                          │
│  └── Auth (RLS policies)                                             │
│                                                                       │
│  Background (Supabase pg_cron)                                       │
│  ├── Image cleanup job (daily)                                       │
│  └── Metrics aggregation (optional)                                  │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Future Enhancements (Phase 2)

1. **ML Training**: Learn from user corrections to improve parsing
2. **Bulk Processing**: Upload multiple receipts at once
3. **Template Recognition**: Detect merchant and use custom parsers
4. **Multi-Language**: Support receipts in multiple languages
5. **Mobile Apps**: Native iOS/Android with better camera integration
6. **Expense Tracking**: Add expense categories and reporting
7. **Receipt Sharing**: Share receipts between household members
8. **API Integration**: Connect to accounting software (QuickBooks, etc.)

## Success Metrics

1. **Adoption Rate**: % of users who try receipt feature
2. **Success Rate**: % of receipts successfully processed
3. **Accuracy Rate**: % of extracted items not requiring edits
4. **Time Savings**: Average time vs. manual entry
5. **User Satisfaction**: Rating/feedback on feature
6. **Error Rate**: % of receipts requiring re-processing

## Risks and Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Poor OCR accuracy | High | Medium | Hybrid approach, user review, fallback to server |
| Performance on slow devices | Medium | Medium | Web workers, progressive loading, optimize bundle |
| Privacy concerns | High | Low | Temporary storage, clear consent, GDPR compliance |
| Storage costs | Low | Medium | Auto-expire, compression, user limits |
| Complex receipts (handwritten) | Medium | High | Clear error messages, manual entry fallback |

## Conclusion

This architecture provides a robust, scalable, and privacy-focused solution for receipt image processing. The hybrid client-first approach balances user experience, cost, and accuracy while maintaining flexibility for future enhancements.
