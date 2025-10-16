# Database Schema - Receipt Processing

## Schema Overview

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   users     │         │     receipts     │         │    items    │
│  (auth)     │◀────────│                  │────────▶│  (existing) │
└─────────────┘         └──────────┬───────┘         └─────────────┘
                                   │
                                   │ 1:N
                                   │
                        ┌──────────▼───────┐
                        │ extracted_items  │
                        └──────────────────┘
```

---

## New Tables

### Table: `receipts`

Stores receipt metadata and processing status.

```sql
CREATE TABLE receipts (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Receipt metadata
  merchant_name VARCHAR(255),
  receipt_date DATE,
  total_amount DECIMAL(10, 2),

  -- Processing information
  processing_status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (processing_status IN ('draft', 'processing', 'confirmed', 'failed')),
  confidence DECIMAL(3, 2)
    CHECK (confidence >= 0 AND confidence <= 1),

  -- OCR data
  raw_ocr_text TEXT,

  -- Image storage
  image_url VARCHAR(500),
  image_expires_at TIMESTAMP WITH TIME ZONE,

  -- Flexible metadata storage
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Soft delete
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX idx_receipts_user_id ON receipts(user_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_receipts_status ON receipts(processing_status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_receipts_created_at ON receipts(created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_receipts_receipt_date ON receipts(receipt_date DESC)
  WHERE deleted_at IS NULL AND receipt_date IS NOT NULL;

CREATE INDEX idx_receipts_image_expires ON receipts(image_expires_at)
  WHERE deleted_at IS NULL AND image_expires_at IS NOT NULL;

-- Auto-update timestamp trigger
CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Field Descriptions:**

- `id`: Unique identifier (UUID v4)
- `user_id`: Owner of the receipt (foreign key to auth.users)
- `merchant_name`: Store/merchant name extracted from receipt
- `receipt_date`: Purchase date extracted from receipt
- `total_amount`: Total purchase amount
- `processing_status`: Current state of receipt processing
  - `draft`: Initial state, user reviewing
  - `processing`: Currently being processed
  - `confirmed`: Items added to inventory
  - `failed`: Processing failed
- `confidence`: Overall OCR confidence score (0.0-1.0)
- `raw_ocr_text`: Full OCR output for debugging/re-processing
- `image_url`: Temporary/permanent storage URL
- `image_expires_at`: When temporary image will be deleted
- `metadata`: JSON field for extensibility (e.g., tax amount, payment method)
- `deleted_at`: Soft delete timestamp

---

### Table: `extracted_items`

Stores individual items extracted from receipts before inventory confirmation.

```sql
CREATE TABLE extracted_items (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,

  -- Item information
  name VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2),

  -- Extraction metadata
  confidence DECIMAL(3, 2)
    CHECK (confidence >= 0 AND confidence <= 1),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'edited')),

  -- OCR position data (for UI highlighting)
  bounding_box JSONB,
    -- Expected format: {"x": 45, "y": 120, "width": 200, "height": 25}
  raw_text TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_extracted_items_receipt_id ON extracted_items(receipt_id);

CREATE INDEX idx_extracted_items_status ON extracted_items(status);

CREATE INDEX idx_extracted_items_confidence ON extracted_items(confidence)
  WHERE confidence IS NOT NULL;

-- Auto-update timestamp trigger
CREATE TRIGGER update_extracted_items_updated_at
  BEFORE UPDATE ON extracted_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Field Descriptions:**

- `id`: Unique identifier (UUID v4)
- `receipt_id`: Parent receipt (cascade delete)
- `name`: Product/item name
- `quantity`: Number of units purchased
- `unit_price`: Price per unit (if detected)
- `total_price`: Total price for this line item
- `confidence`: OCR confidence for this specific item (0.0-1.0)
- `status`: Item review status
  - `pending`: Awaiting user review
  - `confirmed`: User confirmed, inventory item created
  - `rejected`: User rejected (false positive)
  - `edited`: User modified from original OCR
- `bounding_box`: JSON with x, y, width, height for UI highlighting
- `raw_text`: Original OCR text for this item

---

## Modified Existing Table

### Table: `items` (modifications)

Add optional foreign keys to link inventory items back to receipts.

```sql
-- Add new columns to existing items table
ALTER TABLE items
  ADD COLUMN receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL;

ALTER TABLE items
  ADD COLUMN extracted_item_id UUID REFERENCES extracted_items(id) ON DELETE SET NULL;

-- Add index for audit trail queries
CREATE INDEX idx_items_receipt_id ON items(receipt_id)
  WHERE receipt_id IS NOT NULL;

-- Add index for linking back to extraction data
CREATE INDEX idx_items_extracted_item_id ON items(extracted_item_id)
  WHERE extracted_item_id IS NOT NULL;
```

**New Field Descriptions:**

- `receipt_id`: Optional link to source receipt (audit trail)
- `extracted_item_id`: Optional link to original extracted item data

**Migration Notes:**
- Existing items will have NULL values (manually entered)
- Future items from receipts will have these populated
- SET NULL on delete preserves inventory if receipt is deleted

---

## Row-Level Security (RLS) Policies

### receipts table

```sql
-- Enable RLS
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

-- Users can view their own receipts
CREATE POLICY "Users can view own receipts"
  ON receipts FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Users can create their own receipts
CREATE POLICY "Users can create own receipts"
  ON receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own receipts
CREATE POLICY "Users can update own receipts"
  ON receipts FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Users can soft-delete their own receipts
CREATE POLICY "Users can delete own receipts"
  ON receipts FOR DELETE
  USING (auth.uid() = user_id);
```

### extracted_items table

```sql
-- Enable RLS
ALTER TABLE extracted_items ENABLE ROW LEVEL SECURITY;

-- Users can view items from their own receipts
CREATE POLICY "Users can view own extracted items"
  ON extracted_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = extracted_items.receipt_id
        AND receipts.user_id = auth.uid()
        AND receipts.deleted_at IS NULL
    )
  );

-- Users can create items for their own receipts
CREATE POLICY "Users can create own extracted items"
  ON extracted_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = extracted_items.receipt_id
        AND receipts.user_id = auth.uid()
    )
  );

-- Users can update items from their own receipts
CREATE POLICY "Users can update own extracted items"
  ON extracted_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = extracted_items.receipt_id
        AND receipts.user_id = auth.uid()
        AND receipts.deleted_at IS NULL
    )
  );

-- Users can delete items from their own receipts
CREATE POLICY "Users can delete own extracted items"
  ON extracted_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = extracted_items.receipt_id
        AND receipts.user_id = auth.uid()
    )
  );
```

---

## Helper Functions

### Update timestamp function

```sql
-- Function to auto-update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Cleanup expired images function

```sql
-- Function to find receipts with expired images
CREATE OR REPLACE FUNCTION get_expired_receipt_images()
RETURNS TABLE (
  receipt_id UUID,
  image_url VARCHAR(500)
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, image_url
  FROM receipts
  WHERE image_expires_at < NOW()
    AND image_url IS NOT NULL
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## Database Migration Script

```sql
-- Migration: Add receipt processing tables
-- Version: 001_add_receipt_processing
-- Date: 2025-10-15

BEGIN;

-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create receipts table
CREATE TABLE IF NOT EXISTS receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_name VARCHAR(255),
  receipt_date DATE,
  total_amount DECIMAL(10, 2),
  processing_status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (processing_status IN ('draft', 'processing', 'confirmed', 'failed')),
  confidence DECIMAL(3, 2)
    CHECK (confidence >= 0 AND confidence <= 1),
  raw_ocr_text TEXT,
  image_url VARCHAR(500),
  image_expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for receipts
CREATE INDEX idx_receipts_user_id ON receipts(user_id)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_receipts_status ON receipts(processing_status)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_receipts_created_at ON receipts(created_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX idx_receipts_receipt_date ON receipts(receipt_date DESC)
  WHERE deleted_at IS NULL AND receipt_date IS NOT NULL;
CREATE INDEX idx_receipts_image_expires ON receipts(image_expires_at)
  WHERE deleted_at IS NULL AND image_expires_at IS NOT NULL;

-- Create trigger for receipts
CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create extracted_items table
CREATE TABLE IF NOT EXISTS extracted_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
  unit_price DECIMAL(10, 2),
  total_price DECIMAL(10, 2),
  confidence DECIMAL(3, 2)
    CHECK (confidence >= 0 AND confidence <= 1),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'rejected', 'edited')),
  bounding_box JSONB,
  raw_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for extracted_items
CREATE INDEX idx_extracted_items_receipt_id ON extracted_items(receipt_id);
CREATE INDEX idx_extracted_items_status ON extracted_items(status);
CREATE INDEX idx_extracted_items_confidence ON extracted_items(confidence)
  WHERE confidence IS NOT NULL;

-- Create trigger for extracted_items
CREATE TRIGGER update_extracted_items_updated_at
  BEFORE UPDATE ON extracted_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Modify existing items table
ALTER TABLE items
  ADD COLUMN IF NOT EXISTS receipt_id UUID REFERENCES receipts(id) ON DELETE SET NULL;

ALTER TABLE items
  ADD COLUMN IF NOT EXISTS extracted_item_id UUID REFERENCES extracted_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_items_receipt_id ON items(receipt_id)
  WHERE receipt_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_items_extracted_item_id ON items(extracted_item_id)
  WHERE extracted_item_id IS NOT NULL;

-- Enable RLS on new tables
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for receipts
CREATE POLICY "Users can view own receipts"
  ON receipts FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can create own receipts"
  ON receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts"
  ON receipts FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own receipts"
  ON receipts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for extracted_items
CREATE POLICY "Users can view own extracted items"
  ON extracted_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = extracted_items.receipt_id
        AND receipts.user_id = auth.uid()
        AND receipts.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can create own extracted items"
  ON extracted_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = extracted_items.receipt_id
        AND receipts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own extracted items"
  ON extracted_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = extracted_items.receipt_id
        AND receipts.user_id = auth.uid()
        AND receipts.deleted_at IS NULL
    )
  );

CREATE POLICY "Users can delete own extracted items"
  ON extracted_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = extracted_items.receipt_id
        AND receipts.user_id = auth.uid()
    )
  );

-- Create helper function for cleanup
CREATE OR REPLACE FUNCTION get_expired_receipt_images()
RETURNS TABLE (
  receipt_id UUID,
  image_url VARCHAR(500)
) AS $$
BEGIN
  RETURN QUERY
  SELECT id, image_url
  FROM receipts
  WHERE image_expires_at < NOW()
    AND image_url IS NOT NULL
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

COMMIT;
```

---

## Rollback Script

```sql
-- Rollback: Remove receipt processing tables
-- Version: 001_add_receipt_processing

BEGIN;

-- Drop RLS policies
DROP POLICY IF EXISTS "Users can delete own extracted items" ON extracted_items;
DROP POLICY IF EXISTS "Users can update own extracted items" ON extracted_items;
DROP POLICY IF EXISTS "Users can create own extracted items" ON extracted_items;
DROP POLICY IF EXISTS "Users can view own extracted items" ON extracted_items;

DROP POLICY IF EXISTS "Users can delete own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can update own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can create own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can view own receipts" ON receipts;

-- Drop foreign key columns from items
ALTER TABLE items DROP COLUMN IF EXISTS extracted_item_id;
ALTER TABLE items DROP COLUMN IF EXISTS receipt_id;

-- Drop tables (cascade will drop indexes and triggers)
DROP TABLE IF EXISTS extracted_items CASCADE;
DROP TABLE IF EXISTS receipts CASCADE;

-- Drop helper function
DROP FUNCTION IF EXISTS get_expired_receipt_images();

-- Note: Keep update_updated_at_column() function as it may be used elsewhere

COMMIT;
```

---

## Sample Queries

### Get receipt with all extracted items
```sql
SELECT
  r.*,
  json_agg(
    json_build_object(
      'id', ei.id,
      'name', ei.name,
      'quantity', ei.quantity,
      'totalPrice', ei.total_price,
      'confidence', ei.confidence,
      'status', ei.status
    ) ORDER BY ei.created_at
  ) AS extracted_items
FROM receipts r
LEFT JOIN extracted_items ei ON ei.receipt_id = r.id
WHERE r.id = $1
  AND r.user_id = auth.uid()
  AND r.deleted_at IS NULL
GROUP BY r.id;
```

### Find receipts with low confidence items
```sql
SELECT
  r.id,
  r.merchant_name,
  r.created_at,
  COUNT(ei.id) AS low_confidence_items
FROM receipts r
JOIN extracted_items ei ON ei.receipt_id = r.id
WHERE r.user_id = auth.uid()
  AND r.processing_status = 'draft'
  AND ei.confidence < 0.5
  AND r.deleted_at IS NULL
GROUP BY r.id, r.merchant_name, r.created_at
HAVING COUNT(ei.id) > 0
ORDER BY r.created_at DESC;
```

### Get inventory items with receipt audit trail
```sql
SELECT
  i.id,
  i.name,
  i.quantity,
  r.merchant_name AS purchased_from,
  r.receipt_date AS purchase_date,
  ei.unit_price AS purchase_price
FROM items i
LEFT JOIN receipts r ON r.id = i.receipt_id
LEFT JOIN extracted_items ei ON ei.id = i.extracted_item_id
WHERE i.user_id = auth.uid()
ORDER BY i.created_at DESC;
```

### Find expired images for cleanup
```sql
SELECT id, image_url
FROM receipts
WHERE image_expires_at < NOW()
  AND image_url IS NOT NULL
  AND deleted_at IS NULL
LIMIT 100;
```

---

## Storage Considerations

### Estimated Storage per Receipt

| Component | Size | Notes |
|-----------|------|-------|
| Receipt row | ~500 bytes | Without raw_ocr_text |
| Raw OCR text | 2-10 KB | Optional, for debugging |
| Extracted items (avg 8) | ~4 KB | 8 items × 500 bytes |
| **Total per receipt** | **5-15 KB** | Database only |
| Image (temporary) | 2-5 MB | 24h retention |
| Image (archived) | 0.5-1 MB | Optional, compressed |

### Scaling Estimates

- 1,000 users × 10 receipts/month = 10,000 receipts/month
- Database: 10,000 × 10 KB = 100 MB/month
- Temp images: 10,000 × 2 MB / 30 days = ~667 GB daily (auto-deleted)
- Archived images (10% opt-in): 1,000 × 1 MB = 1 GB/month

### Cleanup Strategy

```sql
-- Schedule with pg_cron (runs daily at 3 AM)
SELECT cron.schedule(
  'cleanup-expired-receipt-images',
  '0 3 * * *',
  $$
  SELECT image_url
  FROM get_expired_receipt_images()
  $$
);
```
