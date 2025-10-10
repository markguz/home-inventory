# User Flow Analysis - Home Inventory System

**Project**: Home Inventory Management System
**Date**: 2025-10-10
**Analyst**: Hive Mind Analyst Agent
**Swarm ID**: swarm-1760128533906-e6cc3wfik

---

## Table of Contents
1. [New User Onboarding](#1-new-user-onboarding-flow)
2. [Adding a New Item](#2-adding-a-new-item-flow)
3. [Searching for Items](#3-searching-for-items-flow)
4. [Editing Items](#4-editing-items-flow)
5. [Deleting Items](#5-deleting-items-flow)
6. [Categorization Workflow](#6-categorization-workflow)
7. [Image Upload Workflow](#7-image-upload-workflow)

---

## 1. New User Onboarding Flow

### Overview
First-time user experience from landing to adding their first item.

### Primary Flow

```
START → Landing Page
  ↓
[Decision] Authentication Required?
  ↓ NO (MVP)                    ↓ YES (Future)
  ↓                             ↓
Welcome Screen              Sign Up Form
  ↓                             ↓
Tutorial/Quick Tour         Email Verification
  ↓                             ↓
Dashboard (Empty State)     Welcome Screen
  ↓                             ↓
"Add Your First Item" CTA   Tutorial/Quick Tour
  ↓                             ↓
Item Creation Form ──────────→ Dashboard (Empty State)
  ↓                             ↓
First Item Created          "Add Your First Item" CTA
  ↓                             ↓
Success Message             Item Creation Form
  ↓                             ↓
Dashboard (1 item)          First Item Created
  ↓                             ↓
END                         END
```

### Detailed Steps

#### Step 1: Landing Page
- **Screen**: Marketing/welcome page
- **User Sees**:
  - Hero section: "Organize Your Home, Simplify Your Life"
  - Key features (photos, search, organization)
  - Call-to-action: "Get Started Free"
- **User Actions**: Click "Get Started" button
- **System Response**: Navigate to welcome screen or signup

#### Step 2: Welcome Screen (MVP - No Auth)
- **Screen**: Introduction to app
- **User Sees**:
  - Brief overview of features
  - "Start Using Locally" button
  - Optional: "See Quick Tutorial" link
- **User Actions**: Click "Start Using Locally"
- **System Response**:
  - Initialize local database (IndexedDB)
  - Navigate to empty dashboard

#### Step 3: Tutorial/Quick Tour (Optional)
- **Screen**: Interactive walkthrough
- **User Sees**:
  - 3-4 screens highlighting key features
  - Progress dots
  - "Skip" and "Next" buttons
- **Key Slides**:
  1. "Add items with photos"
  2. "Organize with categories"
  3. "Search and filter instantly"
  4. "Export for insurance"
- **User Actions**: Click through or skip
- **System Response**: Navigate to dashboard after completion

#### Step 4: Dashboard (Empty State)
- **Screen**: Main inventory view with no items
- **User Sees**:
  - Prominent empty state illustration
  - Message: "Your inventory is empty"
  - Large "Add Your First Item" button
  - Secondary: "Import from CSV" option
- **User Actions**: Click "Add Your First Item"
- **System Response**: Open item creation modal/page

#### Step 5: First Item Creation (Simplified)
- **Screen**: Item creation form with hints
- **User Sees**:
  - Simplified form (fewer fields than full version)
  - Inline tips: "Take a photo of your valuable items"
  - Required: Name, Category, Photo
  - Optional: Description, Value
- **User Actions**: Fill form and click "Add Item"
- **System Response**:
  - Validate input
  - Save item
  - Show success message
  - Return to dashboard with new item

#### Step 6: Success Celebration
- **Screen**: Success modal or toast
- **User Sees**:
  - "Great! Your first item is added!"
  - Encouragement: "Add more items to build your inventory"
  - Quick actions: "Add Another" or "View Item"
- **User Actions**: Dismiss or take action
- **System Response**: Update dashboard

### Alternative Flows

#### Alt-1: User Skips Tutorial
- From Welcome Screen → Direct to Dashboard
- Show tooltip hints on first interactions

#### Alt-2: User Returns After Closing Browser (MVP)
- Landing Page → Check local storage
- If data exists → Direct to Dashboard with items
- If no data → Welcome Screen

#### Alt-3: Import Existing Inventory
- Empty Dashboard → Click "Import from CSV"
- Upload CSV file → Map columns → Import items
- Navigate to populated dashboard

### Exit Points
- User can exit at any time (data saved locally)
- No forced account creation in MVP
- Option to export data before closing

### Success Metrics
- **Target**: 80% of users add first item within 5 minutes
- **Abandonment Points**: Track where users drop off
- **Time to First Value**: Median 2 minutes

---

## 2. Adding a New Item Flow

### Overview
User adds a new inventory item from the dashboard.

### Primary Flow

```
START → Dashboard
  ↓
Click "Add Item" Button
  ↓
Item Creation Form Opens
  ↓
[Required] Enter Item Name
  ↓
[Optional] Add Description
  ↓
Select/Create Category
  ↓
Upload Photo(s)
  ↓
[Optional] Add Details (Price, Date, Location)
  ↓
[Optional] Add Tags
  ↓
Click "Save Item"
  ↓
Validation
  ↓
[Decision] Valid?
  ↓ YES              ↓ NO
  ↓                  ↓
Save to Database   Show Error Messages
  ↓                  ↓
Success Message    User Corrects Errors
  ↓                  ↓
Update Dashboard ←─ Retry Save
  ↓
Show New Item
  ↓
END
```

### Detailed Steps

#### Step 1: Initiate Item Creation
- **Screen**: Dashboard or any page with add button
- **User Sees**:
  - Floating action button (FAB) or header "Add Item" button
  - Keyboard shortcut hint: "Press 'N' for new item"
- **User Actions**: Click add button or press 'N'
- **System Response**:
  - Open item creation modal (mobile) or side panel (desktop)
  - Focus on item name field

#### Step 2: Item Name Entry
- **Screen**: Item creation form
- **User Sees**:
  - "Item Name*" field (focused)
  - Placeholder: "e.g., MacBook Pro 16-inch"
  - Character counter (optional, 100 char max)
- **User Actions**: Type item name
- **System Response**:
  - Real-time validation
  - Enable/disable save button based on completion

#### Step 3: Description Entry
- **Screen**: Same form, next field
- **User Sees**:
  - "Description" textarea
  - Placeholder: "Add details like model, serial number, condition..."
  - Character limit: 500 characters
- **User Actions**: Type description (optional)
- **System Response**: Show character count

#### Step 4: Category Selection
- **Screen**: Category selector in form
- **User Sees**:
  - Dropdown or searchable select
  - Existing categories list
  - "+ Create New Category" option
- **User Actions**:
  - Select existing category OR
  - Click "+ Create New Category"
- **System Response**:
  - If existing: Select category
  - If new: Show inline category creation

##### Sub-flow: Create New Category
```
Click "+ Create New Category"
  ↓
Inline Input Appears
  ↓
Enter Category Name
  ↓
[Optional] Select Parent Category
  ↓
[Optional] Choose Icon/Color
  ↓
Click "Create"
  ↓
Add to Categories List
  ↓
Auto-select New Category
  ↓
Return to Item Form
```

#### Step 5: Image Upload
- **Screen**: Photo upload section
- **User Sees**:
  - "Add Photos" button with camera icon
  - Drag-and-drop zone
  - "Max 5 photos, 10MB each"
  - Preview thumbnails of uploaded images
- **User Actions**:
  - Click to browse files OR
  - Take photo with camera (mobile) OR
  - Drag and drop images
- **System Response**:
  - Show upload progress
  - Display thumbnail previews
  - Compress images if needed
  - Show error if file too large/wrong format

##### Sub-flow: Multiple Images
```
Upload First Image
  ↓
Preview Thumbnail Shows
  ↓
"Set as Primary" Star Icon
  ↓
Click "Add More" or Drag Next Image
  ↓
Show All Thumbnails
  ↓
Reorder with Drag-and-Drop
  ↓
Mark Primary Image (star icon)
```

#### Step 6: Additional Details (Accordion/Expandable)
- **Screen**: Collapsed "Additional Details" section
- **User Sees**: "Add Purchase Info, Location & More" link
- **User Actions**: Click to expand
- **System Response**: Show expanded fields:
  - Purchase Date (date picker)
  - Purchase Price (currency input with $ symbol)
  - Current Value (currency input)
  - Condition (dropdown: Excellent, Good, Fair, Poor)
  - Location (dropdown/searchable)
  - Notes (textarea)

#### Step 7: Tags (Optional)
- **Screen**: Tags section in form
- **User Sees**:
  - "Tags" input with autocomplete
  - Existing tags appear as suggestions
  - Added tags show as chips
- **User Actions**: Type and select tags
- **System Response**:
  - Show matching tags as user types
  - Allow creating new tags
  - Display selected tags as removable chips

#### Step 8: Save Item
- **Screen**: Complete form with all data
- **User Sees**:
  - "Save Item" primary button (enabled)
  - "Cancel" secondary button
- **User Actions**: Click "Save Item"
- **System Response**:
  - Show loading spinner
  - Validate all fields
  - Process images
  - Save to database

#### Step 9: Validation & Error Handling
- **Validation Checks**:
  - Item name not empty
  - Image file size < 10MB
  - Image format is JPEG/PNG/WebP
  - Price values are valid numbers
  - Date is valid
- **Error Display**:
  - Inline errors below fields
  - Error summary at top
  - Focus first error field

#### Step 10: Success & Return
- **Screen**: Success notification
- **User Sees**:
  - Toast/snackbar: "Item added successfully!"
  - Options: "View Item" | "Add Another" | "Done"
- **User Actions**: Choose action or auto-close
- **System Response**:
  - Close modal/form
  - Refresh dashboard with new item
  - Highlight new item briefly

### Alternative Flows

#### Alt-1: Cancel During Creation
- User clicks "Cancel" → Confirm dialog if data entered
- "You have unsaved changes. Discard?" → Yes/No
- If Yes: Close form, discard data
- If No: Return to form

#### Alt-2: Save as Draft (Future)
- Auto-save form data to local storage every 30 seconds
- On return: "Resume editing [Item Name]?"

#### Alt-3: Quick Add (Simplified)
- Click "Quick Add" alternative button
- Only fields: Name, Photo, Category
- Auto-filled values for other fields
- Save immediately

### Edge Cases

#### Image Too Large
- Show error: "Image exceeds 10MB. Please use a smaller image."
- Offer auto-compression: "Compress to 2MB?" → Yes/No

#### Network Error (Cloud Version)
- Save to local queue
- Show: "Saved locally. Will sync when online."
- Auto-sync when connection restored

#### Duplicate Item Name
- Show warning: "Similar item exists. Add anyway?"
- Show existing item for reference

### Success Metrics
- **Target**: 90% success rate for item creation
- **Time**: Median 45 seconds per item
- **Images**: 75% of items include at least one photo

---

## 3. Searching for Items Flow

### Overview
User finds specific items using search and filter functionality.

### Primary Flow

```
START → Dashboard/Inventory Page
  ↓
Click Search Bar or Press '/'
  ↓
Enter Search Query
  ↓
[Real-time] Search Results Update
  ↓
[Decision] Results Found?
  ↓ YES                          ↓ NO
  ↓                              ↓
Display Matching Items     Show "No Results" Message
  ↓                              ↓
Review Results             Suggestions:
  ↓                         - Check spelling
[Optional] Refine Search   - Try different terms
  ↓                         - Clear filters
Apply Filters                    ↓
  ↓                         User Modifies Search
Select Item from Results         ↓
  ↓                         (Loop Back to Enter Query)
View Item Details
  ↓
END
```

### Detailed Steps

#### Step 1: Access Search
- **Screen**: Dashboard with search bar in header
- **User Sees**:
  - Prominent search bar with 🔍 icon
  - Placeholder: "Search items..."
  - Keyboard hint: "Press '/' to search"
- **User Actions**:
  - Click search bar OR
  - Press '/' key anywhere
- **System Response**:
  - Focus search input
  - Clear previous search
  - Show search history (if any)

#### Step 2: Enter Search Query
- **Screen**: Active search bar
- **User Sees**:
  - Cursor in search field
  - Real-time suggestions dropdown (as typing)
  - Recent searches
  - Popular/suggested searches
- **User Actions**: Type search terms
- **System Response**:
  - Debounced search (300ms delay)
  - Show loading indicator
  - Update results dynamically

##### Search Behavior
- **Search Fields**:
  - Item name (highest priority)
  - Description
  - Category name
  - Tags
  - Location
  - Notes
- **Search Type**: Fuzzy match (tolerate typos)
- **Minimum Characters**: 2 characters

#### Step 3: Real-time Results Display
- **Screen**: Results list updates as user types
- **User Sees**:
  - Number of results: "23 items found"
  - Grid or list view of matching items
  - Each result shows:
    - Primary image thumbnail
    - Item name (with search term highlighted)
    - Category badge
    - Value (if entered)
  - Results sorted by relevance

#### Step 4: No Results Handling
- **Screen**: Empty results state
- **User Sees**:
  - "No items found for '[search term]'"
  - Helpful suggestions:
    - "Try different keywords"
    - "Check your spelling"
    - "Clear active filters"
  - "Create new item with this name" button
- **User Actions**:
  - Modify search OR
  - Clear search OR
  - Create new item

#### Step 5: Apply Filters (Advanced Search)
- **Screen**: Filter panel/sidebar
- **User Sees**:
  - "Filters" button with count badge
  - Filter options:
    - **Category**: Multi-select checklist
    - **Location**: Multi-select checklist
    - **Tags**: Multi-select chips
    - **Value Range**: Slider (min-max)
    - **Date Added**: Date range picker
    - **Condition**: Radio buttons
  - Active filters shown as chips
  - "Clear All Filters" link
- **User Actions**: Select filter criteria
- **System Response**:
  - Update results immediately
  - Show filter count: "3 filters active"
  - Allow removing individual filters

##### Filter Combination Logic
```
Search Query: "laptop"
  AND
Category IN [Electronics, Computers]
  AND
Value BETWEEN $500 AND $2000
  AND
Date Added AFTER 2024-01-01
```

#### Step 6: Sort Results
- **Screen**: Results with sort dropdown
- **User Sees**:
  - "Sort by:" dropdown
  - Options:
    - Relevance (default)
    - Name (A-Z)
    - Name (Z-A)
    - Value (High to Low)
    - Value (Low to High)
    - Date Added (Newest)
    - Date Added (Oldest)
- **User Actions**: Select sort option
- **System Response**: Re-order results instantly

#### Step 7: Select Item from Results
- **Screen**: Results grid/list
- **User Sees**: Clickable item cards
- **User Actions**: Click item card
- **System Response**:
  - Navigate to item detail view
  - Keep search context (back button returns to results)

#### Step 8: Search History (Enhancement)
- **Screen**: Empty search bar
- **User Sees**:
  - Recent searches (last 5)
  - "Clear history" link
- **User Actions**: Click recent search
- **System Response**:
  - Auto-fill search
  - Execute search immediately

### Alternative Flows

#### Alt-1: Voice Search (Future/Mobile)
```
Click Microphone Icon
  ↓
"Listening..." indicator
  ↓
Speak Search Query
  ↓
Convert Speech to Text
  ↓
Execute Search
```

#### Alt-2: Barcode Search (Future)
```
Click Barcode Scanner Icon
  ↓
Activate Camera
  ↓
Scan Item Barcode
  ↓
Search by Product Code
  ↓
Show Matching Items
```

#### Alt-3: Visual Search (Future)
```
Upload/Take Photo
  ↓
Image Recognition
  ↓
Find Visually Similar Items
  ↓
Show Results with Similarity %
```

#### Alt-4: Saved Searches (Enhancement)
```
Create Complex Filter
  ↓
Click "Save Search"
  ↓
Name Search: "High-Value Electronics"
  ↓
Access from "Saved Searches" Menu
  ↓
One-Click Access to Filtered View
```

### Search Performance

#### Optimization Strategies
- **Indexing**: Full-text index on name, description
- **Caching**: Cache frequent searches
- **Pagination**: Load 50 results initially, infinite scroll
- **Debouncing**: 300ms delay on typing

#### Performance Targets
- **Initial Results**: < 200ms
- **Filter Application**: < 100ms
- **Large Datasets**: < 500ms for 10,000+ items

### Edge Cases

#### Special Characters
- Handle quotes: `"exact phrase"`
- Boolean operators: `laptop AND macbook`
- Wildcards: `mac*` matches "macbook", "mackenzie"

#### Empty Search
- User clears search → Show all items
- Return to default view with all items

#### Search with No Items
- New user searches empty inventory
- Show: "Add items to start searching"

### Success Metrics
- **Search Usage**: 60% of users search weekly
- **Success Rate**: 85% of searches yield clicked results
- **Refinement**: 30% of searches use filters
- **Speed**: 95th percentile < 500ms

---

## 4. Editing Items Flow

### Overview
User modifies existing inventory item information.

### Primary Flow

```
START → View Item Details
  ↓
Click "Edit" Button
  ↓
Item Edit Form Opens (Pre-filled)
  ↓
Modify Fields
  ↓
[Optional] Add/Remove Images
  ↓
[Optional] Update Category
  ↓
[Optional] Change Location/Tags
  ↓
Click "Save Changes"
  ↓
Validation
  ↓
[Decision] Valid?
  ↓ YES              ↓ NO
  ↓                  ↓
Update Database    Show Errors
  ↓                  ↓
Success Message    User Fixes Issues
  ↓                  ↓
Return to Details ←─ Retry Save
  ↓
Show Updated Item
  ↓
END
```

### Detailed Steps

#### Step 1: Access Edit Mode
- **Screen**: Item detail view
- **User Sees**:
  - Item information displayed
  - "Edit" button (pencil icon) in header/toolbar
  - Alternative: Three-dot menu → "Edit"
- **User Actions**: Click "Edit" button
- **System Response**:
  - Transform view to edit mode OR
  - Open edit modal/form
  - Pre-fill all existing data
  - Focus first editable field

#### Step 2: Edit Form (Pre-populated)
- **Screen**: Edit form with existing values
- **User Sees**:
  - All fields filled with current data
  - Same layout as creation form
  - "Save Changes" button
  - "Cancel" button
  - Changed fields highlighted (subtle visual indicator)
- **User Actions**: Modify any field
- **System Response**:
  - Track changes
  - Mark modified fields
  - Enable/disable save based on validation

#### Step 3: Modify Text Fields
- **Fields Available**:
  - Item Name
  - Description
  - Purchase Date
  - Purchase Price
  - Current Value
  - Condition
  - Notes
- **User Experience**:
  - Click field → Edit inline
  - Real-time validation
  - Show character counts
  - Highlight unsaved changes
- **System Response**:
  - Validate as user types
  - Show save indicator when changes present

#### Step 4: Update Category
- **Screen**: Category selector in edit form
- **User Sees**:
  - Current category selected
  - Dropdown to change category
  - Option to create new category
- **User Actions**: Select different category
- **System Response**:
  - Update selection
  - Mark field as changed
  - Show confirmation if changing to vastly different category

#### Step 5: Manage Images
- **Screen**: Image management section
- **User Sees**:
  - Current images as thumbnails
  - "X" delete icon on each image
  - "Add More Photos" button
  - Drag handles to reorder
  - Star icon to set primary image
- **User Actions**:
  - Delete image: Click "X" → Confirm
  - Add image: Click "Add More" → Upload
  - Reorder: Drag and drop thumbnails
  - Set primary: Click star icon
- **System Response**:
  - Show confirmation before delete
  - Upload new images
  - Update order immediately
  - Mark primary image with filled star

##### Sub-flow: Delete Image
```
Click "X" on Image
  ↓
Confirmation Dialog:
"Delete this photo?"
[Cancel] [Delete]
  ↓
Click "Delete"
  ↓
Remove Image from UI
  ↓
Mark for Deletion (not saved yet)
  ↓
Restore Option Available
```

##### Sub-flow: Add More Images
```
Click "Add More Photos"
  ↓
File Browser Opens
  ↓
Select Image(s)
  ↓
Upload & Compress
  ↓
Add to Image Gallery
  ↓
Show New Thumbnails
```

#### Step 6: Update Location
- **Screen**: Location field in edit form
- **User Sees**:
  - Current location (if set)
  - Dropdown/searchable select
  - Existing locations list
  - "+ Add New Location" option
- **User Actions**:
  - Select different location OR
  - Create new location
- **System Response**:
  - Update location
  - If new location: Show inline creation form

#### Step 7: Manage Tags
- **Screen**: Tags section in edit form
- **User Sees**:
  - Current tags as removable chips
  - Tag input with autocomplete
  - "Add tag" button
- **User Actions**:
  - Remove tag: Click "X" on chip
  - Add tag: Type and select/create
- **System Response**:
  - Update tag list
  - Show visual feedback
  - Allow undo

#### Step 8: Save Changes
- **Screen**: Edit form with modifications
- **User Sees**:
  - "Save Changes" button (highlighted if changes made)
  - Indicator: "You have unsaved changes"
  - "Cancel" button
- **User Actions**: Click "Save Changes"
- **System Response**:
  - Show saving indicator
  - Validate all fields
  - Update database
  - Process image changes
  - Update timestamps

#### Step 9: Change Validation
- **Validation Rules**:
  - At least one field must be changed
  - Required fields still satisfied
  - Image formats valid
  - Numeric fields valid
- **Error Handling**:
  - Show inline errors
  - Prevent save if critical errors
  - Allow save with warnings

#### Step 10: Success & Return
- **Screen**: Success notification
- **User Sees**:
  - Toast: "Item updated successfully!"
  - Return to item detail view
  - Updated values displayed
- **System Response**:
  - Close edit mode
  - Refresh item details
  - Update "Last Modified" timestamp

### Alternative Flows

#### Alt-1: Cancel Editing
```
User Clicks "Cancel"
  ↓
[Decision] Has Unsaved Changes?
  ↓ YES                    ↓ NO
  ↓                        ↓
Confirmation Dialog:   Close Edit Mode
"Discard changes?"         ↓
[Stay] [Discard]       Return to Details
  ↓                        ↓
If Discard:            END
→ Revert All Changes
→ Return to Details
```

#### Alt-2: Auto-Save (Future Enhancement)
```
User Modifies Field
  ↓
Wait 2 Seconds (Debounce)
  ↓
Auto-Save to Draft
  ↓
Show "Draft Saved" Indicator
  ↓
Manual Save Commits Changes
```

#### Alt-3: Quick Edit (Inline Editing)
```
From Item Details View
  ↓
Click Field Directly
  ↓
Field Becomes Editable
  ↓
Edit Value
  ↓
Click ✓ or Press Enter
  ↓
Save Individual Field
  ↓
Show Success Indicator
```

#### Alt-4: Bulk Edit (Future)
```
Select Multiple Items (Checkboxes)
  ↓
Click "Edit Selected"
  ↓
Show Multi-Edit Form
  ↓
Change Common Fields (Category, Location, Tags)
  ↓
Apply to All Selected Items
```

### Edge Cases

#### Concurrent Edits (Cloud Version)
- User A editing item
- User B edits same item
- Show conflict resolution dialog
- Options: Keep theirs, Keep mine, Merge

#### Network Failure During Save
- Save fails mid-process
- Queue changes locally
- Retry automatically
- Show "Will sync when online"

#### Image Upload Failure
- One image fails to upload
- Save text changes successfully
- Show partial success message
- Retry failed image upload

#### Lost Changes Warning
- User navigates away during edit
- Browser/OS beforeunload event
- Show: "You have unsaved changes. Leave anyway?"

### Success Metrics
- **Edit Completion**: 95% of started edits are saved
- **Edit Frequency**: 40% of items edited within 30 days of creation
- **Time to Edit**: Median 30 seconds
- **Error Rate**: < 2% validation failures

---

## 5. Deleting Items Flow

### Overview
User removes inventory items with proper confirmation and undo capability.

### Primary Flow

```
START → View Item or Select from List
  ↓
Click "Delete" Button
  ↓
Confirmation Dialog
  ↓
[Decision] Confirm Delete?
  ↓ YES                        ↓ NO
  ↓                            ↓
Mark Item as Deleted       Cancel Action
  ↓                            ↓
Show Success Message       Return to Previous View
  ↓                            ↓
Undo Option (10 seconds)   END
  ↓
[Decision] Undo Clicked?
  ↓ YES                        ↓ NO
  ↓                            ↓
Restore Item             Permanent Delete
  ↓                            ↓
Success Message          Remove from Database
  ↓                            ↓
Show Restored Item       END
  ↓
END
```

### Detailed Steps

#### Step 1: Access Delete Option
**From Item Detail View:**
- **Screen**: Item detail page
- **User Sees**:
  - Three-dot menu icon OR
  - "Delete" button (trash icon) in toolbar
- **User Actions**: Click menu → "Delete Item"
- **System Response**: Show confirmation dialog

**From List View:**
- **Screen**: Inventory list/grid
- **User Sees**:
  - Three-dot menu on item card OR
  - Swipe gesture reveals delete (mobile)
  - Long-press shows context menu (mobile)
- **User Actions**:
  - Click menu → "Delete" OR
  - Swipe left → "Delete" OR
  - Select checkbox + bulk delete button
- **System Response**: Show confirmation

#### Step 2: Confirmation Dialog
- **Screen**: Modal overlay
- **User Sees**:
  - Warning icon (⚠️)
  - Title: "Delete Item?"
  - Message: "Are you sure you want to delete '[Item Name]'? This action can be undone within 10 seconds."
  - Item preview (thumbnail + name)
  - Checkbox: "Don't ask again for this session" (optional)
  - Buttons:
    - "Cancel" (secondary, default focus)
    - "Delete" (danger red, requires explicit click)
- **User Actions**:
  - Click "Delete" to confirm OR
  - Click "Cancel" or close dialog
- **System Response**:
  - If Cancel: Close dialog, no action
  - If Delete: Proceed to deletion

#### Step 3: Soft Delete (Undo Period)
- **Screen**: Toast/snackbar notification
- **User Sees**:
  - Success message: "Item deleted"
  - "Undo" button (prominent)
  - Countdown timer: "Undoing in 10... 9... 8..."
  - Progress bar showing time remaining
- **System Behavior**:
  - Mark item as `deleted = true` in database
  - Remove from visible list
  - Keep data intact for 10 seconds
  - Start countdown timer
- **User Actions**:
  - Click "Undo" OR
  - Wait for timer to expire

#### Step 4: Undo Deletion
- **Trigger**: User clicks "Undo" within 10 seconds
- **Screen**: Updated toast message
- **User Sees**:
  - "Item restored"
  - Item reappears in list
- **System Behavior**:
  - Cancel deletion
  - Set `deleted = false`
  - Restore item to visible state
  - Clear undo timer
- **Result**: Item fully restored, no data loss

#### Step 5: Permanent Deletion
- **Trigger**: 10-second timer expires OR user confirms permanent delete
- **Screen**: Brief confirmation toast (optional)
- **User Sees**: Item removed from all views
- **System Behavior**:
  - Remove item record from database
  - Delete associated images from storage
  - Update category/tag counts
  - Update total inventory value
  - Log deletion in audit trail (optional)
- **Result**: Item permanently removed

### Alternative Flows

#### Alt-1: Bulk Delete (Multiple Items)
```
Select Multiple Items (Checkboxes)
  ↓
Click "Delete Selected" Button
  ↓
Confirmation Dialog:
"Delete 5 items?"
[Cancel] [Delete All]
  ↓
Click "Delete All"
  ↓
Show Bulk Success Message:
"5 items deleted"
[Undo All]
  ↓
[Decision] Undo Clicked?
  ↓ YES                    ↓ NO (Timer Expires)
  ↓                        ↓
Restore All Items    Permanently Delete All
```

#### Alt-2: Quick Delete (Skip Confirmation)
```
User Enables "Quick Delete" in Settings
  ↓
Click Delete Button
  ↓
Skip Confirmation Dialog
  ↓
Immediate Soft Delete
  ↓
Show Undo Message
  ↓
(Same undo flow)
```

#### Alt-3: Trash/Recycle Bin (Future Enhancement)
```
User Deletes Item
  ↓
Move to "Trash" Folder
  ↓
Item Visible in "Trash" View
  ↓
Options:
- Restore: Move back to inventory
- Delete Permanently: Remove from trash
  ↓
Auto-Delete After 30 Days
```

#### Alt-4: Archive Instead of Delete
```
Click "Archive" (Alternative Option)
  ↓
Move to "Archived Items"
  ↓
Hide from Main Inventory
  ↓
Keep All Data
  ↓
View in "Archived" Section
  ↓
Can Unarchive Anytime
```

### Contextual Delete Scenarios

#### Scenario 1: Delete Last Item in Category
- **Trigger**: Deleting item leaves category empty
- **System Behavior**:
  - Show additional message: "This will empty the '[Category]' category. Delete anyway?"
  - Option: "Delete item and category" OR "Just delete item"
- **User Choice**: Select option
- **Result**: Delete item, optionally delete empty category

#### Scenario 2: Delete High-Value Item
- **Trigger**: Item value > $1,000
- **System Behavior**:
  - Enhanced confirmation: "You're deleting a high-value item ($1,500). Are you sure?"
  - Require typing "DELETE" to confirm (optional security measure)
- **User Action**: Type confirmation or cancel
- **Result**: Proceed with caution

#### Scenario 3: Delete Item with Receipt/Documents
- **Trigger**: Item has attached receipts or documents
- **System Behavior**:
  - Warning: "This item has 2 attached documents. They will also be deleted."
  - Show document thumbnails
  - Option to download documents first
- **User Action**: Confirm or download documents
- **Result**: Delete item and all attachments

### Error Handling

#### Network Error During Delete
- **Scenario**: Offline or connection lost
- **System Behavior**:
  - Queue deletion locally
  - Show: "Item deleted locally. Will sync when online."
  - Sync when connection restored
- **User Experience**: Seamless offline deletion

#### Delete Fails on Server
- **Scenario**: Server rejects deletion (rare)
- **System Behavior**:
  - Restore item to UI
  - Show error: "Unable to delete item. Please try again."
  - Log error for debugging
- **User Action**: Retry deletion

#### Storage Cleanup Fails
- **Scenario**: Item deleted but images remain in storage
- **System Behavior**:
  - Mark images for cleanup
  - Retry cleanup in background
  - Silent failure (doesn't impact user)
- **Result**: Item deleted, images cleaned up eventually

### Security & Data Integrity

#### Audit Trail
- **Log Entry** (Optional for premium/enterprise):
  ```json
  {
    "action": "delete",
    "itemId": "item-123",
    "itemName": "MacBook Pro",
    "userId": "user-456",
    "timestamp": "2025-10-10T14:32:00Z",
    "restored": false,
    "permanentDeletedAt": "2025-10-10T14:32:10Z"
  }
  ```

#### Data Retention Policy
- **Soft Delete Period**: 10 seconds (immediate undo)
- **Trash Retention**: 30 days (future feature)
- **Permanent Delete**: After undo period expires
- **Compliance**: Meet GDPR right to erasure

### Success Metrics
- **Accidental Deletes**: < 5% of deletes are undone
- **Delete Confirmation**: 100% of deletes require confirmation (unless disabled)
- **Undo Usage**: Track undo click rate
- **Error Rate**: < 0.5% delete operations fail

### User Education

#### First Delete Experience
- **Tooltip**: "Don't worry, you can undo this for 10 seconds"
- **Highlight**: Undo button pulses briefly
- **Tutorial**: Optional one-time explanation

#### Settings Option
- **Preference**: "Delete Confirmation"
  - Always ask (default)
  - Skip confirmation
  - Never allow deletion (parental control)

---

## 6. Categorization Workflow

### Overview
User creates, manages, and organizes items using hierarchical categories.

### Primary Flow

```
START → Category Management
  ↓
[Decision] Action?
  ↓
├─ Create Category
│  ↓
│  Enter Category Details
│  ↓
│  [Optional] Select Parent Category
│  ↓
│  [Optional] Choose Icon/Color
│  ↓
│  Save Category
│  ↓
│  Category Added to List
│  ↓
│  END
│
├─ Edit Category
│  ↓
│  Modify Category Details
│  ↓
│  Save Changes
│  ↓
│  Update All Items in Category
│  ↓
│  END
│
└─ Delete Category
   ↓
   Check for Items in Category
   ↓
   [Decision] Has Items?
   ↓ YES                    ↓ NO
   ↓                        ↓
   Reassign Items Dialog  Confirm Deletion
   ↓                        ↓
   Select New Category    Delete Category
   ↓                        ↓
   Move Items             END
   ↓
   Delete Category
   ↓
   END
```

### Detailed Steps

#### Step 1: Access Category Management
**From Dashboard:**
- **Screen**: Main navigation or sidebar
- **User Sees**:
  - "Categories" menu item
  - Category count badge: "15 categories"
- **User Actions**: Click "Categories"
- **System Response**: Navigate to category management page

**From Item Form:**
- **Screen**: Add/Edit item form
- **User Sees**: "+ Create New Category" link in category dropdown
- **User Actions**: Click "+ Create New Category"
- **System Response**: Inline category creation form appears

#### Step 2: Category Management Page
- **Screen**: Category overview
- **User Sees**:
  - List of all categories (tree or flat view)
  - Item count per category
  - "Create Category" button
  - Search categories field
  - Each category has:
    - Icon/Color indicator
    - Name
    - Item count
    - Edit/Delete buttons
- **User Actions**: Choose create, edit, or delete
- **System Response**: Show appropriate interface

### Create Category Flow

#### Step 3: Create New Category
- **Screen**: Create category form/modal
- **User Sees**:
  - "Create Category" title
  - Required fields:
    - Category Name* (text input)
  - Optional fields:
    - Parent Category (dropdown for hierarchy)
    - Icon (icon picker)
    - Color (color picker)
    - Description (textarea)
  - "Create" and "Cancel" buttons
- **User Actions**: Fill form and click "Create"
- **System Response**: Validate and save

##### Sub-flow: Choose Icon
```
Click Icon Picker
  ↓
Icon Selection Modal
  ↓
Browse Icon Categories:
- General, Electronics, Furniture, etc.
  ↓
Search Icons by Name
  ↓
Select Icon
  ↓
Preview in Form
  ↓
Confirm Selection
```

##### Sub-flow: Choose Color
```
Click Color Picker
  ↓
Color Palette Appears
  ↓
Predefined Colors:
🔴 🟠 🟡 🟢 🔵 🟣 🟤 ⚫
  ↓
Select Color OR Enter Hex Code
  ↓
Preview Badge with Color
  ↓
Confirm Selection
```

##### Sub-flow: Set Parent Category (Hierarchy)
```
Click "Parent Category" Dropdown
  ↓
Show Existing Categories
  ↓
Option: "None (Top Level)"
  ↓
Select Parent Category
  ↓
Preview Hierarchy:
"Electronics > Computers > [New Category]"
  ↓
Confirm Selection
```

#### Step 4: Category Validation
- **Validation Rules**:
  - Name required (2-50 characters)
  - Name must be unique within parent
  - No circular hierarchy (category can't be its own parent)
  - Maximum nesting depth: 5 levels
- **Error Handling**:
  - Show inline error messages
  - Prevent save if validation fails
  - Suggest similar existing categories

#### Step 5: Category Created
- **Screen**: Success notification
- **User Sees**:
  - Toast: "Category '[Name]' created"
  - New category appears in list
  - Option: "Add items to this category"
- **System Response**:
  - Add category to database
  - Update category list
  - If from item form: Auto-select new category

### Edit Category Flow

#### Step 6: Edit Existing Category
- **Screen**: Edit category form (similar to create)
- **User Sees**:
  - Pre-filled form with current values
  - Item count: "23 items in this category"
  - "Save Changes" and "Cancel" buttons
  - Warning if editing affects many items
- **User Actions**: Modify fields and save
- **System Response**: Update category and all associated items

#### Step 7: Change Parent Category
- **Scenario**: Moving category in hierarchy
- **Screen**: Parent category dropdown
- **User Sees**:
  - Current parent (if any)
  - All valid parent options
  - Invalid options disabled (prevent circular reference)
- **User Actions**: Select new parent
- **System Response**:
  - Show preview of new hierarchy
  - Update all descendant categories
  - Update item category paths

#### Step 8: Edit Confirmation
- **Trigger**: User clicks "Save Changes"
- **Screen**: Confirmation dialog (if significant change)
- **User Sees**:
  - "Update 23 items in this category?"
  - List of changes
  - "Cancel" and "Confirm" buttons
- **User Actions**: Confirm or cancel
- **System Response**: Apply changes to all items

### Delete Category Flow

#### Step 9: Delete Category
- **Screen**: Category management page
- **User Sees**: "Delete" button on category
- **User Actions**: Click "Delete"
- **System Response**: Check for items in category

#### Step 10: Handle Items in Category
**If Category is Empty:**
- **Screen**: Simple confirmation dialog
- **User Sees**: "Delete '[Category Name]'? This can't be undone."
- **User Actions**: Confirm or cancel
- **System Response**: Delete category immediately

**If Category Has Items:**
- **Screen**: Reassignment dialog
- **User Sees**:
  - Warning: "This category contains 23 items"
  - Options:
    1. **Move to another category**: Dropdown to select destination
    2. **Move to parent category**: One-click option
    3. **Leave uncategorized**: Remove category, don't reassign
  - "Cancel" and "Delete & Move" buttons
- **User Actions**: Select option and confirm
- **System Response**:
  - Reassign all items
  - Delete category
  - Update item counts

##### Reassignment Options

**Option 1: Move to Specific Category**
```
Select Destination Category from Dropdown
  ↓
Preview: "23 items will move to [Category]"
  ↓
Click "Delete & Move"
  ↓
Update All Items
  ↓
Delete Original Category
  ↓
Show Success Message
```

**Option 2: Move to Parent**
```
Click "Move to Parent Category"
  ↓
Auto-Select Parent (e.g., "Electronics")
  ↓
Preview: "23 items will move to Electronics"
  ↓
Confirm
  ↓
Execute Move
```

**Option 3: Uncategorize**
```
Select "Leave Uncategorized"
  ↓
Warning: "Items will have no category"
  ↓
Confirm
  ↓
Set Item Category = NULL
  ↓
Delete Category
```

#### Step 11: Delete with Subcategories
- **Scenario**: Category has child categories
- **Screen**: Enhanced reassignment dialog
- **User Sees**:
  - "This category has 3 subcategories with 45 total items"
  - Options:
    1. Delete category and move subcategories up one level
    2. Delete category and all subcategories (requires item reassignment)
    3. Cancel
- **User Actions**: Select option
- **System Response**: Execute complex restructuring

### Category Hierarchy Management

#### Step 12: View Category Hierarchy
- **Screen**: Category tree view
- **User Sees**:
  - Expandable/collapsible tree structure
  - Indent levels showing hierarchy
  - Item counts at each level (including descendants)
  - Example:
    ```
    📦 Home (450 items)
      🛋️ Furniture (120 items)
        🪑 Chairs (30 items)
        🛏️ Beds (15 items)
      🖥️ Electronics (200 items)
        💻 Computers (80 items)
          💻 Laptops (40 items)
          🖥️ Desktops (40 items)
        📱 Mobile Devices (50 items)
    ```
- **User Actions**: Expand/collapse nodes, drag to reorder
- **System Response**: Update hierarchy in real-time

#### Step 13: Drag-and-Drop Reorganization (Enhancement)
- **Screen**: Category tree with drag handles
- **User Sees**: Drag icon (⋮⋮) on each category
- **User Actions**:
  - Grab category by drag handle
  - Drag to new parent or position
  - Drop to complete move
- **System Response**:
  - Show drop target highlight
  - Validate move (no circular references)
  - Update hierarchy
  - Show confirmation

### Predefined Categories

#### Step 14: Initial Category Setup
- **Trigger**: New user first access
- **Screen**: Category setup wizard (optional)
- **User Sees**:
  - "Quick Setup: Choose common categories"
  - Predefined category sets:
    - 🏠 **Home Essentials**: Furniture, Appliances, Decor
    - 🖥️ **Electronics**: Computers, Mobile, Audio/Video
    - 🏃 **Hobbies**: Sports, Music, Collections
    - 💍 **Valuables**: Jewelry, Art, Antiques
  - Checkboxes to select sets
  - Option: "I'll create my own"
- **User Actions**: Select category sets or skip
- **System Response**:
  - Create selected categories
  - Show success message
  - Navigate to dashboard

### Alternative Flows

#### Alt-1: Quick Category Creation (Inline)
```
From Item Form
  ↓
Type New Category Name in Dropdown
  ↓
Press Enter or Click "Create"
  ↓
Category Created Instantly
  ↓
Auto-Selected for Item
  ↓
Continue Item Creation
```

#### Alt-2: Merge Categories
```
Select Multiple Categories (Checkboxes)
  ↓
Click "Merge Categories"
  ↓
Choose Primary Category (keeps name/icon)
  ↓
Confirm Merge
  ↓
Move All Items to Primary Category
  ↓
Delete Secondary Categories
```

#### Alt-3: Split Category
```
Select Large Category
  ↓
Click "Split Category"
  ↓
Create Multiple New Subcategories
  ↓
Manually or Auto-Assign Items to Subcategories
  ↓
(Optional) Delete Parent Category
```

#### Alt-4: Import Category Structure
```
Click "Import Categories"
  ↓
Upload CSV or JSON
  ↓
Map Fields (Name, Parent, Icon, etc.)
  ↓
Preview Category Tree
  ↓
Confirm Import
  ↓
Create All Categories
```

### Edge Cases

#### Duplicate Category Names
- **Within Same Parent**: Prevent creation, show error
- **Different Parents**: Allow (e.g., "Accessories" under "Electronics" and "Fashion")

#### Maximum Nesting Depth
- **Limit**: 5 levels deep
- **Reason**: Prevent over-complexity
- **Error**: "Maximum category depth reached"

#### Circular Reference Prevention
- **Scenario**: User tries to set category A as parent of category B, when B is already parent of A
- **System**: Detect cycle, prevent assignment
- **Error**: "Cannot create circular category hierarchy"

#### Category with No Items (Empty State)
- **Display**: Show empty state in category view
- **Message**: "No items in this category yet"
- **Action**: "Add Item" button

### Category Analytics (Enhancement)

#### Usage Statistics
- **Metrics Displayed**:
  - Most used categories
  - Categories with highest total value
  - Empty/unused categories
  - Category growth over time
- **Actions**:
  - Optimize category structure
  - Delete unused categories

### Success Metrics
- **Category Usage**: 85% of items have categories
- **Hierarchy Depth**: Average 2.5 levels
- **Category Count**: Average 12 categories per user
- **Management Time**: < 1 minute to create category

---

## 7. Image Upload Workflow

### Overview
User captures or uploads photos of inventory items, with optimization and management.

### Primary Flow

```
START → Item Form (Create/Edit)
  ↓
Click "Add Photos" Button
  ↓
[Decision] Upload Method?
  ↓
├─ Take Photo (Mobile)
│  ↓
│  Open Camera
│  ↓
│  Capture Photo
│  ↓
│  Review & Retake Option
│  ↓
│  Accept Photo
│  ↓
│  Process Image
│  ↓
│  Show Preview
│  ↓
│  END
│
├─ Upload from Device
│  ↓
│  File Browser Opens
│  ↓
│  Select Image(s)
│  ↓
│  Validate Format/Size
│  ↓
│  Upload & Compress
│  ↓
│  Show Preview
│  ↓
│  END
│
└─ Drag & Drop
   ↓
   Drag Image into Zone
   ↓
   Drop Indicator Shows
   ↓
   Release to Upload
   ↓
   Process Image
   ↓
   Show Preview
   ↓
   END
```

### Detailed Steps

#### Step 1: Access Image Upload
**From Item Creation Form:**
- **Screen**: Add item form, image section
- **User Sees**:
  - "Add Photos" button with camera icon
  - Drag-and-drop zone (dashed border)
  - Text: "Drag photos here or click to browse"
  - Supported formats: "JPEG, PNG, WebP (max 10MB)"
- **User Actions**: Click button, drag file, or open camera
- **System Response**: Show upload interface

**From Item Edit Mode:**
- **Screen**: Edit form with existing images
- **User Sees**:
  - Current image thumbnails
  - "Add More Photos" button
  - Maximum: "5 photos total"
- **User Actions**: Click "Add More"
- **System Response**: Show upload options

#### Step 2: Choose Upload Method

**Option 1: Take Photo (Mobile/Tablet)**
```
Click "Add Photos" Button
  ↓
Action Sheet Appears:
[📷 Take Photo]
[🖼️ Choose from Gallery]
[📁 Browse Files]
  ↓
Select "Take Photo"
  ↓
Request Camera Permission (First Time)
  ↓
Open Camera Interface
```

**Option 2: Upload from Device**
```
Click "Add Photos" Button
  ↓
File Browser Opens
  ↓
Navigate to Photos
  ↓
Select Single or Multiple Images
  ↓
Click "Open"
```

**Option 3: Drag & Drop**
```
Drag Image File from Desktop
  ↓
Hover Over Upload Zone
  ↓
Drop Zone Highlights
  ↓
Release Mouse Button
  ↓
File Drops
```

### Take Photo Flow (Mobile)

#### Step 3: Camera Capture
- **Screen**: Device camera interface
- **User Sees**:
  - Live camera viewfinder
  - Capture button (large circle)
  - Cancel button
  - Flash toggle (if available)
  - Camera flip button (front/back)
  - Grid overlay (optional)
- **User Actions**:
  - Position item in frame
  - Adjust flash/camera
  - Tap capture button
- **System Response**: Capture photo

#### Step 4: Review Captured Photo
- **Screen**: Photo preview
- **User Sees**:
  - Captured image (full screen)
  - Buttons:
    - "Retake" (camera icon)
    - "Use Photo" (checkmark)
    - Crop/Rotate tools (optional)
- **User Actions**:
  - Accept photo: Click "Use Photo"
  - Reject photo: Click "Retake"
- **System Response**:
  - If accepted: Process and upload
  - If rejected: Return to camera

#### Step 5: Image Processing (Camera)
- **Processing Steps**:
  1. Compress to target size (2MB max)
  2. Auto-orient based on EXIF data
  3. Generate thumbnail (200x200px)
  4. Strip EXIF metadata (privacy)
  5. Convert to WebP (if supported)
- **Screen**: Loading indicator
- **User Sees**: "Processing image..." spinner
- **System Response**:
  - Show progress bar
  - Estimate time (if > 2 seconds)

### Upload from Device Flow

#### Step 6: File Selection
- **Screen**: Native file browser
- **User Sees**:
  - File system navigation
  - Image thumbnails (if supported)
  - Multi-select option
  - File type filter: "Images"
- **User Actions**:
  - Navigate to image folder
  - Select one or multiple images (Ctrl/Cmd + Click)
  - Click "Open" or "Choose"
- **System Response**: Begin upload process

#### Step 7: File Validation
- **Validation Checks**:
  - File format: JPEG, PNG, WebP, HEIC
  - File size: Max 10MB per image
  - Total files: Max 5 images per item
  - Image dimensions: Min 200x200px
- **Error Handling**:
  - Invalid format: "Unsupported file type. Use JPEG, PNG, or WebP."
  - Too large: "Image exceeds 10MB. Please compress first."
  - Too many: "Maximum 5 photos per item."
  - Too small: "Image too small. Minimum 200x200px."

##### Sub-flow: Handle Oversized Image
```
Image Exceeds 10MB
  ↓
Show Error Dialog:
"Image is 15MB (limit: 10MB)"
  ↓
Options:
[Auto-Compress to 2MB]
[Choose Different Image]
  ↓
If "Auto-Compress":
→ Compress Image
→ Show Result: "Compressed to 2.1MB"
→ Proceed with Upload
```

#### Step 8: Upload Progress
- **Screen**: Upload progress indicator
- **User Sees**:
  - Progress bar for each image
  - Percentage: "Uploading... 45%"
  - Estimated time remaining
  - Cancel upload button (X)
- **System Response**:
  - Upload file to server/storage
  - Show real-time progress
  - Update on completion

#### Step 9: Image Optimization
- **Processing Steps** (Server or Client):
  1. **Compression**: Reduce to 1-2MB
  2. **Resizing**: Max dimensions 2000x2000px
  3. **Thumbnail**: Generate 200x200px preview
  4. **Format Conversion**: Convert to WebP (fallback: JPEG)
  5. **EXIF Stripping**: Remove location/metadata
  6. **Validation**: Ensure image integrity
- **Performance**:
  - Client-side: Faster, uses device resources
  - Server-side: Consistent quality, better compression
  - Hybrid: Compress client-side, optimize server-side

### Drag & Drop Flow

#### Step 10: Drag-and-Drop Interaction
- **Screen**: Item form with drop zone
- **User Sees**:
  - Dashed border area
  - Drop zone text: "Drag photos here"
- **User Actions**:
  1. Drag image file from desktop/folder
  2. Hover over drop zone
  3. Drop zone highlights (solid border, background color change)
  4. Release mouse button
- **System Response**:
  - Detect file over drop zone
  - Show visual feedback
  - Trigger upload on drop

#### Step 11: Multi-File Drag-and-Drop
- **Scenario**: User drags 3 images at once
- **Screen**: Drop zone with multiple file indicator
- **User Sees**:
  - "Dropping 3 images"
  - Visual preview of files being dropped
- **System Response**:
  - Accept all valid files (up to limit)
  - Reject invalid files with error messages
  - Upload valid files in parallel

### Image Management

#### Step 12: Image Preview & Management
- **Screen**: Image gallery in item form
- **User Sees**:
  - Thumbnail grid of uploaded images
  - Each thumbnail has:
    - Image preview
    - "X" delete button (top-right corner)
    - ⭐ "Set as Primary" star icon
    - Drag handle (⋮⋮) for reordering
  - Image counter: "3/5 photos"
- **User Actions**:
  - View: Click thumbnail → Lightbox preview
  - Delete: Click "X" → Confirmation
  - Reorder: Drag thumbnails to rearrange
  - Set primary: Click star icon
- **System Response**: Update image list

##### Sub-flow: Set Primary Image
```
Click Star Icon on Image
  ↓
Star Icon Fills (becomes gold)
  ↓
Previous Primary Star Unfills
  ↓
Update Primary Image Flag in Database
  ↓
Item Card Shows New Primary Image
```

##### Sub-flow: Reorder Images
```
Click and Hold Drag Handle on Image
  ↓
Drag Thumbnail to New Position
  ↓
Other Thumbnails Shift to Make Space
  ↓
Release to Drop
  ↓
Update Image Order in Database
  ↓
First Image Auto-Set as Primary (If No Primary)
```

##### Sub-flow: Delete Image
```
Click "X" on Image Thumbnail
  ↓
Confirmation Dialog:
"Delete this photo?"
[Cancel] [Delete]
  ↓
If "Delete":
→ Remove from UI
→ Mark for Deletion
→ Delete from Storage (on save)
  ↓
If Primary Image Deleted:
→ Auto-Set Next Image as Primary
```

#### Step 13: Lightbox/Full-Size View
- **Trigger**: User clicks image thumbnail
- **Screen**: Full-screen overlay
- **User Sees**:
  - Full-resolution image
  - Navigation arrows (if multiple images)
  - Close button (X)
  - Image counter: "2 / 5"
  - Actions:
    - Set as Primary (star icon)
    - Delete (trash icon)
    - Download (download icon)
- **User Actions**:
  - Navigate: Arrow keys or swipe (mobile)
  - Close: Click X, press Esc, or tap outside
- **System Response**:
  - Show image in high quality
  - Preload adjacent images
  - Enable keyboard navigation

### Edge Cases & Error Handling

#### Network Failure During Upload
- **Scenario**: Connection lost mid-upload
- **Screen**: Error notification
- **User Sees**: "Upload failed. Retry?"
- **System Response**:
  - Pause upload
  - Queue for retry
  - Show retry button
  - Auto-retry when connection restored

#### Unsupported File Format
- **Scenario**: User tries to upload .BMP or .TIFF
- **System Response**:
  - Reject file
  - Show error: "Unsupported format: .BMP. Use JPEG, PNG, or WebP."
  - Keep upload dialog open for new selection

#### Camera Permission Denied
- **Scenario**: User denies camera access
- **Screen**: Permission error
- **User Sees**:
  - "Camera access denied"
  - "Enable in device settings to take photos"
  - Alternative: "Choose from Gallery" button
- **System Response**:
  - Show fallback upload options
  - Provide link to settings (if possible)

#### Slow Connection Warning
- **Scenario**: Upload takes > 5 seconds
- **Screen**: Progress bar with message
- **User Sees**:
  - "Slow connection detected"
  - "Compressing image for faster upload"
- **System Response**:
  - Increase compression ratio
  - Reduce image quality slightly
  - Complete upload successfully

#### Out of Storage (Cloud Version)
- **Scenario**: User exceeds storage quota
- **Screen**: Storage error dialog
- **User Sees**:
  - "Storage limit reached (100/100 GB)"
  - Options:
    - Delete old images
    - Upgrade storage plan
    - Cancel upload
- **System Response**:
  - Block upload
  - Show storage management options

### Image Optimization Settings (Advanced)

#### User Preferences
- **Settings Screen**: App settings > Images
- **Options**:
  - **Quality**:
    - High (5MB, original resolution)
    - Medium (2MB, 2000px max) [Default]
    - Low (500KB, 1200px max)
  - **Format**:
    - Auto (WebP with JPEG fallback) [Default]
    - Always JPEG
  - **Thumbnail Generation**: On/Off
  - **EXIF Stripping**: On [Default] / Off
  - **Auto-Compress**: On [Default] / Off

### Performance Targets

#### Upload Speed
- **Target**: 95% of uploads complete in < 5 seconds
- **Optimization**:
  - Client-side compression before upload
  - Parallel uploads (multiple images)
  - CDN for fast delivery

#### Processing Time
- **Target**: Image processing < 2 seconds per image
- **Optimization**:
  - Hardware acceleration (WebAssembly, GPU)
  - Lazy processing (process after upload)
  - Background processing (server-side)

### Success Metrics
- **Image Upload Success Rate**: > 98%
- **Average Images Per Item**: 2.3
- **Image Quality Satisfaction**: > 4.5/5
- **Upload Abandonment**: < 3%

---

## Summary & Key Insights

### Critical Success Factors
1. **Onboarding**: Get users to first value (item added) in < 5 minutes
2. **Speed**: Search and page loads must feel instant (< 500ms perceived)
3. **Simplicity**: Core workflows should require minimal clicks
4. **Visual Clarity**: Images are central to the experience
5. **Error Prevention**: Validate and guide before errors occur

### User Experience Principles
- **Progressive Disclosure**: Show simple options first, advanced on demand
- **Confirmation for Destructive Actions**: Always confirm deletes
- **Undo Capability**: Provide undo for major changes (10-second window)
- **Real-time Feedback**: Show immediate response to user actions
- **Helpful Empty States**: Guide users when screens are empty

### Mobile-First Considerations
- **Touch Targets**: Minimum 44x44px tap areas
- **Swipe Gestures**: Delete, navigate, reorder
- **Camera Integration**: Seamless photo capture
- **Offline Support**: Core features work offline

### Accessibility Standards
- **Keyboard Navigation**: Full functionality without mouse
- **Screen Reader Support**: Proper ARIA labels
- **High Contrast Mode**: Ensure visibility
- **Focus Indicators**: Clear focus states

---

**Document Status**: Complete
**Next Steps**: Data relationship analysis, database schema design
**Coordination**: Share with Coder and Architect agents
**Memory Key**: `swarm/analyst/user-flows-complete`
