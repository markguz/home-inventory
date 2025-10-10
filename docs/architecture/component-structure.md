# Component Architecture

## Overview

This document defines the component hierarchy, organization principles, and best practices for the React component architecture in the home inventory system.

## Component Organization Philosophy

### Principles

1. **Colocation**: Keep related files together
2. **Single Responsibility**: Each component has one clear purpose
3. **Composition**: Build complex UIs from simple components
4. **Reusability**: Design for reuse without over-abstraction
5. **Type Safety**: Full TypeScript coverage with strict mode

## Component Directory Structure

```
components/
├── ui/                          # Base UI components (shadcn/ui)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── select.tsx
│   ├── checkbox.tsx
│   ├── radio-group.tsx
│   ├── textarea.tsx
│   ├── badge.tsx
│   ├── avatar.tsx
│   ├── toast.tsx
│   └── index.ts               # Barrel export
│
├── layout/                      # Layout components
│   ├── header.tsx
│   ├── footer.tsx
│   ├── sidebar.tsx
│   ├── navigation.tsx
│   ├── page-layout.tsx
│   ├── auth-layout.tsx
│   └── index.ts
│
├── items/                       # Item-related components
│   ├── item-card.tsx
│   ├── item-list.tsx
│   ├── item-grid.tsx
│   ├── item-detail.tsx
│   ├── item-form.tsx
│   ├── item-image.tsx
│   ├── item-stats.tsx
│   ├── item-filters.tsx
│   └── index.ts
│
├── categories/                  # Category components
│   ├── category-tree.tsx
│   ├── category-selector.tsx
│   ├── category-form.tsx
│   ├── category-badge.tsx
│   └── index.ts
│
├── locations/                   # Location components
│   ├── location-selector.tsx
│   ├── location-form.tsx
│   ├── location-list.tsx
│   └── index.ts
│
├── tags/                        # Tag components
│   ├── tag-input.tsx
│   ├── tag-list.tsx
│   ├── tag-filter.tsx
│   ├── tag-badge.tsx
│   └── index.ts
│
├── search/                      # Search components
│   ├── search-bar.tsx
│   ├── search-filters.tsx
│   ├── search-results.tsx
│   ├── advanced-search.tsx
│   └── index.ts
│
├── forms/                       # Reusable form components
│   ├── form-field.tsx
│   ├── form-error.tsx
│   ├── form-label.tsx
│   ├── form-section.tsx
│   ├── image-upload.tsx
│   ├── date-picker.tsx
│   └── index.ts
│
└── shared/                      # Shared utility components
    ├── loading-spinner.tsx
    ├── loading-skeleton.tsx
    ├── error-boundary.tsx
    ├── empty-state.tsx
    ├── confirmation-dialog.tsx
    ├── pagination.tsx
    ├── data-table.tsx
    └── index.ts
```

## Component Categories

### 1. UI Components (Primitives)

**Purpose**: Atomic, reusable UI building blocks

**Source**: Shadcn/ui (Radix UI primitives)

**Characteristics**:
- No business logic
- Highly reusable
- Fully accessible (ARIA)
- Consistent styling via Tailwind

**Example: Button Component**
```typescript
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

### 2. Layout Components

**Purpose**: Page structure and navigation

**Characteristics**:
- Server Components (default)
- Handle routing and navigation
- Responsive design
- Consistent layouts

**Example: Header Component**
```typescript
// components/layout/header.tsx
import Link from "next/link"
import { Search, Bell, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchBar } from "@/components/search/search-bar"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold">HomeInventory</span>
          </Link>
          <nav className="hidden md:flex gap-4">
            <Link href="/items" className="text-sm font-medium">Items</Link>
            <Link href="/categories" className="text-sm font-medium">Categories</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <SearchBar className="w-[300px]" />
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
```

### 3. Feature Components (Items)

**Purpose**: Item-specific UI components

**Characteristics**:
- Business logic aware
- Data-driven
- Composable
- Reusable within domain

**Example: Item Card Component**
```typescript
// components/items/item-card.tsx
"use client"

import Image from "next/image"
import Link from "next/link"
import { MoreVertical, MapPin, Calendar, DollarSign } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, formatDate } from "@/lib/utils"
import type { Item } from "@/types/database"

interface ItemCardProps {
  item: Item & {
    category: { name: string; color?: string }
    location?: { name: string }
    tags: Array<{ tag: { name: string; color?: string } }>
  }
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={`/items/${item.id}`}>
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/items/${item.id}`}>
              <h3 className="font-semibold truncate hover:text-primary">
                {item.name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {item.description}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(item.id)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(item.id)}
                className="text-destructive"
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-3 flex flex-wrap gap-1">
          <Badge
            variant="secondary"
            style={{ backgroundColor: item.category.color }}
          >
            {item.category.name}
          </Badge>
          {item.tags.map(({ tag }) => (
            <Badge
              key={tag.name}
              variant="outline"
              style={{ borderColor: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex flex-col gap-2 text-sm text-muted-foreground">
        {item.location && (
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{item.location.name}</span>
          </div>
        )}
        {item.estimatedValue && (
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            <span>{formatCurrency(item.estimatedValue)}</span>
          </div>
        )}
        {item.purchaseDate && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(item.purchaseDate)}</span>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
```

### 4. Form Components

**Purpose**: Reusable form building blocks

**Characteristics**:
- Client Components (interactivity)
- React Hook Form integration
- Zod validation
- Accessible

**Example: Form Field Component**
```typescript
// components/forms/form-field.tsx
"use client"

import * as React from "react"
import { useFormContext } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string
  label: string
  description?: string
  type?: "text" | "email" | "password" | "number" | "date" | "textarea"
  required?: boolean
}

export function FormField({
  name,
  label,
  description,
  type = "text",
  required,
  className,
  ...props
}: FormFieldProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const error = errors[name]?.message as string | undefined
  const InputComponent = type === "textarea" ? Textarea : Input

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ""}>
        {label}
      </Label>
      <InputComponent
        id={name}
        type={type}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${name}-error` : description ? `${name}-description` : undefined}
        className={cn(error && "border-destructive", className)}
        {...register(name)}
        {...props}
      />
      {description && !error && (
        <p id={`${name}-description`} className="text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
```

### 5. Shared Components

**Purpose**: Common utility components

**Example: Empty State Component**
```typescript
// components/shared/empty-state.tsx
import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
```

## Component Patterns

### 1. Compound Components Pattern

**Purpose**: Create flexible, composable component APIs

**Example: Item List with Compound Components**
```typescript
// components/items/item-list.tsx
"use client"

import * as React from "react"
import { createContext, useContext } from "react"

interface ItemListContextValue {
  layout: "grid" | "list"
  onItemClick?: (id: string) => void
}

const ItemListContext = createContext<ItemListContextValue | undefined>(undefined)

function useItemList() {
  const context = useContext(ItemListContext)
  if (!context) throw new Error("Item components must be used within ItemList")
  return context
}

// Root component
interface ItemListProps {
  layout?: "grid" | "list"
  onItemClick?: (id: string) => void
  children: React.ReactNode
}

export function ItemList({ layout = "grid", onItemClick, children }: ItemListProps) {
  return (
    <ItemListContext.Provider value={{ layout, onItemClick }}>
      <div className={layout === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
        {children}
      </div>
    </ItemListContext.Provider>
  )
}

// Compound components
ItemList.Item = function ItemListItem({ children }: { children: React.ReactNode }) {
  const { layout } = useItemList()
  return <div className={layout === "list" ? "flex gap-4" : ""}>{children}</div>
}

ItemList.Empty = function ItemListEmpty({ children }: { children: React.ReactNode }) {
  return <div className="col-span-full">{children}</div>
}

// Usage:
// <ItemList layout="grid">
//   {items.map(item => (
//     <ItemList.Item key={item.id}>
//       <ItemCard item={item} />
//     </ItemList.Item>
//   ))}
//   {items.length === 0 && (
//     <ItemList.Empty>
//       <EmptyState icon={Package} title="No items" />
//     </ItemList.Empty>
//   )}
// </ItemList>
```

### 2. Render Props Pattern

**Purpose**: Share logic between components

**Example: Data Fetcher with Render Props**
```typescript
// components/shared/data-fetcher.tsx
"use client"

import { useQuery } from "@tanstack/react-query"
import { LoadingSpinner } from "./loading-spinner"
import { ErrorState } from "./error-state"

interface DataFetcherProps<T> {
  queryKey: string[]
  queryFn: () => Promise<T>
  children: (data: T) => React.ReactNode
  loadingComponent?: React.ReactNode
  errorComponent?: (error: Error) => React.ReactNode
}

export function DataFetcher<T>({
  queryKey,
  queryFn,
  children,
  loadingComponent,
  errorComponent,
}: DataFetcherProps<T>) {
  const { data, isLoading, error } = useQuery({ queryKey, queryFn })

  if (isLoading) return loadingComponent || <LoadingSpinner />
  if (error) return errorComponent?.(error as Error) || <ErrorState error={error as Error} />
  if (!data) return null

  return <>{children(data)}</>
}

// Usage:
// <DataFetcher queryKey={["items"]} queryFn={fetchItems}>
//   {(items) => <ItemList items={items} />}
// </DataFetcher>
```

### 3. Custom Hooks Pattern

**Purpose**: Extract and share stateful logic

**Example: useItemActions Hook**
```typescript
// lib/hooks/use-item-actions.ts
"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { deleteItem, updateItem } from "@/lib/api/items"

export function useItemActions() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const deleteMutation = useMutation({
    mutationFn: deleteItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      toast({ title: "Item deleted successfully" })
    },
    onError: (error) => {
      toast({ title: "Failed to delete item", variant: "destructive" })
    },
  })

  const updateMutation = useMutation({
    mutationFn: updateItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] })
      toast({ title: "Item updated successfully" })
    },
  })

  return {
    deleteItem: deleteMutation.mutate,
    updateItem: updateMutation.mutate,
    isDeleting: deleteMutation.isPending,
    isUpdating: updateMutation.isPending,
  }
}
```

## Server vs Client Components

### Decision Matrix

| Feature | Server Component | Client Component |
|---------|------------------|------------------|
| Data fetching | ✅ Preferred | ❌ Use React Query |
| Event handlers | ❌ No | ✅ Required |
| State management | ❌ No | ✅ Required |
| Browser APIs | ❌ No | ✅ Required |
| SEO | ✅ Better | ⚠️ Limited |
| Performance | ✅ Smaller bundle | ⚠️ Larger bundle |

### Guidelines

**Use Server Components for**:
- Layouts
- Static content
- Data fetching
- SEO-critical pages

**Use Client Components for**:
- Forms with validation
- Interactive UI (modals, dropdowns)
- Real-time updates
- Browser API usage (localStorage, geolocation)

## Component Best Practices

### 1. Type Safety

**Always define prop types**:
```typescript
interface ItemCardProps {
  item: Item
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  className?: string
}
```

### 2. Composition

**Build complex components from simple ones**:
```typescript
// ✅ Good: Composable
<Card>
  <CardHeader>
    <CardTitle>Item Details</CardTitle>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>

// ❌ Bad: Monolithic
<ItemDetailsCard title="Item Details" content={...} />
```

### 3. Performance

**Optimize renders**:
```typescript
// Use React.memo for expensive components
export const ItemCard = React.memo(function ItemCard(props: ItemCardProps) {
  // component logic
})

// Use useCallback for callback props
const handleDelete = useCallback((id: string) => {
  deleteItem(id)
}, [deleteItem])
```

### 4. Accessibility

**Follow ARIA guidelines**:
```typescript
<button
  aria-label="Delete item"
  aria-describedby="delete-description"
  onClick={handleDelete}
>
  <TrashIcon />
</button>
<span id="delete-description" className="sr-only">
  This will permanently delete the item
</span>
```

### 5. Error Boundaries

**Wrap components in error boundaries**:
```typescript
// components/shared/error-boundary.tsx
"use client"

import React from "react"

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}
```

## Testing Strategy

### Unit Tests

**Test components in isolation**:
```typescript
// components/items/item-card.test.tsx
import { render, screen } from "@testing-library/react"
import { ItemCard } from "./item-card"

describe("ItemCard", () => {
  it("renders item name", () => {
    const item = { id: "1", name: "Test Item", /* ... */ }
    render(<ItemCard item={item} />)
    expect(screen.getByText("Test Item")).toBeInTheDocument()
  })

  it("calls onDelete when delete button clicked", () => {
    const onDelete = jest.fn()
    render(<ItemCard item={item} onDelete={onDelete} />)
    // ... test implementation
  })
})
```

## Component Documentation

**Use JSDoc for complex components**:
```typescript
/**
 * Displays an item card with image, details, and actions.
 *
 * @example
 * ```tsx
 * <ItemCard
 *   item={item}
 *   onEdit={(id) => router.push(`/items/${id}/edit`)}
 *   onDelete={(id) => deleteItem(id)}
 * />
 * ```
 */
export function ItemCard({ item, onEdit, onDelete }: ItemCardProps) {
  // implementation
}
```

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-10
**Author**: Architect Agent (Hive Mind swarm-1760128533906-e6cc3wfik)
