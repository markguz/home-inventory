-- Migration: Add Authentication System
-- Description: Adds User, Session, Account, and VerificationToken models for NextAuth.js v5
-- Date: 2025-10-12
-- Author: Database Architect Agent

-- Create UserRole enum (SQLite doesn't have native enums, handled by Prisma)
-- Enum values: USER, ADMIN

-- Create User table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "emailVerified" DATETIME,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Create index on email for fast lookups
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");

-- Create Session table for NextAuth.js session management
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for Session
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- Create Account table for OAuth providers (future extensibility)
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for Account
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- Create VerificationToken table for email verification (future)
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires" DATETIME NOT NULL
);

-- Create indexes for VerificationToken
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- Add userId column to Item table (existing table modification)
-- Note: For existing databases, this will require data migration
-- All existing items will need to be assigned to a user

-- Step 1: Add userId column (nullable temporarily for migration)
ALTER TABLE "Item" ADD COLUMN "userId" TEXT;

-- Step 2: Create index on userId
CREATE INDEX "Item_userId_idx" ON "Item"("userId");

-- Step 3: After data migration (assigning items to users), add foreign key constraint
-- This step should be done manually after ensuring all items have a userId
-- ALTER TABLE "Item" ADD CONSTRAINT "Item_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- IMPORTANT NOTES:
-- 1. Before running this migration in production, create a default admin user
-- 2. Assign all existing items to the admin user or appropriate users
-- 3. After data migration, uncomment and run the foreign key constraint
-- 4. Consider making userId NOT NULL after data migration is complete
-- 5. Password field stores HASHED passwords only - never plain text
-- 6. Use bcrypt or argon2 for password hashing with appropriate cost factor
