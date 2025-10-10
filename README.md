# 📦 Home Inventory System

> Modern home inventory management system built with Next.js 15, TypeScript, and Prisma

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)

**Home Inventory System** helps you track, organize, and manage all your household items with ease. Perfect for insurance documentation, moving, estate planning, or just staying organized.

## ✨ Features

- 📦 **Complete Item Management** - CRUD operations with detailed tracking
- 🏠 **Smart Categories** - Organize by Home, Garage, Automobile
- 📍 **Hierarchical Locations** - Track exactly where items are stored
- 🏷️ **Flexible Tagging** - Custom tags for any grouping you need
- 🔍 **Advanced Search** - Powerful filtering and search capabilities
- 📸 **Image Support** - Attach photos for easy identification
- 💰 **Value Tracking** - Monitor purchase prices and current values
- 📊 **Condition Tracking** - Track item condition over time
- 📱 **Responsive Design** - Works beautifully on all devices
- ⚡ **Blazing Fast** - Built with Next.js 15 and Turbopack

## 🚀 Quick Start

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/home-inventory.git
cd home-inventory/home-inventory

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Initialize database
npx prisma migrate dev

# Start development server
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📚 Documentation

- **[User Guide](./docs/user-guide/)** - Complete user documentation
  - [Getting Started](./docs/user-guide/getting-started.md)
  - [Adding Items](./docs/user-guide/adding-items.md)
  - [Organizing Items](./docs/user-guide/organizing-items.md)
  - [Searching Items](./docs/user-guide/searching-items.md)
  - [Tips and Tricks](./docs/user-guide/tips-and-tricks.md)

- **[Developer Guide](./docs/development/)** - Development documentation
  - [Setup Guide](./docs/development/setup.md)
  - [Architecture](./docs/development/architecture.md)
  - [Database](./docs/development/database.md)
  - [Testing](./docs/development/testing.md)

- **[API Documentation](./docs/api/)** - API reference
  - [API Overview](./docs/api/overview.md)
  - [Database Queries](./docs/api/database-queries.md)

- **[Deployment](./docs/deployment/)** - Deployment guides
  - [Vercel Deployment](./docs/deployment/vercel-deployment.md)
  - [Environment Variables](./docs/deployment/environment-variables.md)

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: SQLite with [Prisma ORM](https://www.prisma.io/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **State Management**: [TanStack Query](https://tanstack.com/query)
- **Testing**: [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/)

## 📋 Requirements

- Node.js 20.x or higher
- npm or yarn
- Modern web browser

## 🧪 Testing

\`\`\`bash
# Run all tests
npm run test:all

# Unit tests
npm run test:unit

# Component tests
npm run test:components

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Test with coverage
npm run test:coverage

# Watch mode
npm run test:watch
\`\`\`

## 🏗️ Project Structure

\`\`\`
home-inventory/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API routes
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Home page
│   ├── components/       # React components
│   │   ├── items/        # Item-related components
│   │   ├── layout/       # Layout components
│   │   └── ui/           # shadcn/ui components
│   ├── lib/              # Utility functions
│   │   ├── db.ts         # Prisma client
│   │   ├── utils.ts      # Helper functions
│   │   └── validations.ts # Zod schemas
│   └── types/            # TypeScript types
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Database migrations
├── tests/                # Test files
├── docs/                 # Documentation
└── public/               # Static assets
\`\`\`

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📧 Support

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/yourusername/home-inventory/issues)
- 💬 [Discussions](https://github.com/yourusername/home-inventory/discussions)

## 🗺️ Roadmap

- [ ] Authentication and multi-user support
- [ ] Cloud image storage integration
- [ ] Mobile app (React Native)
- [ ] Barcode scanning
- [ ] Data export to various formats
- [ ] Insurance report generation
- [ ] Depreciation calculation
- [ ] API for third-party integrations

---

**Built with ❤️ using Next.js and TypeScript**
