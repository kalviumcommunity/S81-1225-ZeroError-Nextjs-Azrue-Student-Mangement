# Global API Response Handler - Quick Reference Guide

## 🚀 Quick Start

### Import the Handler
```typescript
import { sendSuccess, sendError, sendPaginatedSuccess, handlePrismaError } from "@/lib/responseHandler";
import { ERROR_CODES } from "@/lib/errorCodes";
```

## 📖 Function Reference

### 1. sendSuccess()
**Use when:** Operation succeeds and you want to return data

```typescript
// Simple success
return sendSuccess(data, "Operation successful");

// With custom status
return sendSuccess(newUser, "User created successfully", 201);
```

**Returns:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2025-12-26T08:37:15.123Z"
}
```

---

### 2. sendError()
**Use when:** Operation fails and you want to return an error

```typescript
// Simple error
return sendError("Something went wrong", ERROR_CODES.INTERNAL_ERROR, 500);

// With details
return sendError(
  "Missing required fields",
  ERROR_CODES.MISSING_REQUIRED_FIELD,
  400,
  { missingFields: ["email", "name"] }
);
```

**Returns:**
```json
{
  "success": false,
  "message": "Missing required fields",
  "error": {
    "code": "E002",
    "details": { "missingFields": ["email", "name"] }
  },
  "timestamp": "2025-12-26T08:37:15.123Z"
}
```

---

### 3. sendPaginatedSuccess()
**Use when:** Returning a paginated list of items

```typescript
const [items, total] = await prisma.$transaction([
  prisma.user.findMany({ skip, take: limit }),
  prisma.user.count()
]);

return sendPaginatedSuccess(items, total, page, limit, "Users fetched successfully");
```

**Returns:**
```json
{
  "success": true,
  "message": "Users fetched successfully",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  },
  "timestamp": "2025-12-26T08:37:15.123Z"
}
```

---

### 4. handlePrismaError()
**Use when:** Catching Prisma database errors

```typescript
try {
  const user = await prisma.user.create({ data });
  return sendSuccess(user, "User created successfully", 201);
} catch (error: any) {
  const { message, code, status } = handlePrismaError(error);
  return sendError(message, code, status, error?.message);
}
```

**Handles:**
- `P1001` → Database unreachable (503)
- `P2002` → Unique constraint violation (400)
- `P2003` → Foreign key violation (400)
- `P2025` → Record not found (404)
- Default → Internal error (500)

---

## 🏷️ Error Codes Quick Reference

| Code | Category | Description | HTTP Status |
|------|----------|-------------|-------------|
| **E001** | Validation | Validation error | 400 |
| **E002** | Validation | Missing required field | 400 |
| **E003** | Validation | Invalid format | 400 |
| **E100** | Auth | Unauthorized | 401 |
| **E104** | Auth | Invalid credentials | 401 |
| **E200** | Resource | Not found | 404 |
| **E202** | Resource | User not found | 404 |
| **E301** | Database | Database unreachable | 503 |
| **E302** | Database | Duplicate entry | 400 |
| **E303** | Database | Foreign key violation | 400 |
| **E401** | Business | Task creation failed | 500 |
| **E500** | Server | Internal error | 500 |

---

## 📝 Common Patterns

### Pattern 1: GET List with Pagination
```typescript
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 10)));
  const skip = (page - 1) * limit;

  try {
    const [items, total] = await prisma.$transaction([
      prisma.task.findMany({ skip, take: limit }),
      prisma.task.count()
    ]);
    
    return sendPaginatedSuccess(items, total, page, limit, "Tasks fetched successfully");
  } catch (error: any) {
    const { message, code, status } = handlePrismaError(error);
    return sendError(message, code, status, error?.message);
  }
}
```

### Pattern 2: POST Create with Validation
```typescript
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, projectId } = body ?? {};
    
    // Validation
    if (!title || !projectId) {
      return sendError(
        "Missing required fields: title and projectId are required",
        ERROR_CODES.MISSING_REQUIRED_FIELD,
        400,
        { missingFields: [!title && "title", !projectId && "projectId"].filter(Boolean) }
      );
    }
    
    // Create
    const task = await prisma.task.create({ data: body });
    return sendSuccess(task, "Task created successfully", 201);
  } catch (error: any) {
    const { message, code, status } = handlePrismaError(error);
    return sendError(message, code, status, error?.message);
  }
}
```

### Pattern 3: GET Single Item
```typescript
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    
    if (isNaN(id)) {
      return sendError("Invalid ID format", ERROR_CODES.INVALID_PARAMETER, 400);
    }
    
    const item = await prisma.task.findUnique({ where: { id } });
    
    if (!item) {
      return sendError("Task not found", ERROR_CODES.TASK_NOT_FOUND, 404);
    }
    
    return sendSuccess(item, "Task fetched successfully");
  } catch (error: any) {
    const { message, code, status } = handlePrismaError(error);
    return sendError(message, code, status, error?.message);
  }
}
```

### Pattern 4: PUT Update
```typescript
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    
    const updated = await prisma.task.update({
      where: { id },
      data: body
    });
    
    return sendSuccess(updated, "Task updated successfully");
  } catch (error: any) {
    const { message, code, status } = handlePrismaError(error);
    return sendError(message, code, status, error?.message);
  }
}
```

### Pattern 5: DELETE
```typescript
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    
    await prisma.task.delete({ where: { id } });
    
    return sendSuccess(null, "Task deleted successfully");
  } catch (error: any) {
    const { message, code, status } = handlePrismaError(error);
    return sendError(message, code, status, error?.message);
  }
}
```

---

## 🧪 Testing Examples

### PowerShell
```powershell
# Success - GET list
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/users?page=1&limit=10"

# Success - POST create
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/tasks `
  -Body (@{title='New Task'; projectId=1} | ConvertTo-Json) `
  -ContentType 'application/json'

# Error - Missing fields
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/tasks `
  -Body (@{description='No title'} | ConvertTo-Json) `
  -ContentType 'application/json'
```

### cURL
```bash
# Success - GET list
curl http://localhost:3000/api/users?page=1&limit=10

# Success - POST create
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"New Task","projectId":1}'

# Error - Missing fields
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"description":"No title"}'
```

---

## ✅ Checklist for New Endpoints

When creating a new API endpoint:

- [ ] Import `sendSuccess`, `sendError`, `handlePrismaError` from `@/lib/responseHandler`
- [ ] Import `ERROR_CODES` from `@/lib/errorCodes`
- [ ] Use `sendPaginatedSuccess()` for list endpoints
- [ ] Use `sendSuccess()` for single item responses
- [ ] Use `sendError()` for validation failures
- [ ] Use `handlePrismaError()` in catch blocks
- [ ] Include appropriate error codes
- [ ] Add helpful error details for debugging
- [ ] Test both success and error scenarios
- [ ] Update API documentation if needed

---

## 🎯 Best Practices

1. **Always use the handler** - Never return raw `NextResponse.json()`
2. **Choose appropriate error codes** - Use the correct category (E001-E599)
3. **Write clear messages** - Make error messages user-friendly
4. **Include helpful details** - Add context in the `details` field
5. **Log server-side** - Log full errors server-side, return safe messages to clients
6. **Test error paths** - Test both success and error scenarios
7. **Keep codes updated** - Add new error codes to `errorCodes.ts` as needed

---

## 📚 Additional Resources

- **Full Documentation**: See README.md "Global API Response Handler" section
- **Implementation Files**:
  - `lib/responseHandler.ts` - Handler utilities
  - `lib/errorCodes.ts` - Error code dictionary
  - `lib/__tests__/responseHandler.test.ts` - Example tests
- **Example Routes**:
  - `app/api/users/route.ts`
  - `app/api/tasks/route.ts`
  - `app/api/projects/route.ts`
  - `app/api/health/route.ts`

---

**Remember:** Consistency is key! Use these patterns across all your API endpoints for a professional, maintainable codebase. 🚀
