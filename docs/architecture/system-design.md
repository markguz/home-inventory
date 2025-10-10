# Home Inventory System - System Architecture Design

## Document Information
- **Version**: 1.0.0
- **Date**: 2025-10-10
- **Architect**: System Architecture Designer (Hive Mind)
- **Status**: Design Complete

---

## 1. Executive Summary

This document defines the complete system architecture for a modern home inventory management system built with Next.js 14 App Router, Drizzle ORM, and shadcn/ui. The architecture is designed to be:

- **Scalable**: Start with SQLite/Turso, migrate to PostgreSQL when needed
- **Maintainable**: Clear separation of concerns, modular design
- **Performant**: Leverages React Server Components, edge-ready
- **Type-safe**: TypeScript throughout with end-to-end type safety
- **User-friendly**: Accessible, responsive, intuitive UI

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Browser)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │     Next.js 14 App Router (React Server Components)  │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTPS
                   │
┌──────────────────▼──────────────────────────────────────────┐
│                  Application Server (Vercel)                 │
│  ┌────────────────────┐       ┌────────────────────────┐   │
│  │  Server Components │       │   Server Actions       │   │
│  │  (Data Fetching)   │       │   (Mutations)         │   │
│  └────────────────────┘       └────────────────────────┘   │
│  ┌────────────────────┐       ┌────────────────────────┐   │
│  │   API Routes       │       │   Image Upload         │   │
│  │  (Complex Queries) │       │   Handler              │   │
│  └────────────────────┘       └────────────────────────┘   │
└──────────────────┬──────────────────────┬──────────────────┘
                   │                       │
                   │                       │
      ┌────────────▼────────────┐         │
      │  Database (Drizzle ORM) │         │
      │  ┌──────────────────┐  │         │
      │  │ SQLite/Turso     │  │         │
      │  │ (MVP/Scale)      │  │         │
      │  └──────────────────┘  │         │
      │  ┌──────────────────┐  │         │
      │  │ PostgreSQL       │  │         │
      │  │ (Production)     │  │         │
      │  └──────────────────┘  │         │
      └─────────────────────────┘         │
                                           │
                              ┌────────────▼─────────────┐
                              │  Image Storage           │
                              │  ┌───────────────────┐  │
                              │  │ Cloudinary CDN    │  │
                              │  │ (Optimized)       │  │
                              │  └───────────────────┘  │
                              └──────────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 App Router | Server-first React framework |
| **UI Library** | shadcn/ui + Radix UI | Accessible component primitives |
| **Styling** | Tailwind CSS | Utility-first CSS framework |
| **Forms** | React Hook Form + Zod | Type-safe form handling |
| **ORM** | Drizzle ORM | Lightweight, type-safe database layer |
| **Database** | SQLite/Turso → PostgreSQL | Start simple, scale when needed |
| **Images** | Cloudinary | CDN with automatic optimization |
| **Data Tables** | TanStack Table | Powerful, headless table library |
| **State Management** | React Query + Context | Server/client state separation |
| **Type Safety** | TypeScript | End-to-end type safety |

---

## 3. Architecture Decision Records (ADRs)

### ADR-001: Use Next.js 14 App Router
**Decision**: Adopt Next.js 14 with App Router over Pages Router.

**Rationale**:
- React Server Components reduce client JavaScript
- Better data fetching patterns
- Improved performance and DX
- Future of Next.js

### ADR-002: Choose Drizzle ORM over Prisma
**Decision**: Use Drizzle ORM as the database layer.

**Rationale**:
- Lightweight (7.4KB vs 170KB)
- Better performance (no runtime overhead)
- SQL-like syntax
- Edge runtime support
- No code generation step

### ADR-003: Start with SQLite, Plan for PostgreSQL
**Decision**: Use SQLite for MVP, migrate to PostgreSQL for scale.

**Rationale**:
- Zero configuration for MVP
- Fast local development
- Easy migration path via Turso
- Cost-effective for small user bases

### ADR-004: Use shadcn/ui over Component Libraries
**Decision**: Adopt shadcn/ui instead of MUI or other libraries.

**Rationale**:
- Full code ownership
- No bundle size concerns
- Excellent accessibility via Radix
- Perfect for customization
- Works seamlessly with RSC

### ADR-005: Cloudinary for Image Management
**Decision**: Use Cloudinary for image storage and optimization.

**Rationale**:
- Generous free tier (25GB)
- Automatic optimization
- Global CDN included
- On-the-fly transformations
- Easy integration

---

## 4. Conclusion

This architecture provides a solid foundation for building a scalable, maintainable home inventory system. The design emphasizes:

1. **Modern practices**: Server Components, Server Actions, TypeScript
2. **Performance**: Edge-ready, optimized images, minimal JavaScript
3. **Developer experience**: Type safety, hot reload, intuitive structure
4. **Scalability**: Start simple, grow as needed
5. **Maintainability**: Clear separation, modular design

The architecture is production-ready for MVP launch and designed to scale gracefully as the user base grows.

For complete documentation, refer to:
- `/docs/architecture/database-schema.md` - Database design
- `/docs/architecture/component-structure.md` - Component hierarchy
- `/docs/architecture/api-design.md` - API patterns
