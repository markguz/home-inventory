# Contributing Guide

Thank you for your interest in contributing to Home Inventory System!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Test thoroughly
6. Submit a pull request

See [Setup Guide](./setup.md) for development environment setup.

## Development Workflow

### 1. Create Feature Branch
\`\`\`bash
git checkout -b feature/your-feature-name
\`\`\`

### 2. Make Changes
- Follow [Coding Standards](./coding-standards.md)
- Write tests for new features
- Update documentation as needed

### 3. Test Your Changes
\`\`\`bash
npm run test:all
npm run lint
npm run typecheck
\`\`\`

### 4. Commit Changes
Follow [conventional commits](https://www.conventionalcommits.org/):
\`\`\`bash
git commit -m "feat: add new feature"
\`\`\`

### 5. Push and Create PR
\`\`\`bash
git push origin feature/your-feature-name
\`\`\`

Then create a Pull Request on GitHub.

## Pull Request Guidelines

### PR Title
Use conventional commit format:
- \`feat: add image upload\`
- \`fix: resolve search bug\`
- \`docs: update API documentation\`

### PR Description
Include:
- What changes were made
- Why the changes were necessary
- How to test the changes
- Screenshots (for UI changes)
- Related issues

### PR Checklist
- [ ] Tests pass locally
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] Commit messages are clear
- [ ] No console.log statements
- [ ] Accessibility considered

## Code Review Process

1. Automated checks must pass
2. At least one maintainer approval required
3. All feedback addressed
4. Squash and merge to main

## Reporting Bugs

### Before Submitting
- Search existing issues
- Test on latest version
- Gather reproduction steps

### Bug Report Template
\`\`\`markdown
**Describe the bug**
A clear description of the bug.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS 13]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]
\`\`\`

## Feature Requests

### Template
\`\`\`markdown
**Is your feature request related to a problem?**
Description of the problem.

**Describe the solution you'd like**
Clear description of desired functionality.

**Describe alternatives**
Alternative solutions considered.

**Additional context**
Any other context or screenshots.
\`\`\`

## Questions?

- Read the [documentation](../README.md)
- Check [existing issues](https://github.com/yourusername/home-inventory/issues)
- Ask in [discussions](https://github.com/yourusername/home-inventory/discussions)

See also:
- [Coding Standards](./coding-standards.md)
- [Testing Guide](./testing.md)
- [Architecture](./architecture.md)
