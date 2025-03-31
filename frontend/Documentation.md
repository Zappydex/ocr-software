# Authentication Routing Documentation

This document outlines how authentication endpoints are routed between the frontend and backend of our application.

## Base URL Configuration

All API requests in the frontend use a centralized base URL configuration through Axios:

```javascript
// src/services/apiConfig.js
const API_URL = process.env.REACT_APP_API_URL || '/api';
const api = axios.create({ baseURL: API_URL });
```

**Key points:**
- All API requests use this base URL instance
- In production, it defaults to '/api' (relative path)
- In development, can be overridden with environment variable

## Authentication Endpoints

Authentication-related API calls are centralized in a dedicated service file:

```javascript
// src/services/auth/api.js
export const login = async (credentials) => {
  const response = await api.post('/accounts/login/', credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await api.post('/accounts/register/', userData);
  return response.data;
};

export const activateAccount = async (uidb64, token) => {
  const response = await api.post(`/accounts/activate/${uidb64}/${token}/`);
  return response.data;
};

export const requestPasswordReset = async (email) => {
  const response = await api.post('/accounts/password-reset/', { email });
  return response.data;
};

export const resetPassword = async (uidb64, token, passwords) => {
  const response = await api.post(`/accounts/reset-password/${uidb64}/${token}/`, passwords);
  return response.data;
};

export const loginWithGoogle = async (credential) => {
  const response = await api.post('/accounts/google/', { credential });
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/accounts/logout/');
  return response.data;
};
```

## Component to API Connection

Components import and call the appropriate API functions when needed:

```javascript
// Example from Login.js
import { login } from '../../../services/auth/api';

// Inside component
const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const response = await login({ username, password });
    // Handle successful login (store token, redirect, etc.)
  } catch (error) {
    // Handle error (display message, log, etc.)
  }
};
```

## URL Parameter Handling

For endpoints that require URL parameters (like account activation, password reset):

```javascript
// In AccountActivation.js
const { uidb64, token } = useParams();

useEffect(() => {
  const activate = async () => {
    try {
      await activateAccount(uidb64, token);
      // Handle success (show confirmation, redirect)
    } catch (error) {
      // Handle error (show error message)
    }
  };
  
  activate();
}, [uidb64, token]);
```

## Authentication Token Handling

Authentication tokens are stored in localStorage after login and automatically included in all subsequent requests:

```javascript
// In apiConfig.js
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Token ${token}`;
    }
    return config;
  }
);
```

## Authentication Flow

Here's the precise flow when a user interacts with authentication features:

### Login Flow
1. User clicks the "Login" button in the UI
2. This triggers the `handleSubmit` function in the Login component
3. The `handleSubmit` function calls the `login()` function imported from auth/api.js
4. The `login()` function makes an axios POST request to `/accounts/login/`
5. This request is sent to the backend server at the configured base URL
6. The backend processes the request and sends back a response with token
7. The frontend stores the token and redirects the user to the dashboard

### Other Authentication Flows
The same pattern applies to all other authentication actions:

- Register: User submits form → `register()` → `/accounts/register/`
- Password reset request: User enters email → `requestPasswordReset()` → `/accounts/password-reset/`
- Password reset confirmation: User sets new password → `resetPassword()` → `/accounts/reset-password/${uidb64}/${token}/`
- Google login: User clicks Google button → `loginWithGoogle()` → `/accounts/google/`
- Logout: User clicks logout → `logout()` → `/accounts/logout/`

## Architecture Benefits

This separation of concerns provides several benefits:

- **UI components** handle user interaction and presentation
- **API service functions** handle HTTP requests and response processing
- **Backend endpoints** handle business logic and data persistence
- **Centralized configuration** ensures consistent API usage across the application
- **Token interceptor** automatically handles authentication for all requests

The architecture ensures that all API calls are centralized, properly authenticated, and consistently formatted across the application.