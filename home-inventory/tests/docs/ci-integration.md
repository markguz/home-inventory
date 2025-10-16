# CI/CD Integration Guide for Receipt Processing Tests

Guide for integrating receipt processing E2E tests into continuous integration pipelines.

## 🔧 GitHub Actions Setup

### Complete Workflow Example

Create `.github/workflows/e2e-receipt-tests.yml`:

```yaml
name: Receipt Processing E2E Tests

on:
  push:
    branches: [ main, develop ]
    paths:
      - 'home-inventory/src/features/receipt-processing/**'
      - 'home-inventory/tests/e2e/receipt-processing.spec.ts'
      - 'sample_receipts/**'
  pull_request:
    branches: [ main ]
  workflow_dispatch:

jobs:
  test-receipt-processing:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
      fail-fast: false

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: home-inventory/package-lock.json

      - name: Install dependencies
        working-directory: ./home-inventory
        run: npm ci

      - name: Install Playwright browsers
        working-directory: ./home-inventory
        run: npx playwright install --with-deps ${{ matrix.browser }}

      - name: Setup test database
        working-directory: ./home-inventory
        run: |
          npm run db:migrate
          npm run db:seed:test
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Build Next.js application
        working-directory: ./home-inventory
        run: npm run build

      - name: Run receipt processing E2E tests
        working-directory: ./home-inventory
        run: npx playwright test receipt-processing --project=${{ matrix.browser }}
        env:
          BASE_URL: http://localhost:3000
          USERNAME: ${{ secrets.TEST_USERNAME }}
          PASSWORD: ${{ secrets.TEST_PASSWORD }}
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report-${{ matrix.browser }}
          path: home-inventory/playwright-report/
          retention-days: 30

      - name: Upload test screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-screenshots-${{ matrix.browser }}
          path: home-inventory/test-results/
          retention-days: 7

      - name: Upload trace files
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-traces-${{ matrix.browser }}
          path: home-inventory/playwright-report/trace.zip
          retention-days: 7
```

## 🎯 Optimization Strategies

### 1. Parallel Execution

Run tests in parallel across multiple workers:

```yaml
- name: Run tests in parallel
  run: npx playwright test receipt-processing --workers=4
```

### 2. Sharded Tests

Split tests across multiple jobs:

```yaml
strategy:
  matrix:
    shard: [1, 2, 3, 4]

steps:
  - name: Run test shard
    run: npx playwright test receipt-processing --shard=${{ matrix.shard }}/4
```

### 3. Caching

Cache Playwright browsers:

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v3
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('home-inventory/package-lock.json') }}
```

### 4. Conditional Execution

Run only on specific changes:

```yaml
on:
  push:
    paths:
      - 'home-inventory/src/features/receipt-processing/**'
      - 'home-inventory/tests/e2e/receipt-processing.spec.ts'
```

## 🚀 Performance Optimizations

### 1. Skip Slow Tests in CI

Mark slow tests with tags:

```typescript
test('should process large receipt @slow', async ({ page }) => {
  // Test code
});
```

Skip in CI:

```yaml
- name: Run fast tests only
  run: npx playwright test receipt-processing --grep-invert @slow
```

### 2. Use Smaller Test Data

Create CI-specific receipts:

```typescript
const CI_RECEIPT = process.env.CI
  ? 'small-test-receipt.jpg'  // Fast for CI
  : 'heb.jpg';                  // Real receipt for local
```

### 3. Reduce Retries

```yaml
- name: Run tests with retries
  run: npx playwright test receipt-processing --retries=2
  env:
    CI: true
```

## 📊 Test Reporting

### 1. Publish HTML Report

```yaml
- name: Publish test report
  if: always()
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: home-inventory/playwright-report
    destination_dir: test-reports/${{ github.run_number }}
```

### 2. Comment on PR

```yaml
- name: Comment test results
  if: github.event_name == 'pull_request'
  uses: actions/github-script@v6
  with:
    script: |
      const fs = require('fs');
      const report = fs.readFileSync('playwright-report/index.html', 'utf8');
      github.rest.issues.createComment({
        issue_number: context.issue.number,
        owner: context.repo.owner,
        repo: context.repo.repo,
        body: '## 🧪 Test Results\n\nReceipt processing tests: [View Report](https://your-domain/test-reports/${{ github.run_number }})'
      });
```

### 3. Status Checks

Add required checks:

```yaml
- name: Check test results
  run: |
    if [ $? -eq 0 ]; then
      echo "✅ All tests passed"
    else
      echo "❌ Tests failed"
      exit 1
    fi
```

## 🐳 Docker Support

### Dockerfile for Testing

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

COPY home-inventory/package*.json ./
RUN npm ci

COPY home-inventory/ ./
COPY sample_receipts/ ../sample_receipts/

RUN npm run build

CMD ["npx", "playwright", "test", "receipt-processing"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  e2e-tests:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      - BASE_URL=http://app:3000
      - USERNAME=${TEST_USERNAME}
      - PASSWORD=${TEST_PASSWORD}
    volumes:
      - ./home-inventory/playwright-report:/app/playwright-report
      - ./home-inventory/test-results:/app/test-results
    depends_on:
      - app
      - db

  app:
    build: ./home-inventory
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://test:test@db:5432/testdb

  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test
      - POSTGRES_DB=testdb
```

## 🔐 Secrets Management

### Required Secrets

Configure in GitHub repository settings:

```
TEST_USERNAME=test@example.com
TEST_PASSWORD=SecurePassword123!
TEST_DATABASE_URL=postgresql://...
```

### Using Secrets

```yaml
env:
  USERNAME: ${{ secrets.TEST_USERNAME }}
  PASSWORD: ${{ secrets.TEST_PASSWORD }}
```

## 📈 Monitoring & Alerts

### 1. Slack Notifications

```yaml
- name: Notify on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Receipt processing tests failed",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "❌ Receipt E2E tests failed on ${{ github.ref }}"
            }
          }
        ]
      }
```

### 2. Test Trend Analysis

```yaml
- name: Generate test trends
  run: |
    npx playwright test receipt-processing --reporter=json > test-results.json
    # Parse and store metrics
```

## 🔍 Debugging Failed CI Tests

### 1. Enable Debug Logging

```yaml
- name: Run tests with debug
  run: DEBUG=pw:api npx playwright test receipt-processing
```

### 2. Save Video Recordings

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    video: process.env.CI ? 'retain-on-failure' : 'off',
  },
});
```

### 3. Increase Timeouts

```yaml
- name: Run tests with longer timeout
  run: npx playwright test receipt-processing --timeout=60000
```

## 📋 Pre-commit Hooks

### Setup Husky

```bash
npm install --save-dev husky lint-staged
npx husky install
```

### Pre-commit Hook

```bash
#!/bin/sh
npx playwright test receipt-processing --project=chromium
```

## 🎯 Quality Gates

### 1. Coverage Requirements

```yaml
- name: Check test coverage
  run: |
    npx playwright test receipt-processing --reporter=html
    # Verify minimum test pass rate
    if [ $(jq '.stats.passed / .stats.total' test-results.json) -lt 0.95 ]; then
      echo "❌ Pass rate below 95%"
      exit 1
    fi
```

### 2. Performance Benchmarks

```yaml
- name: Check performance
  run: |
    npx playwright test receipt-processing -g "Performance"
    # Verify processing time under threshold
```

## 🚦 Branch Protection Rules

Configure in GitHub:

1. **Require status checks to pass**
   - `test-receipt-processing (chromium)`
   - `test-receipt-processing (firefox)`

2. **Require review before merging**

3. **Require branches to be up to date**

## 📚 Resources

- [Playwright CI Documentation](https://playwright.dev/docs/ci)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Docker for Testing](https://www.docker.com/use-cases/testing/)
