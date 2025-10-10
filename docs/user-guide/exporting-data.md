# Exporting Your Data

Learn how to export and backup your home inventory data in various formats.

## Why Export Data

Common reasons to export:
- **Backup**: Keep copies of your data
- **Insurance**: Provide documentation for claims
- **Sharing**: Send inventory to family, movers, appraisers
- **Analysis**: Analyze data in spreadsheets
- **Migration**: Move to different system
- **Reporting**: Create custom reports
- **Legal**: Estate planning documentation

## Export Formats

### CSV (Comma-Separated Values)

**Best for**:
- Opening in Excel or Google Sheets
- Data analysis
- Importing to other systems
- Simple backups

**Includes**:
- All item fields
- Can include/exclude images
- Custom field selection
- Filter before export

**Example**:
```csv
Name,Category,Location,Value,Purchase Date,Serial Number
Samsung TV,Electronics,Living Room,899.99,2024-01-15,SN123456
Dewalt Drill,Tools,Garage,149.99,2023-06-20,DW789012
```

### JSON (JavaScript Object Notation)

**Best for**:
- Developers and technical users
- API integration
- Complete data export
- System migration

**Includes**:
- Complete item data
- Nested relationships
- Metadata and timestamps
- Custom fields

**Example**:
```json
{
  "items": [
    {
      "id": "item_123",
      "name": "Samsung TV",
      "category": "Electronics",
      "location": "Living Room",
      "value": 899.99,
      "purchaseDate": "2024-01-15",
      "serialNumber": "SN123456",
      "images": [
        {
          "url": "https://...",
          "caption": "Front view"
        }
      ]
    }
  ]
}
```

### PDF Report

**Best for**:
- Insurance documentation
- Sharing with non-technical users
- Printing
- Professional presentation

**Includes**:
- Formatted item listings
- Images
- Summary statistics
- Custom report layouts

**Report Types**:
- Full Inventory Report
- Category Report
- Location Report
- High-Value Items Report
- Custom Report

### Excel Workbook

**Best for**:
- Complex data analysis
- Multiple sheets (categories, locations)
- Charts and graphs
- Financial calculations

**Includes**:
- Multiple worksheets
- Formatted data
- Formulas (totals, averages)
- Optional charts

### XML (Extensible Markup Language)

**Best for**:
- Enterprise systems
- Data interchange
- Compliance requirements
- Legacy system integration

## Basic Export

### Exporting All Items

1. Navigate to Items page
2. Click "Export" button
3. Select format (CSV, JSON, PDF, Excel)
4. Choose options:
   - Include images
   - Include custom fields
   - Date range
5. Click "Export"
6. File downloads automatically

### Exporting Filtered Items

Export a subset:

1. Apply filters to item list
2. Verify filtered results
3. Click "Export"
4. Choose "Export filtered items only"
5. Select format
6. Download

### Exporting Single Item

1. Open item details
2. Click "..." menu
3. Select "Export Item"
4. Choose format
5. Download

## Advanced Export Options

### Custom Field Selection

Choose which fields to include:

1. Click "Export" → "Advanced Options"
2. Select fields to include:
   - Basic fields (name, category, location)
   - Financial fields (value, purchase price)
   - Dates (added, purchased, updated)
   - Identification (serial, model)
   - Custom fields
3. Reorder fields as needed
4. Save as export template

### Export Templates

Save export configurations:

**Creating Template**:
1. Configure export options
2. Click "Save as Template"
3. Name template (e.g., "Insurance Report")
4. Template available for future exports

**Pre-built Templates**:
- Basic Inventory
- Insurance Documentation
- Value Assessment
- Location Inventory
- Category Breakdown
- Full Export (all data)

### Scheduled Exports (Future Feature)

Automate regular exports:

1. Settings → Scheduled Exports
2. Click "New Schedule"
3. Configure:
   - Export format
   - Fields to include
   - Frequency (daily, weekly, monthly)
   - Delivery method (email, cloud storage)
4. Save schedule

## Export with Images

### Image Export Options

**Individual Image Files**:
- Exports ZIP file
- One image per file
- Organized in folders
- Original filenames preserved

**Image Embedding**:
- Images embedded in PDF
- Thumbnails in Excel
- Not available for CSV

**Image References**:
- CSV/JSON includes image URLs
- Access images separately
- Smaller file size

### Image Organization

Exported images organized by:

**By Item**:
```
export/
  ├── Item_Name_1/
  │   ├── image_1.jpg
  │   ├── image_2.jpg
  ├── Item_Name_2/
  │   ├── image_1.jpg
```

**By Category**:
```
export/
  ├── Electronics/
  │   ├── TV_image_1.jpg
  │   ├── Laptop_image_1.jpg
  ├── Tools/
```

**Flat Structure**:
```
export/
  ├── item_123_image_1.jpg
  ├── item_123_image_2.jpg
  ├── item_456_image_1.jpg
```

## Export for Specific Uses

### Insurance Documentation

Create comprehensive insurance export:

**What to Include**:
- Item name and description
- Purchase price and current value
- Purchase date
- Serial numbers
- All images
- Receipts and documentation

**Steps**:
1. Filter for high-value items (optional)
2. Click Export → Insurance Report template
3. Select PDF format with images
4. Generate report
5. Save securely and provide to insurer

**Tips**:
- Export annually
- Update after major purchases
- Store copy off-site
- Keep copy with insurance documents

### Moving Inventory

Export for movers or relocation:

**What to Include**:
- Item name
- Location (current and destination)
- Fragile items marked
- Value for insurance
- Images for identification

**Steps**:
1. Tag items by destination room
2. Export with "Moving" template
3. Generate per-room lists
4. Print or share digitally with movers

### Estate Planning

Document belongings for estate:

**What to Include**:
- Complete item details
- Current market values
- Provenance for heirlooms
- Sentimental notes
- Intended recipients (custom field)

**Steps**:
1. Add estate-specific custom fields
2. Note special items
3. Export complete inventory
4. Store with estate documents
5. Update annually

### Tax Purposes

Document for tax deductions:

**What to Include**:
- Donated items
- Business equipment
- Purchase prices
- Dates acquired

**Steps**:
1. Filter by "donated" tag
2. Export with financial fields
3. Include purchase dates and values
4. Save with tax records

### Sales and Liquidation

Create listing inventory:

**What to Include**:
- Item descriptions
- Current condition
- Asking prices
- High-quality images

**Steps**:
1. Tag items "for-sale"
2. Export with images
3. Use for online listings
4. Track sold items

## Cloud Storage Integration (Future Feature)

### Auto-Backup to Cloud

Configure automatic backups:

**Supported Services**:
- Google Drive
- Dropbox
- OneDrive
- iCloud
- AWS S3

**Setup**:
1. Settings → Cloud Backup
2. Connect cloud service
3. Choose backup folder
4. Set backup frequency
5. Enable auto-backup

### Version History

Track changes over time:
- Automatic version snapshots
- Compare exports from different dates
- Restore previous data
- Track value changes

## Data Privacy and Security

### Sensitive Information

Consider privacy when exporting:

**Remove Before Sharing**:
- Serial numbers (unless for insurance)
- Purchase prices (unless necessary)
- Personal notes
- Home security details

**Redaction Options**:
1. Export → Privacy Options
2. Select fields to exclude
3. Blur sensitive images
4. Generate sanitized export

### Password Protection

Protect exports:

**PDF Protection**:
- Set password to open
- Set password to edit
- Encrypt document

**ZIP Encryption**:
- Password-protect ZIP files
- Use strong passwords
- Share password separately

### Secure Sharing

Share exports safely:

- Use encrypted email
- Share via secure link with expiration
- Use password-protected files
- Consider recipient's security

## Backup Strategy

### 3-2-1 Backup Rule

Maintain multiple copies:
- **3 copies**: Original + 2 backups
- **2 different media**: Cloud and external drive
- **1 off-site**: Cloud storage or different location

### Backup Schedule

Regular backup routine:
- **Weekly**: Quick CSV export
- **Monthly**: Full export with images
- **Annually**: Complete archive with all formats

### Backup Verification

Test your backups:
- Periodically download and open exports
- Verify images are included
- Check data completeness
- Ensure files aren't corrupted

## Import Data (Future Feature)

Re-import previously exported data:

1. Settings → Import Data
2. Select file to import
3. Map fields if needed
4. Preview import
5. Choose import options:
   - Skip duplicates
   - Update existing items
   - Import all as new
6. Confirm import

## Troubleshooting

### Export Fails

**Common issues**:
- File too large (many images)
- Browser timeout
- Insufficient storage
- Network interruption

**Solutions**:
- Export without images first
- Use smaller date ranges
- Export by category
- Try different browser
- Check disk space

### Corrupted Files

**Problems**:
- File won't open
- Data appears garbled
- Images missing

**Solutions**:
- Re-export the data
- Try different format
- Check original data in app
- Contact support

### Missing Data

**Items not in export**:
- Check filters were not applied
- Verify items exist in system
- Check date range settings
- Try different export format

## Best Practices

### Regular Exports

- Set up regular backup schedule
- Export after major updates
- Keep historical exports
- Test exports periodically

### Organization

- Name exports with dates
- Use consistent file naming
- Organize by purpose
- Keep export documentation

### Security

- Store backups securely
- Use encryption for sensitive data
- Don't share full exports unnecessarily
- Limit access to exports

### Maintenance

- Review exported data
- Delete old/unnecessary exports
- Update export templates
- Verify backup integrity

## Next Steps

- [Back to User Guide](getting-started.md)
- [Learn about organizing](organizing-items.md)
- [API Documentation](../api/overview.md) for programmatic exports

---

Need help? Check the [Troubleshooting Guide](../troubleshooting.md)
