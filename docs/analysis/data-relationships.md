# Data Relationship Analysis - Home Inventory System

**Project**: Home Inventory Management System
**Date**: 2025-10-10
**Analyst**: Hive Mind Analyst Agent
**Swarm ID**: swarm-1760128533906-e6cc3wfik

---

## Table of Contents
1. [Entity Overview](#entity-overview)
2. [Entity-Relationship Diagram](#entity-relationship-diagram)
3. [Relationship Details](#relationship-details)
4. [Category Hierarchy](#category-hierarchy)
5. [Database Schema Recommendations](#database-schema-recommendations)
6. [Query Patterns](#query-patterns)
7. [Data Integrity Constraints](#data-integrity-constraints)

---

## Entity Overview

### Core Entities

#### 1. **User** (Future/Optional for MVP)
- **Purpose**: Represents system users
- **MVP Status**: Optional (local-only initially)
- **Relationships**: Owns Items, creates Categories, manages Locations

#### 2. **Item** (Primary Entity)
- **Purpose**: Represents inventory items
- **MVP Status**: Required
- **Relationships**: Belongs to Category, stored at Location, has multiple Tags, contains multiple Images

#### 3. **Category** (Core Taxonomy)
- **Purpose**: Hierarchical classification system
- **MVP Status**: Required
- **Relationships**: Has many Items, may have Parent Category, may have Child Categories

#### 4. **Location** (Spatial Organization)
- **Purpose**: Physical storage locations
- **MVP Status**: Phase 2
- **Relationships**: Has many Items, may have Parent Location, may have Child Locations

#### 5. **Tag** (Flexible Metadata)
- **Purpose**: User-defined labels for flexible categorization
- **MVP Status**: Phase 2
- **Relationships**: Applied to many Items (many-to-many)

#### 6. **Image** (Visual Assets)
- **Purpose**: Photos of inventory items
- **MVP Status**: Required
- **Relationships**: Belongs to Item, one designated as primary

#### 7. **ItemTag** (Junction Table)
- **Purpose**: Many-to-many relationship between Items and Tags
- **MVP Status**: Phase 2
- **Relationships**: Links Item and Tag

---

## Entity-Relationship Diagram

### ERD Notation
```
[Entity] ──relationship──> [Entity]
1        : One
*        : Many
0..1     : Zero or One (Optional)
1..*     : One or More
0..*     : Zero or More
```

### Primary Relationships

```
┌──────────┐
│   USER   │ (Optional for MVP)
└────┬─────┘
     │ 1
     │ owns
     │ *
┌────▼──────────┐      ┌─────────────┐
│     ITEM      │──────│   IMAGE     │
│               │ 1  * │             │
│ - id          │◄─────│ - id        │
│ - name        │ has  │ - url       │
│ - description │      │ - isPrimary │
│ - value       │      │ - itemId FK │
│ - condition   │      └─────────────┘
│ - createdAt   │
└───┬───────┬───┘
    │ *     │ *
    │       │
    │ *     │ * belongs to
    │       │
┌───▼───────▼───┐      ┌──────────────┐
│   CATEGORY    │      │   LOCATION   │
│               │      │              │
│ - id          │      │ - id         │
│ - name        │      │ - name       │
│ - icon        │      │ - parentId   │
│ - color       │      └──────────────┘
│ - parentId FK │
└───────────────┘
    │ *
    │ self-reference
    │ 0..1
    │ parent/child hierarchy


┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│     ITEM     │──────│   ITEM_TAG   │──────│     TAG      │
│              │ 1  * │              │ *  1 │              │
│              │─────▶│ - itemId FK  │◄─────│ - id         │
│              │ has  │ - tagId FK   │ has  │ - name       │
│              │      │ - createdAt  │      │ - color      │
└──────────────┘      └──────────────┘      └──────────────┘
     Many-to-Many Relationship via Junction Table
```

### Complete ERD (All Entities)

```
                    ┌──────────────┐
                    │     USER     │ (Future)
                    │──────────────│
                    │ id (PK)      │
                    │ email        │
                    │ name         │
                    │ createdAt    │
                    └──────┬───────┘
                           │ 1
                           │ owns
                           │ *
    ┌──────────────────────┴────────────────────────┐
    │                                                │
    ▼                                                ▼
┌──────────────┐                            ┌──────────────┐
│   CATEGORY   │                            │   LOCATION   │
│──────────────│                            │──────────────│
│ id (PK)      │                            │ id (PK)      │
│ name         │                            │ name         │
│ description  │◄─────┐                     │ description  │◄─────┐
│ icon         │ 0..1 │                     │ parentId FK  │ 0..1 │
│ color        │ *    │ parent              │ createdAt    │ *    │
│ parentId FK  │──────┘ /child              └──────┬───────┘──────┘
│ userId FK    │        hierarchy                  │ 1
│ createdAt    │                                   │ located at
└──────┬───────┘                                   │ *
       │ 1                                         │
       │ categorizes                  ┌────────────┴────────────┐
       │ *                            │                         │
       │                              │                         │
       ▼                              ▼                         │
┌──────────────────────────────────────────────┐               │
│                    ITEM                      │               │
│──────────────────────────────────────────────│               │
│ id (PK)                                      │               │
│ name                                         │               │
│ description                                  │               │
│ purchaseDate                                 │               │
│ purchasePrice                                │               │
│ currentValue                                 │               │
│ condition (enum)                             │               │
│ notes                                        │               │
│ categoryId (FK) ─────────────────────────────┘               │
│ locationId (FK) ─────────────────────────────────────────────┘
│ userId (FK)
│ createdAt
│ updatedAt
└────────┬──────────┬─────────────┘
         │ 1        │ 1
         │ has      │ tagged with
         │ *        │ *
         │          │
         ▼          ▼
┌──────────────┐  ┌──────────────┐      ┌──────────────┐
│    IMAGE     │  │   ITEM_TAG   │──────│     TAG      │
│──────────────│  │──────────────│ *  1 │──────────────│
│ id (PK)      │  │ itemId (FK)  │─────▶│ id (PK)      │
│ url          │  │ tagId (FK)   │      │ name         │
│ fileName     │  │ createdAt    │      │ color        │
│ fileSize     │  └──────────────┘      │ userId FK    │
│ mimeType     │   (Junction Table)     │ createdAt    │
│ width        │                         └──────────────┘
│ height       │
│ isPrimary    │
│ sortOrder    │
│ itemId (FK)  │
│ createdAt    │
└──────────────┘
```

---

## Relationship Details

### 1. Item-to-Category Relationship

**Type**: Many-to-One (Required)

**Description**: Each item belongs to exactly one category. Categories can have many items.

**Rationale**:
- Enforces single primary classification
- Simplifies queries and filtering
- Prevents confusion with multiple categories per item

**Database Implementation**:
```sql
-- Item Table
CREATE TABLE items (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  ...
);

-- Index for fast lookups
CREATE INDEX idx_items_category ON items(category_id);
```

**Business Rules**:
- ✅ Item MUST have a category
- ✅ Category can be deleted only if no items reference it (or items are reassigned)
- ✅ Changing category is allowed anytime
- ❌ Item cannot have multiple primary categories (use tags for cross-classification)

**Query Examples**:
```sql
-- Get all items in Electronics category
SELECT * FROM items WHERE category_id = 'electronics-uuid';

-- Get item with its category
SELECT i.*, c.name as category_name
FROM items i
JOIN categories c ON i.category_id = c.id
WHERE i.id = 'item-uuid';

-- Count items per category
SELECT c.name, COUNT(i.id) as item_count
FROM categories c
LEFT JOIN items i ON c.id = i.category_id
GROUP BY c.id, c.name;
```

### 2. Category Hierarchy (Self-Referencing)

**Type**: One-to-Many (Self-Referential, Optional)

**Description**: Categories can have parent categories, creating a tree structure.

**Rationale**:
- Enables nested organization (e.g., Electronics > Computers > Laptops)
- Supports breadcrumb navigation
- Allows inheritance of properties (future enhancement)

**Database Implementation**:
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  icon VARCHAR(50),
  color VARCHAR(20),
  description TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- Future
  created_at TIMESTAMP DEFAULT NOW(),

  -- Prevent circular references
  CONSTRAINT no_self_reference CHECK (id != parent_id)
);

-- Index for hierarchy queries
CREATE INDEX idx_categories_parent ON categories(parent_id);
```

**Business Rules**:
- ✅ Top-level categories have `parent_id = NULL`
- ✅ Maximum nesting depth: 5 levels (enforced in application)
- ❌ Circular references not allowed (e.g., A → B → A)
- ✅ Deleting parent moves children up one level OR deletes cascade (configurable)

**Hierarchy Query Examples**:

**Get Category Path (Breadcrumb)**:
```sql
-- Recursive CTE to get full path
WITH RECURSIVE category_path AS (
  -- Base case: start with target category
  SELECT id, name, parent_id, 0 as depth, name as path
  FROM categories
  WHERE id = 'target-category-uuid'

  UNION ALL

  -- Recursive case: traverse up to parents
  SELECT c.id, c.name, c.parent_id, cp.depth + 1, c.name || ' > ' || cp.path
  FROM categories c
  JOIN category_path cp ON c.id = cp.parent_id
)
SELECT * FROM category_path ORDER BY depth DESC LIMIT 1;

-- Result: "Home > Electronics > Computers > Laptops"
```

**Get All Children (Subcategories)**:
```sql
WITH RECURSIVE subcategories AS (
  -- Base case: parent category
  SELECT id, name, parent_id, 0 as depth
  FROM categories
  WHERE id = 'parent-category-uuid'

  UNION ALL

  -- Recursive case: get all descendants
  SELECT c.id, c.name, c.parent_id, sc.depth + 1
  FROM categories c
  JOIN subcategories sc ON c.parent_id = sc.id
)
SELECT * FROM subcategories ORDER BY depth, name;
```

**Get Item Count Including Subcategories**:
```sql
WITH RECURSIVE category_tree AS (
  SELECT id FROM categories WHERE id = 'parent-uuid'
  UNION ALL
  SELECT c.id FROM categories c
  JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT COUNT(*) as total_items
FROM items
WHERE category_id IN (SELECT id FROM category_tree);
```

### 3. Item-to-Location Relationship

**Type**: Many-to-One (Optional)

**Description**: Items can be assigned to storage locations. Locations can contain many items.

**Rationale**:
- Helps users remember where items are stored
- Enables location-based searches ("Show items in garage")
- Supports moving items between locations

**Database Implementation**:
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add location reference to items
ALTER TABLE items ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Index for queries
CREATE INDEX idx_items_location ON items(location_id);
CREATE INDEX idx_locations_parent ON locations(parent_id);
```

**Business Rules**:
- ✅ Location is optional (items can have `location_id = NULL`)
- ✅ Locations support hierarchy (e.g., House > First Floor > Master Bedroom > Closet)
- ✅ Deleting location sets items' `location_id` to NULL (doesn't delete items)
- ✅ Items can be moved between locations freely

**Query Examples**:
```sql
-- Get items in specific location
SELECT * FROM items WHERE location_id = 'garage-uuid';

-- Get items in location and all child locations
WITH RECURSIVE location_tree AS (
  SELECT id FROM locations WHERE id = 'house-uuid'
  UNION ALL
  SELECT l.id FROM locations l
  JOIN location_tree lt ON l.parent_id = lt.id
)
SELECT i.* FROM items i
WHERE i.location_id IN (SELECT id FROM location_tree);
```

### 4. Item-to-Tag Relationship

**Type**: Many-to-Many (via Junction Table)

**Description**: Items can have multiple tags, and tags can be applied to multiple items.

**Rationale**:
- Provides flexible cross-category classification
- Enables faceted filtering (e.g., "vintage + electronics + gift")
- User-defined taxonomy alongside structured categories

**Database Implementation**:
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  color VARCHAR(20),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE item_tags (
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (item_id, tag_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_item_tags_item ON item_tags(item_id);
CREATE INDEX idx_item_tags_tag ON item_tags(tag_id);
```

**Business Rules**:
- ✅ Items can have 0 to unlimited tags
- ✅ Tags can be applied to 0 to unlimited items
- ✅ Tag names must be unique per user
- ✅ Deleting item removes its tag associations (CASCADE)
- ✅ Deleting tag removes all associations (CASCADE)
- ✅ Unused tags (no items) can be auto-archived (optional)

**Query Examples**:
```sql
-- Get all tags for an item
SELECT t.* FROM tags t
JOIN item_tags it ON t.id = it.tag_id
WHERE it.item_id = 'item-uuid';

-- Get all items with a specific tag
SELECT i.* FROM items i
JOIN item_tags it ON i.id = it.item_id
WHERE it.tag_id = 'vintage-tag-uuid';

-- Get items with multiple tags (AND logic)
SELECT i.* FROM items i
WHERE i.id IN (
  SELECT item_id FROM item_tags WHERE tag_id = 'tag1-uuid'
)
AND i.id IN (
  SELECT item_id FROM item_tags WHERE tag_id = 'tag2-uuid'
);

-- Get items with any of several tags (OR logic)
SELECT DISTINCT i.* FROM items i
JOIN item_tags it ON i.id = it.item_id
WHERE it.tag_id IN ('tag1-uuid', 'tag2-uuid', 'tag3-uuid');

-- Get tag usage counts
SELECT t.name, COUNT(it.item_id) as item_count
FROM tags t
LEFT JOIN item_tags it ON t.id = it.tag_id
GROUP BY t.id, t.name
ORDER BY item_count DESC;
```

### 5. Item-to-Image Relationship

**Type**: One-to-Many (Required)

**Description**: Items can have multiple images. Each image belongs to exactly one item.

**Rationale**:
- Visual identification is core to inventory management
- Multiple angles/perspectives improve item documentation
- Primary image for thumbnails and list views

**Database Implementation**:
```sql
CREATE TABLE images (
  id UUID PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  url TEXT NOT NULL, -- S3/Cloudinary URL
  file_name VARCHAR(255),
  file_size INTEGER, -- in bytes
  mime_type VARCHAR(50), -- image/jpeg, image/png
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_images_item ON images(item_id);
CREATE INDEX idx_images_primary ON images(item_id, is_primary);

-- Constraint: Only one primary image per item
CREATE UNIQUE INDEX idx_images_one_primary
ON images(item_id)
WHERE is_primary = TRUE;
```

**Business Rules**:
- ✅ Items should have at least 1 image (recommended, not enforced)
- ✅ Maximum 5 images per item (enforced in application)
- ✅ Exactly ONE image marked as primary per item
- ✅ Deleting item CASCADE deletes all its images
- ✅ Images stored externally (S3, Cloudinary), only URL in database
- ✅ Image order controlled by `sort_order` field

**Query Examples**:
```sql
-- Get primary image for item
SELECT * FROM images
WHERE item_id = 'item-uuid' AND is_primary = TRUE;

-- Get all images for item (sorted)
SELECT * FROM images
WHERE item_id = 'item-uuid'
ORDER BY sort_order, created_at;

-- Get items without images
SELECT i.* FROM items i
LEFT JOIN images img ON i.id = img.item_id
WHERE img.id IS NULL;

-- Update primary image
BEGIN;
  -- Remove primary flag from current primary
  UPDATE images SET is_primary = FALSE
  WHERE item_id = 'item-uuid' AND is_primary = TRUE;

  -- Set new primary
  UPDATE images SET is_primary = TRUE
  WHERE id = 'new-primary-image-uuid';
COMMIT;
```

### 6. User-to-Entities Relationships (Future/Multi-Tenant)

**Type**: One-to-Many (for all user-owned entities)

**Description**: Users own items, categories, locations, and tags.

**Rationale**:
- Enables multi-user/multi-tenant system
- Data isolation between users
- Authentication and authorization

**Database Implementation**:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add user_id to all owned entities
ALTER TABLE items ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE locations ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE tags ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Indexes for user data queries
CREATE INDEX idx_items_user ON items(user_id);
CREATE INDEX idx_categories_user ON categories(user_id);
CREATE INDEX idx_locations_user ON locations(user_id);
CREATE INDEX idx_tags_user ON tags(user_id);
```

**Business Rules**:
- ✅ MVP: User ID optional (local-only mode, single user)
- ✅ Future: User ID required (cloud/multi-tenant)
- ✅ Deleting user CASCADE deletes all their data
- ✅ Users cannot access other users' data (enforced in middleware)

---

## Category Hierarchy

### Hierarchy Structure

**Maximum Depth**: 5 levels

**Example Structure**:
```
Level 1: Home
├─ Level 2: Electronics
│  ├─ Level 3: Computers
│  │  ├─ Level 4: Laptops
│  │  │  └─ Level 5: Gaming Laptops
│  │  └─ Level 4: Desktops
│  └─ Level 3: Mobile Devices
│     ├─ Level 4: Smartphones
│     └─ Level 4: Tablets
├─ Level 2: Furniture
│  ├─ Level 3: Living Room
│  │  ├─ Level 4: Seating
│  │  │  ├─ Level 5: Sofas
│  │  │  └─ Level 5: Chairs
│  │  └─ Level 4: Tables
│  └─ Level 3: Bedroom
└─ Level 2: Appliances
```

### Hierarchical Queries

**Materialized Path Pattern** (Alternative to Recursive CTEs):
```sql
-- Add path column to categories
ALTER TABLE categories ADD COLUMN path VARCHAR(500);

-- Example paths:
-- 'home'
-- 'home/electronics'
-- 'home/electronics/computers'
-- 'home/electronics/computers/laptops'

-- Get all descendants
SELECT * FROM categories
WHERE path LIKE 'home/electronics%';

-- Get direct children only
SELECT * FROM categories
WHERE parent_id = 'electronics-uuid';

-- Get depth level
SELECT *, LENGTH(path) - LENGTH(REPLACE(path, '/', '')) as depth
FROM categories;
```

**Closure Table Pattern** (For Complex Hierarchies):
```sql
-- Separate table tracking all ancestor-descendant relationships
CREATE TABLE category_closure (
  ancestor_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  descendant_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  depth INTEGER NOT NULL, -- 0 = self, 1 = direct child, etc.
  PRIMARY KEY (ancestor_id, descendant_id)
);

-- Example entries for: Home > Electronics > Computers
-- (home, home, 0)
-- (home, electronics, 1)
-- (home, computers, 2)
-- (electronics, electronics, 0)
-- (electronics, computers, 1)
-- (computers, computers, 0)

-- Get all descendants of Electronics
SELECT c.* FROM categories c
JOIN category_closure cc ON c.id = cc.descendant_id
WHERE cc.ancestor_id = 'electronics-uuid' AND cc.depth > 0;

-- Get full path
SELECT c.name FROM categories c
JOIN category_closure cc ON c.id = cc.ancestor_id
WHERE cc.descendant_id = 'laptops-uuid'
ORDER BY cc.depth DESC;
```

---

## Database Schema Recommendations

### Schema Design Principles

1. **Normalization**: 3NF (Third Normal Form) to minimize redundancy
2. **Referential Integrity**: Use foreign keys with appropriate ON DELETE actions
3. **Indexing**: Index all foreign keys and frequently queried columns
4. **Timestamps**: Track `created_at` and `updated_at` on all tables
5. **UUIDs**: Use UUIDs for primary keys (better for distributed systems)
6. **Soft Deletes** (Optional): Add `deleted_at` column instead of hard deletes

### Complete Schema (SQL)

```sql
-- Enable UUID extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE (Future)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- CATEGORIES TABLE
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50), -- Icon identifier (e.g., 'laptop', 'home')
  color VARCHAR(20), -- Hex color code
  parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT no_self_reference CHECK (id != parent_id),
  CONSTRAINT unique_name_per_parent UNIQUE (name, parent_id, user_id)
);

-- LOCATIONS TABLE
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT no_self_reference_location CHECK (id != parent_id)
);

-- ITEMS TABLE
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(12, 2),
  current_value DECIMAL(12, 2),
  condition VARCHAR(20) CHECK (condition IN ('excellent', 'good', 'fair', 'poor')),
  notes TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  location_id UUID REFERENCES locations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- IMAGES TABLE
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  file_name VARCHAR(255),
  file_size INTEGER, -- bytes
  mime_type VARCHAR(50),
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- TAGS TABLE
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL,
  color VARCHAR(20),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT unique_tag_name_per_user UNIQUE (name, user_id)
);

-- ITEM_TAGS JUNCTION TABLE
CREATE TABLE item_tags (
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),

  PRIMARY KEY (item_id, tag_id)
);

-- INDEXES
-- Categories
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_user ON categories(user_id);

-- Locations
CREATE INDEX idx_locations_parent ON locations(parent_id);
CREATE INDEX idx_locations_user ON locations(user_id);

-- Items
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_location ON items(location_id);
CREATE INDEX idx_items_user ON items(user_id);
CREATE INDEX idx_items_name ON items(name); -- For search
CREATE INDEX idx_items_created ON items(created_at DESC); -- For sorting

-- Full-text search (PostgreSQL)
CREATE INDEX idx_items_search ON items USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Images
CREATE INDEX idx_images_item ON images(item_id);
CREATE INDEX idx_images_primary ON images(item_id, is_primary);
CREATE UNIQUE INDEX idx_images_one_primary ON images(item_id) WHERE is_primary = TRUE;

-- Tags
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_user ON tags(user_id);

-- Item Tags
CREATE INDEX idx_item_tags_item ON item_tags(item_id);
CREATE INDEX idx_item_tags_tag ON item_tags(tag_id);

-- TRIGGERS
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Query Patterns

### Common Query Patterns

#### 1. Get Item with All Related Data
```sql
SELECT
  i.*,
  c.name as category_name,
  c.icon as category_icon,
  c.color as category_color,
  l.name as location_name,
  json_agg(DISTINCT jsonb_build_object('id', img.id, 'url', img.url, 'isPrimary', img.is_primary)) as images,
  json_agg(DISTINCT jsonb_build_object('id', t.id, 'name', t.name, 'color', t.color)) as tags
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN locations l ON i.location_id = l.id
LEFT JOIN images img ON i.id = img.item_id
LEFT JOIN item_tags it ON i.id = it.item_id
LEFT JOIN tags t ON it.tag_id = t.id
WHERE i.id = 'item-uuid'
GROUP BY i.id, c.id, l.id;
```

#### 2. Search Items (Full-Text)
```sql
-- PostgreSQL full-text search
SELECT i.*, ts_rank(to_tsvector('english', i.name || ' ' || COALESCE(i.description, '')), query) as rank
FROM items i, to_tsquery('english', 'laptop | computer') query
WHERE to_tsvector('english', i.name || ' ' || COALESCE(i.description, '')) @@ query
ORDER BY rank DESC;
```

#### 3. Filter Items with Multiple Criteria
```sql
SELECT DISTINCT i.*
FROM items i
LEFT JOIN item_tags it ON i.id = it.item_id
WHERE
  (i.name ILIKE '%laptop%' OR i.description ILIKE '%laptop%')
  AND i.category_id IN ('electronics-uuid', 'computers-uuid')
  AND i.current_value BETWEEN 500 AND 2000
  AND i.created_at > '2024-01-01'
  AND it.tag_id IN ('vintage-tag-uuid', 'gift-tag-uuid')
ORDER BY i.created_at DESC
LIMIT 50;
```

#### 4. Get Category Hierarchy with Item Counts
```sql
WITH RECURSIVE category_tree AS (
  -- Root categories
  SELECT id, name, parent_id, 0 as depth, ARRAY[name] as path
  FROM categories
  WHERE parent_id IS NULL

  UNION ALL

  -- Recursive: get children
  SELECT c.id, c.name, c.parent_id, ct.depth + 1, ct.path || c.name
  FROM categories c
  JOIN category_tree ct ON c.parent_id = ct.id
  WHERE ct.depth < 5 -- Prevent infinite recursion
)
SELECT
  ct.*,
  COUNT(i.id) as direct_item_count,
  array_to_string(ct.path, ' > ') as full_path
FROM category_tree ct
LEFT JOIN items i ON ct.id = i.category_id
GROUP BY ct.id, ct.name, ct.parent_id, ct.depth, ct.path
ORDER BY ct.path;
```

#### 5. Get Items Expiring Soon (Warranty/Insurance)
```sql
-- Future enhancement: add warranty_expires_at to items table
SELECT i.*,
  (i.warranty_expires_at - CURRENT_DATE) as days_until_expiry
FROM items i
WHERE i.warranty_expires_at IS NOT NULL
  AND i.warranty_expires_at BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY i.warranty_expires_at ASC;
```

---

## Data Integrity Constraints

### Referential Integrity Rules

#### ON DELETE Actions

| Parent → Child | Action | Rationale |
|----------------|--------|-----------|
| Category → Item | RESTRICT | Prevent deleting categories with items |
| Item → Image | CASCADE | Delete images when item deleted |
| Item → ItemTag | CASCADE | Remove tag associations when item deleted |
| Tag → ItemTag | CASCADE | Remove associations when tag deleted |
| Location → Item | SET NULL | Keep items when location deleted |
| User → All | CASCADE | Delete all user data when user deleted |
| Category → Category (parent) | CASCADE | Delete subcategories when parent deleted |

#### Validation Rules

**Items**:
- ✅ Name required (1-255 characters)
- ✅ Category required (cannot be null)
- ✅ Condition must be: excellent, good, fair, or poor
- ✅ Prices and values must be non-negative
- ✅ Purchase date cannot be in future

**Categories**:
- ✅ Name required (1-100 characters)
- ✅ Cannot be its own parent (prevent circular reference)
- ✅ Name must be unique within same parent
- ✅ Maximum depth: 5 levels (enforced in application)

**Images**:
- ✅ URL required
- ✅ Only one primary image per item
- ✅ File size < 10MB
- ✅ Mime type must be image/*

**Tags**:
- ✅ Name required (1-50 characters)
- ✅ Name must be unique per user
- ✅ No duplicate tags on same item

### Database Constraints (PostgreSQL)

```sql
-- Check constraints
ALTER TABLE items ADD CONSTRAINT chk_purchase_price CHECK (purchase_price >= 0);
ALTER TABLE items ADD CONSTRAINT chk_current_value CHECK (current_value >= 0);
ALTER TABLE items ADD CONSTRAINT chk_purchase_date CHECK (purchase_date <= CURRENT_DATE);

-- Unique constraints
ALTER TABLE categories ADD CONSTRAINT uq_category_name_parent UNIQUE (name, parent_id, user_id);
ALTER TABLE tags ADD CONSTRAINT uq_tag_name_user UNIQUE (name, user_id);

-- Foreign key constraints with specific actions
ALTER TABLE items
  ADD CONSTRAINT fk_items_category
  FOREIGN KEY (category_id)
  REFERENCES categories(id)
  ON DELETE RESTRICT;

ALTER TABLE images
  ADD CONSTRAINT fk_images_item
  FOREIGN KEY (item_id)
  REFERENCES items(id)
  ON DELETE CASCADE;
```

---

## Summary

### Key Relationships
1. **Item ↔ Category**: Many-to-One (Required)
2. **Category ↔ Category**: Self-Referential Hierarchy (Optional, Max 5 Levels)
3. **Item ↔ Location**: Many-to-One (Optional)
4. **Location ↔ Location**: Self-Referential Hierarchy (Optional)
5. **Item ↔ Tag**: Many-to-Many (via ItemTag junction)
6. **Item ↔ Image**: One-to-Many (One Primary Image)
7. **User ↔ All Entities**: One-to-Many (Future Multi-Tenant)

### Database Recommendations
- **PostgreSQL**: Best choice for complex queries, full-text search, JSONB support
- **SQLite**: Good for MVP/local-first version
- **MongoDB**: Alternative for document-based approach (less suitable for hierarchies)

### Performance Considerations
- Index all foreign keys
- Index search columns (name, description)
- Use materialized views for complex aggregations
- Implement pagination for large result sets
- Cache category hierarchy in application memory

---

**Document Status**: Complete
**Next Steps**: Security analysis, database implementation
**Coordination**: Share with Architect and Coder agents
**Memory Key**: `swarm/analyst/data-relationships-complete`
