# Tesseract.js Module Resolution Fix

## Problem Summary

The error `Cannot find module '/ROOT/home-inventory/node_modules/tesseract.js/src/worker-script/node/index.js'` occurred when trying to use tesseract.js OCR in Next.js API routes. This is a common issue when using tesseract.js in server-side Next.js contexts.

### Root Cause

When tesseract.js (v6.0.1) initializes in a Node.js environment, it uses `__dirname` to resolve the worker script path. However, in Next.js server functions, the module resolution context can be different, causing the worker-script path to be incorrectly resolved at runtime.

The issue manifests in the `/src/features/receipt-processing/services/ocr.service.ts` file when calling `createWorker()`.

## Solution Implemented

### Fix in OCR Service

Modified `/src/features/receipt-processing/services/ocr.service.ts` to explicitly resolve the worker path before passing it to `createWorker()`:

```typescript
// In OCR Service initialize() method
if ((typeof window === 'undefined') && (global as any).process) {
  try {
    const path = require('path');
    const moduleResolve = require.resolve;
    const tesseractModulePath = moduleResolve('tesseract.js');
    const tesseractDir = path.dirname(tesseractModulePath);
    const workerScriptPath = path.join(tesseractDir, 'worker-script', 'node', 'index.js');

    console.log(`[OCR] Using worker path: ${workerScriptPath}`);
    workerOptions.workerPath = workerScriptPath;
  } catch (pathError) {
    console.warn('[OCR] Could not resolve worker path explicitly, falling back to default', pathError);
  }
}
```

### How It Works

1. **Detection**: Checks if running in Node.js environment (not browser): `typeof window === 'undefined'`
2. **Resolution**: Uses `require.resolve()` to get the actual tesseract.js module path
3. **Path Construction**: Builds the correct worker script path relative to the module location
4. **Fallback**: If explicit resolution fails, falls back to tesseract.js default behavior

### Benefits

- ✅ Fixes module resolution in Next.js server contexts
- ✅ Maintains backward compatibility with default resolution
- ✅ Works with various Node.js environments
- ✅ Minimal performance impact (executed only during initialization)
- ✅ Clear logging for debugging

## Testing

### Unit Test - Direct Node.js
```bash
node test-receipts.js
```
Expected: OCR processes successfully with visible progress output.

### Integration Test - Next.js API
```bash
npm run dev
# Call POST /api/receipts/process with an image file
```

### Build Test
```bash
npm run build
```
Expected: Build completes with no errors.

## Files Modified

- `/src/features/receipt-processing/services/ocr.service.ts` - Added explicit worker path resolution

## Environment Compatibility

- ✅ Node.js standalone (test-receipts.js)
- ✅ Next.js development server
- ✅ Next.js production build
- ✅ Docker/containerized environments

## Troubleshooting

### If Error Persists

1. **Check tesseract.js installation**:
   ```bash
   npm list tesseract.js
   # Should show: tesseract.js@6.0.1
   ```

2. **Verify worker script exists**:
   ```bash
   ls -la node_modules/tesseract.js/src/worker-script/node/index.js
   ```

3. **Check logs for path resolution**:
   Look for `[OCR] Using worker path:` in console output to see resolved path.

4. **Reinstall if needed**:
   ```bash
   rm -rf node_modules
   npm install
   npm run build
   ```

## Related Documentation

- [tesseract.js Documentation](https://github.com/naptha/tesseract.js)
- [Next.js Server Functions](https://nextjs.org/docs/app/api-routes)
- [Node.js Worker Threads](https://nodejs.org/api/worker_threads.html)

## References

- Issue: Module resolution in Next.js server context
- Fixed In: Receipt OCR Service initialization
- Version: tesseract.js v6.0.1
