# Coding Standards

Code style guide and best practices for the project.

## TypeScript

### Type Safety
- Use explicit types for function parameters
- Avoid \`any\` type
- Use type inference where obvious
- Define interfaces for object shapes

\`\`\`typescript
// Good
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.currentValue, 0);
}

// Bad
function calculateTotal(items: any): any {
  return items.reduce((sum: any, item: any) => sum + item.currentValue, 0);
}
\`\`\`

### Naming Conventions
- **PascalCase**: Components, types, interfaces
- **camelCase**: Variables, functions, methods
- **UPPER_CASE**: Constants
- **kebab-case**: Files and folders

## React

### Component Structure
\`\`\`typescript
'use client';

import { useState } from 'react';
import type { Item } from '@/types';

interface ItemCardProps {
  item: Item;
  onEdit?: (id: string) => void;
}

export function ItemCard({ item, onEdit }: ItemCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div onMouseEnter={() => setIsHovered(true)}>
      {/* Content */}
    </div>
  );
}
\`\`\`

### Hooks
- Use hooks at top level
- Custom hooks start with \`use\`
- Keep hooks focused and reusable

## File Organization

### Directory Structure
\`\`\`
src/
├── app/              # Pages and API routes
├── components/       # React components
│   ├── items/        # Feature-specific
│   ├── layout/       # Layout components
│   └── ui/           # Base UI components
├── lib/              # Utilities and helpers
├── types/            # TypeScript types
└── hooks/            # Custom hooks
\`\`\`

### File Naming
- Components: \`PascalCase.tsx\`
- Utilities: \`camelCase.ts\`
- Types: \`camelCase.types.ts\`
- Hooks: \`useCamelCase.ts\`

## Formatting

### Prettier Config
\`\`\`json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
\`\`\`

### ESLint Rules
- No console.log in production
- Enforce TypeScript strict mode
- React hooks rules
- Accessibility rules (jsx-a11y)

## Comments

### When to Comment
- Complex algorithms
- Non-obvious workarounds
- TODO and FIXME markers
- Public API documentation

\`\`\`typescript
/**
 * Calculates depreciation using straight-line method
 * @param purchasePrice - Original purchase price
 * @param years - Years since purchase
 * @param depreciationRate - Annual depreciation rate (0-1)
 * @returns Current value after depreciation
 */
function calculateDepreciation(
  purchasePrice: number,
  years: number,
  depreciationRate: number
): number {
  return purchasePrice * Math.pow(1 - depreciationRate, years);
}
\`\`\`

## Error Handling

### API Routes
\`\`\`typescript
try {
  const data = await prisma.item.findMany();
  return NextResponse.json({ success: true, data });
} catch (error) {
  console.error('Error fetching items:', error);
  return NextResponse.json(
    { success: false, error: 'Failed to fetch items' },
    { status: 500 }
  );
}
\`\`\`

### Components
\`\`\`typescript
function ItemList() {
  const { data, error, isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: fetchItems
  });

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <div>{/* Render items */}</div>;
}
\`\`\`

## Best Practices

1. **Single Responsibility**: One component, one job
2. **DRY Principle**: Don't repeat yourself
3. **KISS**: Keep it simple, stupid
4. **Composition over Inheritance**: Use composition
5. **Immutability**: Don't mutate state directly
6. **Accessibility**: Always consider a11y
7. **Performance**: Optimize when necessary, not prematurely

## Git Commit Messages

Format:
\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

Types:
- \`feat\`: New feature
- \`fix\`: Bug fix
- \`docs\`: Documentation
- \`style\`: Formatting
- \`refactor\`: Code restructuring
- \`test\`: Adding tests
- \`chore\`: Maintenance

Example:
\`\`\`
feat(items): add image upload support

- Add image upload component
- Integrate with storage API
- Update item form to include image field

Closes #123
\`\`\`

See also:
- [Contributing Guide](../../CONTRIBUTING.md)
- [Architecture](./architecture.md)
