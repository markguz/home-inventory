# Testing Guide

Comprehensive testing strategy and examples.

## Testing Stack

- **Vitest**: Unit and integration tests
- **Testing Library**: Component tests
- **Playwright**: E2E tests
- **jest-axe**: Accessibility tests

## Running Tests

\`\`\`bash
# All tests
npm run test:all

# Unit tests
npm run test:unit

# Component tests
npm run test:components

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# With coverage
npm run test:coverage

# Watch mode
npm run test:watch
\`\`\`

## Test Structure

\`\`\`
tests/
├── unit/              # Unit tests
│   ├── lib/
│   └── utils/
├── components/        # Component tests
│   ├── items/
│   └── layout/
├── integration/       # Integration tests
│   ├── api/
│   └── pages/
└── e2e/              # E2E tests
    ├── items.spec.ts
    └── search.spec.ts
\`\`\`

## Unit Tests

### Example: Utility Function
\`\`\`typescript
import { describe, it, expect } from 'vitest';
import { formatCurrency } from '@/lib/utils';

describe('formatCurrency', () => {
  it('formats number as USD currency', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });
});
\`\`\`

## Component Tests

### Example: Button Component
\`\`\`typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    await user.click(screen.getByText('Click me'));
    
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
\`\`\`

## Integration Tests

### Example: API Route
\`\`\`typescript
import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/items/route';

describe('GET /api/items', () => {
  it('returns items list', async () => {
    const response = await GET(new Request('http://localhost/api/items'));
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
\`\`\`

## E2E Tests

### Example: Playwright Test
\`\`\`typescript
import { test, expect } from '@playwright/test';

test.describe('Item Management', () => {
  test('creates new item', async ({ page }) => {
    await page.goto('/');
    
    await page.click('text=Add Item');
    await page.fill('[name="name"]', 'Test Item');
    await page.selectOption('[name="categoryId"]', { label: 'Home' });
    await page.click('button:has-text("Save")');
    
    await expect(page.locator('text=Test Item')).toBeVisible();
  });
});
\`\`\`

## Accessibility Tests

\`\`\`typescript
import { axe, toHaveNoViolations } from 'jest-axe';
import { render } from '@testing-library/react';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<ItemCard item={mockItem} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
\`\`\`

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

View coverage:
\`\`\`bash
npm run test:coverage
\`\`\`

## Best Practices

1. **Test behavior, not implementation**
2. **Use descriptive test names**
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies**
5. **Test edge cases and error conditions**
6. **Keep tests focused and isolated**
7. **Use test fixtures for consistent data**

See also:
- [Architecture](./architecture.md)
- [Contributing Guide](../CONTRIBUTING.md)
