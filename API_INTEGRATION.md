# Prior Authorization System - API Integration Guide

This React application is fully integrated with backend APIs for managing prior authorization requests. All API calls are abstracted through service layers located in `/src/app/services/`.

## 🚀 Quick Start

1. **Configure API Endpoint**
   ```bash
   cp .env.example .env.local
   ```
   Update `VITE_API_BASE_URL` with your backend API URL.

2. **Mock vs Real API**
   - Currently using **mock responses** for development
   - To switch to real API: Uncomment actual API calls in service files
   - See [Switching to Real API](#switching-to-real-api) section

## 📁 Architecture

### Service Layer Structure

```
src/app/services/
├── api-client.ts       # Core HTTP client with auth handling
├── auth-service.ts     # Authentication endpoints
└── request-service.ts  # Prior auth request endpoints
```

### API Client Features

- ✅ Automatic JWT token management
- ✅ Request/response interceptors
- ✅ Error handling
- ✅ TypeScript types for all requests/responses
- ✅ localStorage integration for auth persistence

## 🔌 API Endpoints

### Authentication

#### `POST /auth/login`
**Request:**
```typescript
{
  username: string;
  password: string;
  role: 'nurse' | 'physician';
}
```

**Response:**
```typescript
{
  token: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    role: 'nurse' | 'physician';
    email: string;
  };
}
```

**Usage:**
```typescript
import { login } from './services/auth-service';

const response = await login({
  username: 'sarah.williams',
  password: 'password123',
  role: 'nurse'
});
```

---

#### `POST /auth/logout`
Clears authentication token.

**Usage:**
```typescript
import { logout } from './services/auth-service';
await logout();
```

---

#### `GET /auth/me`
Get currently authenticated user.

**Response:**
```typescript
{
  id: string;
  username: string;
  fullName: string;
  role: 'nurse' | 'physician';
  email: string;
}
```

---

### Prior Authorization Requests

#### `GET /prior-auth/requests`
Get all prior authorization requests.

**Response:**
```typescript
Array<{
  id: string;
  requestId: string;
  patientName: string;
  patientDob: string;
  memberId: string;
  provider: string;
  providerNpi: string;
  procedure: string;
  procedureCode: string;
  diagnosisCodes: string[];
  submittedDate: string;  // ISO 8601
  status: 'pending' | 'processing' | 'approved' | 'denied' | 'review';
  priority: 'high' | 'medium' | 'low';
  assignedTo?: string;
  documentUrl?: string;
}>
```

**Usage:**
```typescript
import { getAllRequests } from './services/request-service';

const requests = await getAllRequests();
```

---

#### `GET /prior-auth/requests/:id`
Get detailed information about a specific request including workflow and trace logs.

**Response:**
```typescript
{
  request: PriorAuthRequest;
  workflow: Array<{
    id: string;
    name: string;
    description: string;
    status: 'completed' | 'in-progress' | 'pending' | 'error';
    timestamp?: string;
    details?: string[];
  }>;
  trace: Array<{
    id: string;
    timestamp: string;
    level: 'info' | 'success' | 'warning' | 'error';
    category: string;
    message: string;
    details?: Record<string, any>;
  }>;
}
```

**Usage:**
```typescript
import { getRequestDetail } from './services/request-service';

const detail = await getRequestDetail('1');
```

---

#### `PUT /prior-auth/requests/:id`
Update prior authorization request fields.

**Request:**
```typescript
{
  patientName?: string;
  provider?: string;
  procedure?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'processing' | 'approved' | 'denied' | 'review';
  // ... other PriorAuthRequest fields
}
```

**Response:** Updated `PriorAuthRequest`

**Usage:**
```typescript
import { updateRequest } from './services/request-service';

const updated = await updateRequest('1', {
  patientName: 'Jane Doe',
  priority: 'high'
});
```

---

#### `PATCH /prior-auth/requests/:id/status`
Update only the status of a request.

**Request:**
```typescript
{
  status: 'pending' | 'processing' | 'approved' | 'denied' | 'review';
  reason?: string;  // Optional reason for status change
}
```

**Usage:**
```typescript
import { updateRequestStatus } from './services/request-service';

await updateRequestStatus('1', 'approved');
```

---

### Workflow Management

#### `PATCH /prior-auth/requests/:requestId/workflow/:stepId`
Update a workflow step.

**Request:**
```typescript
{
  name?: string;
  description?: string;
  status?: 'completed' | 'in-progress' | 'pending' | 'error';
  timestamp?: string;
  details?: string[];
}
```

**Response:** Updated `WorkflowStep`

**Usage:**
```typescript
import { updateWorkflowStep } from './services/request-service';

const updated = await updateWorkflowStep('req-1', 'step-3', {
  status: 'completed',
  details: ['Step completed successfully']
});
```

---

### Trace Logs

#### `POST /prior-auth/requests/:requestId/trace`
Add a new trace log entry.

**Request:**
```typescript
{
  timestamp: string;  // e.g., "10:23:15.234"
  level: 'info' | 'success' | 'warning' | 'error';
  category: string;   // e.g., "API Gateway", "IDP Service"
  message: string;
  details?: Record<string, any>;
}
```

**Response:** Created `TraceLog` with `id`

**Usage:**
```typescript
import { addTraceLog } from './services/request-service';

const log = await addTraceLog('req-1', {
  timestamp: '10:23:15.234',
  level: 'info',
  category: 'NLP Service',
  message: 'Processing completed',
  details: { confidence: 0.95 }
});
```

---

## 🔄 Switching to Real API

### Step 1: Update Environment Variables

Create `.env.local`:
```bash
VITE_API_BASE_URL=https://your-api-domain.com/api/v1
```

### Step 2: Uncomment Real API Calls

In each service file, uncomment the actual API calls and remove mock implementations.

**Example - `auth-service.ts`:**

```typescript
// Before (Mock)
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockResponse: LoginResponse = { ... };
      resolve(mockResponse);
    }, 800);
  });
}

// After (Real API)
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>('/auth/login', credentials);
}
```

### Step 3: Handle Real Errors

The API client already handles errors. You can customize error handling:

```typescript
try {
  const data = await getAllRequests();
} catch (error) {
  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('401')) {
      // Redirect to login
    }
  }
}
```

---

## 🎨 Editable Features

### Dashboard
- ✅ Search and filter requests
- ✅ Real-time data refresh
- ✅ Click rows to view details

### Request Detail Page
- ✅ **Edit Mode**: Click "Edit Details" to modify request fields
- ✅ Editable fields: Patient Name, Provider, Procedure, Priority, Status
- ✅ Auto-save with API integration
- ✅ Success/error notifications

### Workflow Steps
- ✅ Click edit icon on any workflow step
- ✅ Edit: Name, Description, Status, Details array
- ✅ Add/remove detail items
- ✅ Real-time updates

### Trace Logs
- ✅ Click "Add Log" to insert new trace entries
- ✅ Fields: Level, Category, Message, Details (JSON)
- ✅ Auto-scroll toggle
- ✅ Timestamp auto-generation

---

## 🔐 Authentication Flow

1. User logs in → `POST /auth/login`
2. Token stored in localStorage
3. Token automatically included in all subsequent requests
4. On logout → Token cleared from localStorage

**Token Management:**
```typescript
// In api-client.ts
headers['Authorization'] = `Bearer ${this.token}`;
```

---

## 📦 TypeScript Types

All API requests/responses are fully typed. Import from service files:

```typescript
import type { 
  PriorAuthRequest,
  WorkflowStep,
  TraceLog,
  LoginRequest,
  LoginResponse 
} from './services/...';
```

---

## 🧪 Testing with Mock Data

Mock responses are designed to simulate real backend behavior:

- ✅ Realistic delays (300ms - 800ms)
- ✅ Proper data structures
- ✅ Error simulation (optional)
- ✅ Stateful updates in memory

To test error handling, modify mock responses:

```typescript
export async function getAllRequests(): Promise<PriorAuthRequest[]> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('Failed to fetch requests'));
    }, 600);
  });
}
```

---

## 🚀 Backend Requirements

Your backend should implement:

### Required Headers
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (for authenticated endpoints)

### CORS Configuration
```javascript
// Example for Express.js
app.use(cors({
  origin: 'http://localhost:5173',  // Your Vite dev server
  credentials: true
}));
```

### Response Format
All responses should be JSON with consistent structure:

```typescript
// Success
{
  data: { ... },
  message?: string
}

// Error
{
  error: true,
  message: string,
  code?: string
}
```

---

## 📝 Example Backend Implementation (Node.js/Express)

```javascript
// Example endpoint
app.post('/api/v1/auth/login', async (req, res) => {
  const { username, password, role } = req.body;
  
  // Validate credentials
  const user = await User.findOne({ username });
  if (!user || !await user.comparePassword(password)) {
    return res.status(401).json({
      error: true,
      message: 'Invalid credentials'
    });
  }
  
  // Generate JWT
  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email
    }
  });
});
```

---

## 🛠️ Troubleshooting

### CORS Issues
If you see CORS errors, ensure your backend allows:
- Origin: Your frontend URL
- Methods: GET, POST, PUT, PATCH, DELETE
- Headers: Authorization, Content-Type

### 401 Unauthorized
- Check if token is being sent: DevTools → Network → Headers
- Verify token format: `Bearer <token>`
- Check token expiration

### Network Errors
- Verify `VITE_API_BASE_URL` is correct
- Check if backend is running
- Test endpoints with Postman/cURL first

---

## 📚 Additional Resources

- **API Client**: `/src/app/services/api-client.ts`
- **Service Files**: `/src/app/services/*.ts`
- **Environment Config**: `/.env.example`
- **Components**: `/src/app/components/`
- **Pages**: `/src/app/pages/`

---

## 🎯 Next Steps

1. ✅ Configure your backend API URL
2. ✅ Implement backend endpoints matching the API spec
3. ✅ Switch from mock to real API calls
4. ✅ Test authentication flow
5. ✅ Test CRUD operations
6. ✅ Add error handling and loading states
7. ✅ Deploy!

For questions or issues, refer to the inline comments in service files.
