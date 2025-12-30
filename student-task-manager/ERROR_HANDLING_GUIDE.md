# Error Handling Middleware - Implementation Summary

## Overview

This document provides a quick reference for the centralized error handling middleware implementation in the Student Task Manager application.

## Files Created/Modified

### New Files
1. **`lib/logger.ts`** - Structured logging utility
2. **`lib/errorHandler.ts`** - Centralized error handler
3. **`test-error-handling.ps1`** - Test script for error handling

### Modified Files
1. **`app/api/users/route.ts`** - Updated to use new error handler
2. **`README.md`** - Added comprehensive documentation

### Existing Files (Already Present)
1. **`lib/errorCodes.ts`** - Error code dictionary (already existed)
2. **`lib/responseHandler.ts`** - Response utilities (already existed)

## Quick Start

### Using the Error Handler

```typescript
import { handleError, AppError } from "@/lib/errorHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
import { logger } from "@/lib/logger";

export async function GET(req: NextRequest) {
  try {
    logger.info("Fetching data", { userId: "123" });
    
    const data = await prisma.user.findMany();
    
    return sendSuccess(data, "Data fetched successfully");
  } catch (error) {
    return handleError(error, "GET /api/users");
  }
}
```

### Throwing Custom Errors

```typescript
if (!user.isAdmin) {
  throw new AppError(
    "Insufficient permissions",
    ERROR_CODES.FORBIDDEN,
    403
  );
}
```

### Logging

```typescript
// Info logs
logger.info("User logged in", { userId: 123, email: "user@example.com" });

// Error logs
logger.error("Database query failed", { query: "SELECT *", error: err.message });

// Warning logs
logger.warn("Rate limit approaching", { requests: 95, limit: 100 });

// Debug logs
logger.debug("Cache hit", { key: "user:123", ttl: 3600 });
```

## Error Types Handled

| Error Type | Handler | Status Code | Example |
|------------|---------|-------------|---------|
| **Zod Validation** | Automatic | 400 | Invalid email format |
| **Prisma Database** | Automatic | 400-503 | Duplicate entry, connection failed |
| **Custom App Error** | `AppError` class | Custom | Insufficient permissions |
| **Generic Error** | Catch-all | 500 | Unexpected errors |

## Environment Differences

### Development Mode
- ✅ Full error messages
- ✅ Complete stack traces
- ✅ Detailed validation errors
- ✅ Prisma error codes exposed

### Production Mode
- ✅ Generic user-safe messages
- ✅ Stack traces redacted (logged only)
- ✅ Minimal error details
- ✅ Prisma codes hidden

## Testing

### Run Tests
```powershell
# Start dev server
npm run dev

# In another terminal, run tests
.\test-error-handling.ps1
```

### Manual Testing
```bash
# Test validation error
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"A","email":"invalid"}'

# Test successful request
curl -X GET http://localhost:3000/api/users?page=1&limit=5
```

## Error Codes Reference

### Validation (E001-E099)
- `E001` - Validation error
- `E002` - Missing required field
- `E003` - Invalid format
- `E004` - Invalid parameter

### Authentication (E100-E199)
- `E100` - Unauthorized
- `E101` - Forbidden
- `E102` - Invalid token
- `E103` - Token expired
- `E104` - Invalid credentials

### Resources (E200-E299)
- `E200` - Not found
- `E201` - Resource not found
- `E202` - User not found
- `E203` - Project not found
- `E204` - Task not found

### Database (E300-E399)
- `E300` - Database error
- `E301` - Database unreachable
- `E302` - Duplicate entry
- `E303` - Foreign key violation
- `E304` - Database connection failed

### Server (E500-E599)
- `E500` - Internal error
- `E501` - Service unavailable
- `E502` - Timeout
- `E503` - External API error

## Best Practices

1. ✅ **Always use `handleError` in catch blocks**
   ```typescript
   try {
     // code
   } catch (error) {
     return handleError(error, "GET /api/users");
   }
   ```

2. ✅ **Provide context with error handling**
   ```typescript
   return handleError(error, {
     route: "DELETE /api/tasks/:id",
     userId: user.id,
     taskId: params.id,
   });
   ```

3. ✅ **Use AppError for business logic errors**
   ```typescript
   throw new AppError("Not authorized", ERROR_CODES.FORBIDDEN, 403);
   ```

4. ✅ **Log important operations**
   ```typescript
   logger.info("User created", { userId: user.id, email: user.email });
   ```

5. ✅ **Test in both environments**
   - Development: `npm run dev`
   - Production: `NODE_ENV=production npm run build && npm start`

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": { ... },
  "timestamp": "2025-12-30T07:30:00.000Z"
}
```

### Error Response (Development)
```json
{
  "success": false,
  "message": "Database connection failed!",
  "error": {
    "code": "E304",
    "stack": "Error: Database connection failed!\n    at ..."
  },
  "timestamp": "2025-12-30T07:30:00.000Z"
}
```

### Error Response (Production)
```json
{
  "success": false,
  "message": "Something went wrong. Please try again later.",
  "error": {
    "code": "E304"
  },
  "timestamp": "2025-12-30T07:30:00.000Z"
}
```

## Log Format

All logs are structured JSON for easy parsing:

```json
{
  "level": "error",
  "message": "Error in GET /api/users",
  "meta": {
    "route": "GET /api/users",
    "userId": "alice@example.com",
    "message": "Database connection failed!",
    "stack": "REDACTED"
  },
  "timestamp": "2025-12-30T07:30:00.000Z",
  "environment": "production"
}
```

## Extending the Handler

To add custom error types:

```typescript
// 1. Create custom error class
export class RateLimitError extends Error {
  limit: number;
  current: number;
  
  constructor(message: string, limit: number, current: number) {
    super(message);
    this.name = "RateLimitError";
    this.limit = limit;
    this.current = current;
  }
}

// 2. Add handler in errorHandler.ts
if (error instanceof RateLimitError) {
  statusCode = 429;
  errorResponse = {
    success: false,
    message: isProd ? "Too many requests" : error.message,
    error: { code: ERROR_CODES.RATE_LIMIT },
    timestamp: new Date().toISOString(),
  };
  
  logger.error(`Rate limit exceeded in ${contextStr}`, {
    ...contextMeta,
    limit: error.limit,
    current: error.current,
  });
  
  return NextResponse.json(errorResponse, { status: statusCode });
}
```

## Monitoring & Debugging

### Query Logs (CloudWatch/Datadog)
```
# Find all errors for a user
meta.userId:"alice@example.com" AND level:"error"

# Find all database errors
meta.prismaCode:P* AND level:"error"

# Find all validation errors
error.code:"E001"
```

### Common Issues

1. **Stack traces in production**: Ensure `NODE_ENV=production`
2. **Logs not appearing**: Check console output format
3. **Error codes not matching**: Verify `ERROR_CODES` import

## Summary

The centralized error handling middleware provides:
- ✅ Consistent error responses across all routes
- ✅ Structured JSON logging for monitoring
- ✅ Environment-aware error messages
- ✅ Security through stack trace redaction
- ✅ Easy debugging with context preservation
- ✅ Extensible architecture for custom errors

For full documentation, see the **Error Handling Middleware** section in [README.md](../README.md).
