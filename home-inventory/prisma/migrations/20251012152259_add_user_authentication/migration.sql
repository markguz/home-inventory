-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "minQuantity" INTEGER,
    "purchaseDate" DATETIME,
    "purchasePrice" REAL,
    "currentValue" REAL,
    "condition" TEXT DEFAULT 'good',
    "notes" TEXT,
    "imageUrl" TEXT,
    "barcode" TEXT,
    "serialNumber" TEXT,
    "warrantyUntil" DATETIME,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Item_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("barcode", "categoryId", "condition", "createdAt", "currentValue", "description", "id", "imageUrl", "locationId", "minQuantity", "name", "notes", "purchaseDate", "purchasePrice", "quantity", "serialNumber", "updatedAt", "userId", "warrantyUntil") SELECT "barcode", "categoryId", "condition", "createdAt", "currentValue", "description", "id", "imageUrl", "locationId", "minQuantity", "name", "notes", "purchaseDate", "purchasePrice", "quantity", "serialNumber", "updatedAt", "userId", "warrantyUntil" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX "Item_userId_idx" ON "Item"("userId");
CREATE INDEX "Item_categoryId_idx" ON "Item"("categoryId");
CREATE INDEX "Item_locationId_idx" ON "Item"("locationId");
CREATE INDEX "Item_name_idx" ON "Item"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
