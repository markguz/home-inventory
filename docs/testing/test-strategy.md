# Testing Strategy - Home Inventory System

## Overview

This document outlines the comprehensive testing strategy for the Home Inventory Management System. Our approach follows the testing pyramid with emphasis on Test-Driven Development (TDD) principles.

## Testing Philosophy

### Core Principles
1. **Test First**: Write tests before implementation (TDD)
2. **Fast Feedback**: Tests should run quickly (<100ms for unit tests)
3. **Isolated**: Each test is independent and can run in any order
4. **Comprehensive**: >80% code coverage across the codebase
5. **Maintainable**: Clear, readable tests that document behavior

## Test Pyramid

```
         /\
        /E2E\         <- Few, slow, high-value
       /------\           (~10 tests, 2-5 min)
      /  Integ \      <- Moderate, medium speed
     /----------\         (~20 tests, 30-60 sec)
    /    Unit    \    <- Many, fast, focused
   /--------------\       (~100+ tests, <10 sec)
```

## Test Types

### 1. Unit Tests (80% of tests)
**Location**: `tests/unit/`
**Duration**: <100ms each
**Coverage Target**: >85%

Tests isolated functions, utilities, and validations:
- ✅ Utility functions (formatCurrency, formatDate, etc.)
- ✅ Zod validation schemas
- ✅ Business logic functions
- ✅ Data transformations

**Example**:
```typescript
describe('formatCurrency', () => {
  it('should format number as USD', () => {
    expect(formatCurrency(1299.99)).toBe('$1,299.99');
  });
});
```

### 2. Component Tests (15% of tests)
**Location**: `tests/components/`
**Duration**: <500ms each
**Coverage Target**: >80%

Tests React components in isolation:
- ✅ Component rendering
- ✅ User interactions
- ✅ Props handling
- ✅ Event callbacks
- ✅ Conditional rendering

**Tools**: React Testing Library, Jest

**Example**:
```typescript
it('should call onEdit when edit clicked', async () => {
  const mockOnEdit = jest.fn();
  render(<ItemCard item={mockItem} onEdit={mockOnEdit} />);

  await user.click(screen.getByRole('button', { name: /edit/i }));

  expect(mockOnEdit).toHaveBeenCalledWith(mockItem);
});
```

### 3. API Route Tests (3% of tests)
**Location**: `tests/api/`
**Duration**: <1s each
**Coverage Target**: >80%

Tests Next.js API routes with mocked database:
- ✅ CRUD operations
- ✅ Query parameters
- ✅ Error handling
- ✅ Status codes
- ✅ Response formats

**Mocking Strategy**: Prisma Client is mocked using jest-mock-extended

### 4. Integration Tests (1.5% of tests)
**Location**: `tests/integration/`
**Duration**: 1-5s each

Tests complete user workflows:
- ✅ Create → Read → Update → Delete flows
- ✅ Search and filter combinations
- ✅ Multi-step processes
- ✅ Component + API interaction

### 5. E2E Tests (0.5% of tests)
**Location**: `tests/e2e/`
**Duration**: 5-30s each
**Tool**: Playwright

Tests full application flows in real browser:
- ✅ Critical user journeys
- ✅ Cross-browser compatibility
- ✅ Performance validation
- ✅ Visual regression (optional)

**Browsers Tested**: Chrome, Firefox, Safari, Mobile Chrome

## Running Tests

### Quick Commands
```bash
# Run all tests with coverage
npm test

# Run specific test suites
npm run test:unit           # Unit tests only
npm run test:components     # Component tests only
npm run test:api            # API tests only
npm run test:integration    # Integration tests only
npm run test:e2e            # E2E tests only

# Watch mode for development
npm run test:watch

# CI/CD full suite
npm run test:ci

# Coverage report
npm run test:coverage       # Opens HTML report
```

## Coverage Requirements

### Global Thresholds
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 80%
- **Lines**: 80%

### Per-Module Goals
- **Utilities**: 95%
- **Validations**: 90%
- **Components**: 80%
- **API Routes**: 85%

## Testing Best Practices

### 1. Test Structure (AAA Pattern)
```typescript
test('description', () => {
  // Arrange - Set up test data
  const input = 'test data';

  // Act - Execute the function
  const result = functionUnderTest(input);

  // Assert - Verify the result
  expect(result).toBe('expected');
});
```

### 2. Descriptive Test Names
✅ Good: `should return 404 when item not found`
❌ Bad: `test item not found`

### 3. One Assertion Per Test
Each test should verify one specific behavior.

### 4. Test Edge Cases
- Empty inputs
- Null/undefined values
- Maximum lengths
- Boundary conditions
- Error states
- Concurrent operations

### 5. Mock External Dependencies
- Database (Prisma)
- API calls
- File system
- Time/dates
- Random values

### 6. Fixtures and Test Data
Reusable test data in `tests/fixtures/`:
- `items.ts` - Mock inventory items
- `categories.ts` - Category data
- `users.ts` - User data

## Test Coverage Analysis

### Viewing Coverage Reports
```bash
npm run test:coverage
# Opens: coverage/index.html
```

### Coverage Report Includes
- File-by-file breakdown
- Uncovered lines highlighted
- Branch coverage visualization
- Function coverage metrics

## Continuous Integration

### Pre-commit Hooks
- Run unit tests
- Check test coverage
- Lint test files

### CI Pipeline
1. Install dependencies
2. Run linting
3. Run unit + component tests
4. Run integration tests
5. Run E2E tests (parallel)
6. Generate coverage report
7. Upload coverage to Codecov

## Performance Testing

### Metrics Tracked
- Test execution time
- Memory usage during tests
- API response times
- Component render times

### Performance Thresholds
- Unit test: <100ms
- Component test: <500ms
- API test: <1s
- Integration test: <5s
- E2E test: <30s

## Debugging Tests

### VS Code Launch Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

### Playwright Debug Mode
```bash
PWDEBUG=1 npm run test:e2e
```

## Common Test Patterns

### Testing Async Operations
```typescript
it('should handle async operation', async () => {
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  });
});
```

### Testing User Events
```typescript
it('should handle click', async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button'));
});
```

### Testing Forms
```typescript
it('should submit form', async () => {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/name/i), 'Test');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(mockOnSubmit).toHaveBeenCalled();
});
```

## Maintenance

### Regular Tasks
- Review and update test fixtures monthly
- Refactor slow tests
- Remove redundant tests
- Update snapshots when UI changes
- Review coverage trends

### Test Debt Prevention
- Write tests with new features
- Update tests when refactoring
- Delete tests for removed features
- Keep test dependencies updated

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

For questions about testing:
1. Check this documentation
2. Review existing test examples
3. Consult with QA team
4. Open discussion in #testing channel

---

**Last Updated**: 2025-10-10
**Version**: 1.0.0
**Maintained By**: QA Team / Tester Agent
