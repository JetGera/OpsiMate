# Performance Testing Guide for OpsiMate

This guide explains how to test and measure performance metrics in the OpsiMate codebase based on your tech stack.

## Tech Stack Overview

- **Server**: Node.js/Express with TypeScript, better-sqlite3
- **Client**: React with TypeScript
- **Testing**: Vitest
- **Database**: SQLite (better-sqlite3)

## Performance Testing Tools & Methods

### 1. **Node.js Built-in Performance API**

Use `performance.now()` for high-resolution timing:

```typescript
const startTime = performance.now();
// ... your code ...
const endTime = performance.now();
const duration = endTime - startTime; // milliseconds
```

**Example**: See `apps/server/src/dal/benchmark.ts`

### 2. **Vitest Performance Tests**

Create performance test files with `.perf.test.ts` suffix:

```typescript
import { describe, it, expect } from 'vitest';

describe('Performance Tests', () => {
  it('measures query performance', async () => {
    const startTime = performance.now();
    await someOperation();
    const duration = performance.now() - startTime;
    
    expect(duration).toBeLessThan(100); // Assert max duration
    console.log(`Operation took ${duration.toFixed(2)}ms`);
  });
});
```

**Run**: `pnpm test -- --grep "Performance"`

### 3. **Database Query Profiling (SQLite)**

Enable SQLite query timing:

```typescript
// In your repository
const startTime = performance.now();
const result = db.prepare(query).all();
const queryTime = performance.now() - startTime;
logger.info(`Query took ${queryTime.toFixed(2)}ms`);
```

### 4. **Express Middleware for API Timing**

Add timing middleware to measure API endpoints:

```typescript
// apps/server/src/middleware/timing.ts
import { Request, Response, NextFunction } from 'express';

export function timingMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = performance.now();
  
  res.on('finish', () => {
    const duration = performance.now() - startTime;
    console.log(`${req.method} ${req.path} - ${duration.toFixed(2)}ms`);
  });
  
  next();
}
```

### 5. **React Performance Profiling**

For client-side performance:

```typescript
// Use React DevTools Profiler
// Or measure with performance API:
const startTime = performance.now();
// ... render component ...
const renderTime = performance.now() - startTime;
```

### 6. **Node.js Profiler (Advanced)**

Use Node.js built-in profiler:

```bash
# Start with profiling
node --prof apps/server/src/index.ts

# Generate report
node --prof-process isolate-*.log > processed.txt
```

### 7. **Clinic.js (Recommended for Node.js)**

Install and use Clinic.js for comprehensive profiling:

```bash
pnpm add -D clinic
npx clinic doctor -- node apps/server/src/index.ts
```

## Bottleneck We Fixed

### Problem: N+1 Query Issue

**Before (N+1 queries)**:
- 1 query to fetch all services
- N queries (one per service) to fetch tags
- Total: 1 + N queries

**After (2 queries)**:
- 1 query to fetch all services
- 1 query to fetch all tags for all services
- Total: 2 queries

**Performance Improvement**:
- Before: ~50-100ms for 50 services (1ms per service query)
- After: ~5-10ms for 50 services (single batch query)
- **~10x faster** for typical workloads

## Running Performance Tests

### 1. Run the benchmark script:

```bash
cd apps/server
npx tsx src/dal/benchmark.ts
```

### 2. Run performance tests:

```bash
pnpm test serviceRepository.perf
```

### 3. Monitor API endpoints:

Add timing middleware and check logs for slow endpoints.

## Key Metrics to Monitor

1. **Database Query Time**: Should be < 10ms for simple queries
2. **API Response Time**: Should be < 200ms for most endpoints
3. **Memory Usage**: Monitor with `process.memoryUsage()`
4. **Query Count**: Avoid N+1 queries (use JOINs or batch queries)

## Best Practices

1. **Always measure before and after** optimizations
2. **Use realistic data volumes** in tests (50-100+ records)
3. **Run multiple iterations** and average results
4. **Profile in production-like environments** when possible
5. **Set performance budgets** (e.g., "API must respond in < 200ms")

## Example: Measuring Database Performance

```typescript
// Measure query performance
const measureQuery = async <T>(name: string, queryFn: () => Promise<T>): Promise<T> => {
  const start = performance.now();
  const result = await queryFn();
  const duration = performance.now() - start;
  console.log(`[PERF] ${name}: ${duration.toFixed(2)}ms`);
  return result;
};

// Usage
const services = await measureQuery(
  'getServicesWithProvider',
  () => serviceRepo.getServicesWithProvider()
);
```

## Continuous Performance Monitoring

Consider adding:
- Performance regression tests in CI/CD
- APM tools (e.g., New Relic, Datadog) for production
- Database query logging for slow queries
- Response time monitoring for APIs

