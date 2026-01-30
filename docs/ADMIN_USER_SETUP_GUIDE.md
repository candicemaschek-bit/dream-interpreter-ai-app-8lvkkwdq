# Admin User Setup Guide

## Issue Resolution

### Problem
When setting a user's role to "Admin" (with capital A) in the database, the Admin Panel was not appearing after login because the role checking code was performing case-sensitive comparison with lowercase "admin".

### Solution
Updated `src/utils/roleChecking.ts` to perform **case-insensitive** role comparisons. This ensures that any variation ("admin", "Admin", "ADMIN") will be recognized correctly.

## How to Set Up an Admin User

### Method 1: Direct Database Update (Recommended)

1. **Access the Database Panel** in your Blink project
2. **Find the user** in the `users` table by email:
   ```sql
   SELECT * FROM users WHERE email = 'admin.test@dreamcatcher.local';
   ```

3. **Update the role** to 'admin' (lowercase is convention, but uppercase also works now):
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'admin.test@dreamcatcher.local';
   ```

4. **Verify the update**:
   ```sql
   SELECT id, email, role FROM users WHERE email = 'admin.test@dreamcatcher.local';
   ```

5. **Log out and log back in** to refresh the authentication state

### Method 2: Using Edge Function (Programmatic)

Use the `create-admin` edge function (if deployed):

```bash
curl -X POST https://your-project.functions.blink.new/create-admin \
  -H "Content-Type: application/json" \
  -d '{"email": "admin.test@dreamcatcher.local"}'
```

## Verification Steps

After setting the admin role, verify the setup:

### 1. Check Database
```sql
SELECT id, email, role, created_at 
FROM users 
WHERE role LIKE '%admin%';
```

### 2. Log In and Check UI
1. Navigate to the application
2. Sign in with the admin user credentials
3. Look for the **"Admin Panel"** button in the header navigation
4. The button should have a shield icon and be styled with purple accents

### 3. Access Admin Routes
After logging in as admin, you should be able to access:
- `/admin` - Admin Dashboard
- `/admin/users` - User Management
- `/admin/features` - Feature Requests
- `/admin/tasks` - Task Management
- `/admin/analytics` - Analytics Dashboard
- `/admin/revenue` - Revenue Analytics
- `/admin/video-queue` - Video Queue Monitor

## Role Checking Logic

The application checks admin status in multiple places:

### 1. App.tsx Navigation
Shows the "Admin Panel" button only for admin users:
```typescript
{userIsAdmin && (
  <Button variant="outline" onClick={() => navigate('/admin')}>
    <Shield className="w-4 h-4 mr-2" />
    Admin Panel
  </Button>
)}
```

### 2. AdminRoute Component
Protects admin routes from unauthorized access:
- Checks user role on route access
- Redirects non-admin users to home page
- Shows loading state during verification

### 3. useAdminAuth Hook
Provides reactive admin status checking:
```typescript
const { isAdmin, loading, error, userId } = useAdminAuth()
```

## Troubleshooting

### Admin Panel Button Not Showing

**Check 1: Role in Database**
```sql
SELECT email, role FROM users WHERE email = 'your-email@domain.com';
```
- Ensure `role` column is set to 'admin' (any case)
- If NULL or empty, update it

**Check 2: Browser Console**
Open developer tools and check for errors:
- Look for "Error checking admin status" messages
- Verify user ID is being retrieved correctly

**Check 3: Authentication State**
Ensure you're fully logged in:
1. Log out completely
2. Clear browser cache/cookies
3. Log back in

**Check 4: Code Deployment**
Ensure the latest code with case-insensitive checking is deployed:
- Verify `roleChecking.ts` has `.toLowerCase()` comparisons
- Check deployment timestamp

### "Access Denied" on Admin Routes

**Possible Causes:**
1. Role not set in database
2. Token not refreshed after role update (log out/in)
3. Network error preventing role check
4. Database query failing

**Debug Steps:**
1. Check browser console for errors
2. Verify database connection is working
3. Test with a fresh incognito window
4. Check network tab for failed API calls

## Code Changes Summary

### Updated Files
- `src/utils/roleChecking.ts` - Made role comparisons case-insensitive

### Key Changes
```typescript
// Before (case-sensitive)
return user.role === 'admin'

// After (case-insensitive)
return user.role?.toLowerCase() === 'admin'
```

This ensures that:
- 'admin' ✅
- 'Admin' ✅
- 'ADMIN' ✅

All work correctly!

## Best Practices

1. **Use lowercase 'admin'** in database for consistency
2. **Log out and back in** after role changes
3. **Test in incognito mode** to verify without cache issues
4. **Check browser console** for helpful debugging messages
5. **Verify database changes** before testing the UI

## Security Notes

- Admin routes are protected by `AdminRoute` component
- Role checks happen on both client and server side
- Non-admin users are automatically redirected
- Admin status is verified on every route access
- Role information is fetched from database, not JWT claims

## Next Steps

After setting up your admin user:

1. ✅ Access the Admin Panel
2. ✅ Review Analytics Dashboard
3. ✅ Manage User Accounts
4. ✅ Monitor Video Generation Queue
5. ✅ Review Feature Requests
6. ✅ Manage Admin Tasks

For questions or issues, check the browser console for detailed error messages.
