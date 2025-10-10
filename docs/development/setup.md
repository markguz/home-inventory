# Development Setup

Complete guide to setting up your development environment.

## Prerequisites

- **Node.js**: 20.x or higher
- **npm**: 10.x or higher (comes with Node.js)
- **Git**: Latest version
- **Code Editor**: VS Code recommended

## Initial Setup

### 1. Clone Repository
\`\`\`bash
git clone https://github.com/yourusername/home-inventory.git
cd home-inventory/home-inventory
\`\`\`

### 2. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Environment Variables
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env`:
\`\`\`env
DATABASE_URL="file:./prisma/dev.db"
NODE_ENV="development"
\`\`\`

### 4. Database Setup
\`\`\`bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Optional: Seed data
npx prisma db seed
\`\`\`

### 5. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## VS Code Setup

### Recommended Extensions
- ESLint
- Prettier
- Prisma
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features

### Settings (\`.vscode/settings.json\`)
\`\`\`json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
\`\`\`

## Available Scripts

\`\`\`bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run E2E tests
npm run typecheck    # Check TypeScript types
\`\`\`

## Database Commands

\`\`\`bash
npx prisma studio           # Open Prisma Studio
npx prisma migrate dev      # Create migration
npx prisma migrate reset    # Reset database
npx prisma db push          # Push schema changes
npx prisma generate         # Generate client
\`\`\`

## Troubleshooting

### Port Already in Use
\`\`\`bash
# Kill process on port 3000
npx kill-port 3000
\`\`\`

### Database Issues
\`\`\`bash
# Reset database
npx prisma migrate reset --force
npx prisma migrate dev
\`\`\`

### Clear Cache
\`\`\`bash
rm -rf .next
npm run dev
\`\`\`

See also:
- [Architecture](./architecture.md)
- [Database Guide](./database.md)
- [Testing Guide](./testing.md)
