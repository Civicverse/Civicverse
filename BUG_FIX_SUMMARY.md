# UI Bug Fix: Flash and Disappear on Startup

## Problem
The UI was loading briefly on startup but then disappearing, preventing users from seeing the application.

## Root Cause Analysis
Two competing authentication restoration systems were causing a race condition:

1. **App.tsx** had a `useEffect` that restored auth state from localStorage
2. **AuthContext.tsx** had a separate `useEffect` that also attempted to restore auth
3. The root route checked `isAuthenticated` at component definition time instead of render time, causing premature redirects
4. Loading state wasn't properly initialized, so the router was redirecting before auth restoration completed

## Changes Made

### 1. Fixed App.tsx
- **Moved BrowserRouter inside AuthProvider** - Ensures proper component nesting order
- **Created RootRedirect component** - Checks auth state at render time instead of definition time
- **Added loading state check** - Returns null while loading to prevent premature redirects
- **Initialize loading: true** - Blocks routing until auth restoration completes

### 2. Simplified AuthContext.tsx
- **Removed duplicate auth restoration** - Relies on App.tsx for the single source of truth
- **Kept context provider** - Still provides isAuthenticated, user, and loading to consumers

### 3. Updated gameStore.ts
- **Initialize loading: true** - Default state blocks routing during app startup
- **Set loading: false** - After auth restoration succeeds or times out

## How It Works Now

1. **App mounts** → loading = true (blocks rendering)
2. **useEffect runs** → checks localStorage for civicId
3. **If civicId found** → restores user session, sets loading = false
4. **If no civicId** → sets loading = false after short delay
5. **RootRedirect checks loading** → if true, returns null (no flash)
6. **Once loading = false** → routes to /dashboard (authenticated) or /login (not authenticated)

## Result
✅ No more flash/disappear on startup
✅ Proper session restoration
✅ Clean UI rendering
✅ Single source of truth for auth state

## Testing
- Run: `npm run dev`
- Without login: Should go to /login page smoothly
- After login: Should restore session and go to /dashboard on refresh
