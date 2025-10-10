# Getting Started with Home Inventory System

Welcome to the Home Inventory System! This guide will help you get started with tracking and managing your household items.

## What is Home Inventory System?

Home Inventory System is a modern web application designed to help you keep track of all your household items, their locations, values, and conditions. Whether you're managing items for insurance purposes, moving, or just staying organized, this system makes it easy.

## Key Features

- 📦 **Item Management** - Add, edit, and delete items with detailed information
- 🏠 **Category Organization** - Organize items by predefined categories (Home, Garage, Automobile)
- 📍 **Location Tracking** - Track where each item is stored with hierarchical locations
- 🏷️ **Flexible Tagging** - Create custom tags to group items by any criteria
- 🔍 **Powerful Search** - Find items quickly with advanced search and filtering
- 📸 **Image Support** - Attach images to your items for easy identification
- 💰 **Value Tracking** - Monitor purchase prices and current values
- 📱 **Responsive Design** - Access from any device - desktop, tablet, or mobile
- ⚡ **Fast Performance** - Built with modern web technologies for speed

## Quick Start

### Installation

1. **System Requirements**
   - Node.js 20.x or higher
   - npm or yarn package manager
   - Modern web browser (Chrome, Firefox, Safari, Edge)

2. **Download and Install**
   \`\`\`bash
   # Clone the repository
   git clone https://github.com/yourusername/home-inventory.git
   cd home-inventory/home-inventory

   # Install dependencies
   npm install

   # Set up environment variables
   cp .env.example .env

   # Initialize the database
   npx prisma migrate dev

   # Start the development server
   npm run dev
   \`\`\`

3. **Open the Application**
   - Navigate to \`http://localhost:3000\` in your web browser
   - You should see the Home Inventory dashboard

## Next Steps

Now that you're set up, explore these guides:

- [Adding Items](./adding-items.md) - Detailed guide on item creation
- [Organizing Items](./organizing-items.md) - Categories, locations, and tags
- [Searching Items](./searching-items.md) - Advanced search techniques
- [Tips and Tricks](./tips-and-tricks.md) - Power user features

Happy organizing! 🎉
