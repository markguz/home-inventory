# Edit Item Feature - Architecture Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│                                                                      │
│  ┌──────────────────┐      ┌──────────────────┐                   │
│  │  Items List Page │      │ Item Detail Page │                   │
│  │  /items          │      │ /items/[id]      │                   │
│  └────────┬─────────┘      └────────┬─────────┘                   │
│           │                          │                              │
│           ├──> ItemCard              ├──> Edit Button              │
│           │    ├─ Quick Edit         │    └──> /items/[id]/edit   │
│           │    └─ EditItemModal      │                             │
│           │                          │                              │
│           └──────────┬───────────────┴──────────────────┐          │
│                      │                                   │          │
│                      ▼                                   ▼          │
│            ┌─────────────────┐              ┌──────────────────┐  │
│            │  EditItemModal  │              │ Edit Item Page   │  │
│            │  (Quick Edit)   │              │ (Full Edit)      │  │
│            └────────┬────────┘              └────────┬─────────┘  │
│                     │                                │             │
│                     └──────────┬─────────────────────┘             │
│                                │                                    │
│                                ▼                                    │
│                      ┌──────────────────┐                          │
│                      │    ItemForm      │                          │
│                      │  (mode: edit)    │                          │
│                      └────────┬─────────┘                          │
│                               │                                     │
└───────────────────────────────┼─────────────────────────────────────┘
                                │
                    ┌───────────▼───────────┐
                    │    API Layer          │
                    │  fetch() / actions    │
                    └───────────┬───────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                         SERVER LAYER                                 │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Next.js API Route: /api/items/[id]                         │  │
│  │                                                              │  │
│  │  PATCH /api/items/:id                                       │  │
│  │    ├─ Auth Middleware (session check)                       │  │
│  │    ├─ Authorization (user owns item or is admin)            │  │
│  │    ├─ Validation (Zod schema)                               │  │
│  │    ├─ Sanitization                                           │  │
│  │    └─ Business Logic                                         │  │
│  └──────────────────────┬───────────────────────────────────────┘  │
│                         │                                            │
│                         ▼                                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Prisma ORM                                                  │  │
│  │    ├─ Query Builder                                          │  │
│  │    ├─ Type Safety                                            │  │
│  │    └─ Relation Management                                    │  │
│  └──────────────────────┬───────────────────────────────────────┘  │
│                         │                                            │
└─────────────────────────┼────────────────────────────────────────────┘
                          │
┌─────────────────────────▼────────────────────────────────────────────┐
│                     DATABASE LAYER                                   │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  SQLite Database                                             │  │
│  │                                                              │  │
│  │  Tables:                                                     │  │
│  │    ├─ Item (primary)                                         │  │
│  │    ├─ Category (FK)                                          │  │
│  │    ├─ Location (FK)                                          │  │
│  │    ├─ ItemTag (junction)                                     │  │
│  │    └─ Tag (many-to-many)                                     │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram - Edit Operation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    EDIT ITEM DATA FLOW                               │
└─────────────────────────────────────────────────────────────────────┘

1. USER ACTION
   │
   ├─→ Click "Edit" button
   │   ├─ From ItemCard (opens modal)
   │   └─ From Detail Page (navigates to /items/[id]/edit)
   │
   ▼

2. LOAD EXISTING DATA
   │
   ├─→ Fetch item from cache/database
   │   ├─ Server-side: getItemById() in page component
   │   └─ Client-side: useQuery/fetch in modal
   │
   ├─→ Pre-fill form with current values
   │   ├─ Name, description, quantity
   │   ├─ Category, location
   │   └─ Tags, notes, serial number
   │
   ▼

3. USER EDITS FORM
   │
   ├─→ Form validation (client-side)
   │   ├─ React Hook Form + Zod
   │   ├─ Real-time field validation
   │   └─ Show inline errors
   │
   ├─→ Track dirty state
   │   ├─ Enable/disable submit button
   │   └─ Warn before leaving
   │
   ▼

4. SUBMIT CHANGES
   │
   ├─→ Optimistic Update (optional)
   │   └─ Update UI immediately
   │
   ├─→ API Request
   │   ├─ Method: PATCH
   │   ├─ URL: /api/items/:id
   │   ├─ Body: Changed fields only (partial update)
   │   └─ Headers: Session token
   │
   ▼

5. SERVER PROCESSING
   │
   ├─→ Authentication Check
   │   ├─ Verify session exists
   │   └─ Get user from session
   │
   ├─→ Authorization Check
   │   ├─ Fetch item.userId
   │   ├─ Compare with session.user.id
   │   └─ Allow if owner or admin
   │
   ├─→ Validation
   │   ├─ Parse with itemUpdateSchema (Zod)
   │   ├─ Validate field types
   │   ├─ Check constraints
   │   └─ Return 400 if invalid
   │
   ├─→ Database Update
   │   ├─ Build update object (filter undefined)
   │   ├─ Handle tags separately
   │   │   ├─ Delete existing ItemTag records
   │   │   └─ Create new ItemTag records
   │   └─ Execute prisma.item.update()
   │
   ├─→ Fetch Updated Item
   │   └─ Include category, location, tags
   │
   ▼

6. RESPONSE HANDLING
   │
   ├─→ SUCCESS (200 OK)
   │   ├─ Return updated item with relations
   │   ├─ Client confirms optimistic update
   │   ├─ Show success toast
   │   ├─ Revalidate cache (router.refresh())
   │   ├─ Close modal or redirect
   │   └─ Update local state
   │
   └─→ ERROR (4xx/5xx)
       ├─ Rollback optimistic update
       ├─ Show error toast
       ├─ Display validation errors
       └─ Keep form open
```

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    COMPONENT RELATIONSHIPS                           │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│                        Items List Page                              │
│                      (Server Component)                             │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  const items = await getItems()                            │   │
│  │  const categories = await getCategories()                  │   │
│  │  const locations = await getLocations()                    │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│                              ▼                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │                      ItemList                               │   │
│  │                  (Client Component)                         │   │
│  │                                                             │   │
│  │  items.map(item => <ItemCard item={item} />)              │   │
│  └────────────────────────────────────────────────────────────┘   │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          ItemCard                                     │
│                      (Client Component)                               │
│                                                                       │
│  State: [isEditModalOpen, setIsEditModalOpen]                       │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  <Card>                                                     │     │
│  │    <CardHeader>                                             │     │
│  │      {item.name}                                            │     │
│  │      <Button onClick={() => setIsEditModalOpen(true)}>     │     │
│  │        <PencilIcon /> Edit                                  │     │
│  │      </Button>                                              │     │
│  │    </CardHeader>                                            │     │
│  │    <CardContent>...</CardContent>                          │     │
│  │  </Card>                                                    │     │
│  │                                                             │     │
│  │  <EditItemModal                                            │     │
│  │    item={item}                                             │     │
│  │    open={isEditModalOpen}                                  │     │
│  │    onOpenChange={setIsEditModalOpen}                       │     │
│  │  />                                                         │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        EditItemModal                                  │
│                      (Client Component)                               │
│                                                                       │
│  Props: { item, open, onOpenChange }                                │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  <Dialog open={open} onOpenChange={onOpenChange}>         │     │
│  │    <DialogContent>                                          │     │
│  │      <DialogHeader>                                         │     │
│  │        <DialogTitle>Edit: {item.name}</DialogTitle>       │     │
│  │      </DialogHeader>                                        │     │
│  │                                                             │     │
│  │      <ItemForm                                             │     │
│  │        mode="edit"                                          │     │
│  │        defaultValues={item}                                │     │
│  │        onSubmit={handleUpdate}                             │     │
│  │        onCancel={() => onOpenChange(false)}                │     │
│  │      />                                                     │     │
│  │    </DialogContent>                                         │     │
│  │  </Dialog>                                                  │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
│  async handleUpdate(data) {                                          │
│    const response = await fetch(`/api/items/${item.id}`, {          │
│      method: 'PATCH',                                                │
│      body: JSON.stringify(data)                                      │
│    })                                                                 │
│    if (response.ok) {                                                │
│      onOpenChange(false)                                             │
│      router.refresh()                                                │
│    }                                                                  │
│  }                                                                    │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          ItemForm                                     │
│                      (Client Component)                               │
│                                                                       │
│  Props: { mode, defaultValues, onSubmit, onCancel }                 │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │  const { register, handleSubmit, formState } = useForm({  │     │
│  │    resolver: zodResolver(itemSchema),                      │     │
│  │    defaultValues                                           │     │
│  │  })                                                         │     │
│  │                                                             │     │
│  │  <form onSubmit={handleSubmit(onSubmit)}>                 │     │
│  │    <Input {...register('name')} />                         │     │
│  │    {errors.name && <Error>{errors.name.message}</Error>} │     │
│  │                                                             │     │
│  │    <Textarea {...register('description')} />               │     │
│  │                                                             │     │
│  │    <Select {...register('categoryId')}>                    │     │
│  │      {categories.map(cat => <option>...)}                 │     │
│  │    </Select>                                                │     │
│  │                                                             │     │
│  │    <Input type="number" {...register('quantity')} />       │     │
│  │                                                             │     │
│  │    <div className="flex gap-2">                            │     │
│  │      <Button type="submit" disabled={!isDirty}>           │     │
│  │        {mode === 'edit' ? 'Update' : 'Create'}            │     │
│  │      </Button>                                              │     │
│  │      {onCancel && (                                        │     │
│  │        <Button type="button" onClick={onCancel}>          │     │
│  │          Cancel                                            │     │
│  │        </Button>                                            │     │
│  │      )}                                                     │     │
│  │    </div>                                                   │     │
│  │  </form>                                                    │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE RELATIONSHIPS                          │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│      User        │
│                  │
│  id (PK)        │───┐
│  email          │   │
│  password       │   │ One-to-Many
│  role           │   │
└──────────────────┘   │
                       │
                       │
┌──────────────────┐   │    ┌──────────────────┐
│    Category      │   │    │      Item        │◀──── Updated by PATCH
│                  │   │    │                  │
│  id (PK)        │───┼───▶│  id (PK)        │
│  name           │   │    │  name           │
│  minQuantity    │   │    │  description    │
└──────────────────┘   │    │  quantity       │
                       │    │  minQuantity    │
                       │    │  categoryId (FK)│
┌──────────────────┐   │    │  locationId (FK)│
│    Location      │   │    │  userId (FK)    │───┘
│                  │   │    │  serialNumber   │
│  id (PK)        │───┼───▶│  notes          │
│  name           │   │    │  purchaseDate   │
│  parentId (FK)  │   │    │  purchasePrice  │
└──────────────────┘   │    │  currentValue   │
                       │    │  condition      │
                       │    │  imageUrl       │
                       │    │  warrantyUntil  │
                       │    │  createdAt      │
                       │    │  updatedAt      │
                       │    └──────────┬───────┘
                       │               │
                       │               │ One-to-Many
                       │               │
                       │               ▼
                       │    ┌──────────────────┐
                       │    │     ItemTag      │
                       │    │   (Junction)     │
                       │    │                  │
                       │    │  id (PK)        │
                       │    │  itemId (FK)    │───┐
                       │    │  tagId (FK)     │   │
                       │    └──────────────────┘   │
                       │                           │
                       │                           │
                       │    ┌──────────────────┐   │
                       │    │       Tag        │   │
                       │    │                  │   │
                       │    │  id (PK)        │◀──┘
                       │    │  name           │
                       │    │  color          │
                       │    └──────────────────┘
                       │
                       └─────────────────────────────────────┐
                                                             │
┌─────────────────────────────────────────────────────────┐│
│         PATCH UPDATE OPERATIONS                         ││
│                                                         ││
│  1. Update Item fields (partial)                       ││
│     ├─ name, description, quantity                     ││
│     ├─ categoryId (validates FK exists)                ││
│     ├─ locationId (validates FK exists)                ││
│     └─ Extended fields (purchasePrice, condition, etc.)││
│                                                         ││
│  2. Update Tags (if tagIds provided)                   ││
│     ├─ Delete all existing ItemTag records             ││
│     └─ Create new ItemTag records                      ││
│        └─ For each tagId in array                      ││
│                                                         ││
│  3. Return updated Item with includes                  ││
│     ├─ category: true                                  ││
│     ├─ location: true                                  ││
│     └─ tags: { include: { tag: true } }               ││
└─────────────────────────────────────────────────────────┘│
                                                           │
                                                           ▼
┌──────────────────────────────────────────────────────────────┐
│         VALIDATION & AUTHORIZATION                           │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Authentication                                     │    │
│  │    └─ Verify session.user exists                   │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Authorization                                      │    │
│  │    ├─ Fetch item.userId                            │    │
│  │    ├─ Compare with session.user.id                 │    │
│  │    └─ Allow if match OR user is ADMIN              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Validation (Zod)                                   │    │
│  │    ├─ itemUpdateSchema.parse(data)                 │    │
│  │    ├─ Check field types                             │    │
│  │    ├─ Check min/max constraints                     │    │
│  │    └─ Return 400 if invalid                         │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## State Management Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT PATTERNS                         │
└─────────────────────────────────────────────────────────────────────┘

PATTERN 1: Optimistic Update (Recommended)
────────────────────────────────────────────

┌─────────────────┐
│  User submits   │
│  form changes   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  1. Immediately update UI           │
│     ├─ currentItem = {...item,     │
│     │                 ...changes}   │
│     └─ setItem(currentItem)         │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  2. Send API request                │
│     PATCH /api/items/:id            │
└─────────┬───────────────────────────┘
          │
          ├─────────────────┐
          │                 │
          ▼                 ▼
┌──────────────┐   ┌──────────────────┐
│   SUCCESS    │   │      ERROR       │
└──────┬───────┘   └──────┬───────────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────────┐
│ 3. Confirm   │   │ 3. Rollback      │
│    update    │   │    changes       │
│    with real │   │    setItem(      │
│    data      │   │      oldItem)    │
│              │   │                  │
│ router.      │   │ Show error       │
│   refresh()  │   │   toast          │
└──────────────┘   └──────────────────┘


PATTERN 2: Loading State (Alternative)
───────────────────────────────────────

┌─────────────────┐
│  User submits   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  1. Set loading state               │
│     setIsLoading(true)              │
│     Disable form                    │
└─────────┬───────────────────────────┘
          │
          ▼
┌─────────────────────────────────────┐
│  2. Send API request                │
│     PATCH /api/items/:id            │
└─────────┬───────────────────────────┘
          │
          ├─────────────────┐
          │                 │
          ▼                 ▼
┌──────────────┐   ┌──────────────────┐
│   SUCCESS    │   │      ERROR       │
└──────┬───────┘   └──────┬───────────┘
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────────┐
│ 3. Update UI │   │ 3. Show error    │
│    setItem(  │   │    Keep form     │
│      result) │   │    open          │
│              │   │                  │
│ router.      │   │ setIsLoading(    │
│   refresh()  │   │    false)        │
│              │   │                  │
│ setIsLoading │   │                  │
│    (false)   │   │                  │
└──────────────┘   └──────────────────┘
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLING STRATEGY                           │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  API Request     │
│  PATCH /api/     │
│   items/:id      │
└────────┬─────────┘
         │
         ▼
    ┌────────┐
    │Response│
    └───┬────┘
        │
        ├─────────────────┬──────────────┬──────────────┬──────────────┐
        │                 │              │              │              │
        ▼                 ▼              ▼              ▼              ▼
  ┌──────────┐    ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
  │ 200 OK   │    │ 400 Bad  │  │ 401      │  │ 403      │  │ 404 Not  │
  │          │    │ Request  │  │Unauthed  │  │Forbidden │  │ Found    │
  └────┬─────┘    └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
       │               │              │              │              │
       ▼               ▼              ▼              ▼              ▼
  ┌──────────┐  ┌────────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐
  │ Update   │  │Show inline │ │Redirect to│ │Show error │ │Show error │
  │ UI state │  │validation  │ │login page │ │toast      │ │toast      │
  │          │  │errors      │ │           │ │"Not       │ │"Item not  │
  │ Show     │  │            │ │Clear      │ │allowed"   │ │found"     │
  │ success  │  │Keep form   │ │session    │ │           │ │           │
  │ toast    │  │open        │ │           │ │Rollback   │ │Redirect   │
  │          │  │            │ │           │ │changes    │ │to list    │
  │ Close    │  │Highlight   │ │           │ │           │ │           │
  │ modal or │  │invalid     │ │           │ │           │ │           │
  │ redirect │  │fields      │ │           │ │           │ │           │
  └──────────┘  └────────────┘ └───────────┘ └───────────┘ └───────────┘


VALIDATION ERROR HANDLING (400 Bad Request)
────────────────────────────────────────────

Response body:
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "path": ["name"],
      "message": "Name is required",
      "code": "too_small"
    },
    {
      "path": ["quantity"],
      "message": "Expected number, received nan",
      "code": "invalid_type"
    }
  ]
}

Client handling:
┌────────────────────────────────────────┐
│ Parse error.details array              │
│                                        │
│ For each validation error:             │
│   ├─ Find form field by path           │
│   ├─ Display error message below field │
│   └─ Add red border to field           │
│                                        │
│ Focus first invalid field              │
│ Keep form open                         │
│ Keep user changes (don't reset)        │
└────────────────────────────────────────┘
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SECURITY & AUTHORIZATION                          │
└─────────────────────────────────────────────────────────────────────┘

Request arrives at: PATCH /api/items/:id
│
├─> 1. AUTHENTICATION
│   │
│   ├─> Check for session cookie
│   │   ├─ NextAuth.js session handling
│   │   └─ JWT or database session
│   │
│   ├─> const session = await auth()
│   │
│   └─> Verify session.user exists
│       ├─ YES → Continue
│       └─ NO → Return 401 Unauthorized
│
├─> 2. AUTHORIZATION
│   │
│   ├─> Fetch item from database
│   │   const item = await prisma.item.findUnique({
│   │     where: { id },
│   │     select: { userId: true }
│   │   })
│   │
│   ├─> Check if item exists
│   │   └─ NO → Return 404 Not Found
│   │
│   ├─> Check ownership
│   │   if (session.user.role === 'ADMIN') {
│   │     → ALLOW (admins can edit any item)
│   │   } else if (item.userId === session.user.id) {
│   │     → ALLOW (user owns item)
│   │   } else {
│   │     → DENY → Return 403 Forbidden
│   │   }
│   │
│   └─> Continue if authorized
│
├─> 3. INPUT VALIDATION
│   │
│   ├─> Parse request body
│   │
│   ├─> Validate with Zod schema
│   │   const validatedData = itemUpdateSchema.parse(body)
│   │
│   ├─> Check data types
│   │   ├─ String fields (name, description)
│   │   ├─ Number fields (quantity, prices)
│   │   ├─ Date fields (purchaseDate, warrantyUntil)
│   │   └─ Foreign keys (categoryId, locationId)
│   │
│   ├─> Sanitize input
│   │   ├─ Trim whitespace
│   │   ├─ Remove HTML tags
│   │   └─ Escape special characters
│   │
│   └─> Validation fails
│       └─> Return 400 Bad Request with details
│
├─> 4. BUSINESS LOGIC VALIDATION
│   │
│   ├─> Verify categoryId exists
│   │   └─ Query categories table
│   │
│   ├─> Verify locationId exists
│   │   └─ Query locations table
│   │
│   ├─> Verify tagIds exist (if provided)
│   │   └─ Query tags table
│   │
│   └─> Check constraints
│       ├─ quantity >= 0
│       ├─ prices >= 0
│       └─ dates are valid
│
├─> 5. DATABASE UPDATE (Atomic Transaction)
│   │
│   ├─> Begin transaction
│   │
│   ├─> Update item record
│   │
│   ├─> Handle tags (if provided)
│   │   ├─ Delete existing ItemTag records
│   │   └─ Create new ItemTag records
│   │
│   ├─> Commit transaction
│   │
│   └─> Rollback on error
│
└─> 6. RESPONSE
    │
    ├─> Include only safe fields
    │   ├─ Exclude: user.password, internal IDs
    │   └─ Include: item data + relations
    │
    └─> Return 200 OK with data
```

---

## Implementation Checklist

Use this checklist to track implementation progress:

### Backend
- [ ] Add authentication check to PATCH endpoint
- [ ] Add authorization check (user owns item or is admin)
- [ ] Enhance validation schema with extended fields
- [ ] Add tests for PATCH endpoint
- [ ] Test authorization rules

### Frontend - Components
- [ ] Update ItemCard with edit button
- [ ] Create EditItemModal component
- [ ] Create /items/[id]/edit page
- [ ] Create EditItemForm client component
- [ ] Update ItemForm to support 'edit' mode
- [ ] Add edit button to item detail page

### Frontend - Logic
- [ ] Implement optimistic updates
- [ ] Add error handling and rollback
- [ ] Create centralized API service
- [ ] Add loading states
- [ ] Add confirmation for unsaved changes

### Testing
- [ ] Unit tests for ItemForm (edit mode)
- [ ] Unit tests for PATCH endpoint
- [ ] Integration tests for edit flow
- [ ] E2E tests (Playwright)
- [ ] Test on mobile devices

### Polish
- [ ] Add keyboard shortcuts
- [ ] Improve accessibility (ARIA labels)
- [ ] Add animations/transitions
- [ ] Verify responsive design
- [ ] Update documentation

---

## Performance Metrics

Target metrics for edit item feature:

- **Time to Interactive:** < 100ms (modal open)
- **API Response Time:** < 200ms (PATCH request)
- **Full Page Load:** < 500ms (/items/[id]/edit)
- **Optimistic Update:** < 50ms (UI update)
- **Bundle Size Impact:** < 10KB (new components)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-31
**Related:** EDIT_ITEM_ARCHITECTURE.md
