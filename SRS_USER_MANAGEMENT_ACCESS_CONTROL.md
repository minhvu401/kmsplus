# Software Requirement Specification (SRS)
## KMSPlus System - User Management & Access Control Feature

---

# 3. FEATURE SPECIFICATION

## 3.1 Feature Overview: User Management & Access Control

The User Management & Access Control feature enables administrators and authorized personnel to manage user accounts, assign roles and permissions, and allow users to maintain their profile information and security settings.

---

## 3.2 User Management & Access Control

### 3.2.1 Create User by Admin

#### Function Trigger
- **Navigation Path:** Dashboard → User Management → Create Account Tab → Click "Create User" button
- **Screen:** User Management Page > Create Account Tab
- **User Action:** Admin clicks "Tạo tài khoản" (Create Account) button after filling in the form
- **Timing:** On-demand, triggered when admin submits the form

#### Function Description

**Actors/Roles:**
- Admin (primary actor who can perform this function)
- System (validates and processes the request)

**Purpose:**
- Allow administrators to create new user accounts in the system
- Assign initial role to the newly created user
- Set up user credentials (email and password)

**Interface:**
- Form-based UI component: `CreateUserForm` component
- Located in: `/src/app/(main)/user-management/page-content.tsx`
- Form Fields:
  - Email Address (input box with email validation)
  - Password (password input box)
  - Full Name (text input)
  - Role (dropdown with available roles: Employee, Contributor, Training Manager, Admin, Dashboard Viewer)
- Submit Button: "Tạo tài khoản" (Create Account)

**Data Processing Flow:**
1. Admin fills in form fields (email, password, fullName, roleId)
2. Form validates input on client-side
3. FormData is created and passed to server action: `createUserByAdminAction()`
4. Server performs permission check (MANAGE_USERS permission required)
5. Data validation on server-side
6. Check if user already exists in database
7. Hash password using bcryptjs (bcrypt.hash with salt 10)
8. Insert new user into `users` table
9. Assign role to user in `user_roles` table
10. Return success/error response with user details

#### Function Details

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-01, VR-02, VR-03, VR-04)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-07)

**Normal Case Flow:**
1. Admin enters valid email, password, full name, and selects role
2. Form validates all fields
3. Server receives request and verifies admin permission
4. Server validates email uniqueness
5. Password is hashed
6. User record created in database with created_at timestamp
7. User role assigned
8. Success message displayed: "User {email} created successfully with role assigned"
9. Form is cleared for next entry
10. User list is refreshed (if on manage tab)

**Abnormal Case Flow:**
- **Case 1: Email already exists**
  - Error message: "User with this email already exists"
  - Prevent creation
  - User must use different email

- **Case 2: Invalid email format**
  - Error message: "Vui lòng nhập email hợp lệ"
  - Highlight email field in red
  - Prevent submission

- **Case 3: Password too short**
  - Error message: "Mật khẩu phải có ít nhất 6 ký tự"
  - Highlight password field in red
  - Prevent submission

- **Case 4: Missing required fields**
  - Individual error messages for each empty field
  - Prevent submission until all fields filled

- **Case 5: User lacks permission**
  - Error message: "Unauthorized: You do not have permission to create users"
  - Prevent creation
  - Redirect user (optional)

- **Case 6: Database error/connection failure**
  - Error message: "Failed to create user"
  - Log error for debugging
  - Inform admin to retry

**Data Stored:**
| Field | Type | Stored Value |
|-------|------|--------------|
| users.id | UUID | Auto-generated |
| users.email | VARCHAR(255) | Input email |
| users.password_hash | VARCHAR(255) | Hashed password |
| users.full_name | VARCHAR(255) | Input full name |
| users.created_at | TIMESTAMP | NOW() (current time) |
| user_roles.user_id | UUID | users.id |
| user_roles.role_id | INTEGER | Selected role ID |

---

### 3.2.2 Get All Users for Management

#### Function Trigger
- **Navigation Path:** Dashboard → User Management → Manage Users Tab
- **Screen:** User Management Page > Manage Users Tab
- **User Action:** User navigates to Manage Users tab or clicks "Làm mới" (Refresh) button
- **Timing:** Automatic on tab load, manual on refresh button click

#### Function Description

**Actors/Roles:**
- Admin or authorized user with MANAGE_USERS permission (primary actor)
- System (retrieves and displays data)

**Purpose:**
- Display list of all active users in the system
- Enable admin to view user details for management
- Support user search and filtering
- Fetch user role information

**Interface:**
- Table-based UI component: `UserListTable` component
- Located in: `/src/app/(main)/user-management/page-content.tsx`
- Display columns:
  - Email
  - Full Name
  - Role
  - Avatar (thumbnail)
  - Created Date
  - Status (Active/Inactive)
  - Actions (Edit, Deactivate, etc.)
- Includes Refresh button with loading indicator

**Data Processing Flow:**
1. User navigates to Manage Users tab or clicks Refresh
2. `getAllUsersForManagementAction()` is called
3. Server verifies user has MANAGE_USERS permission
4. Query database for all users excluding soft-deleted users
5. Join with user_roles and roles tables to get role information
6. Return user list with pagination/sorting
7. Display results in table format
8. Allow user to interact with individual records

#### Function Details

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-05, VR-06)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-08, BR-09, BR-10, BR-11, BR-12)

**SQL Query:**
```sql
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.avatar_url,
  u.created_at,
  u.is_active,
  r.name as role_name,
  ur.role_id
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.is_deleted = false OR u.is_deleted IS NULL
ORDER BY u.created_at DESC
```

**Normal Case Flow:**
1. Admin with valid permissions navigates to Manage Users tab
2. System verifies permission (MANAGE_USERS)
3. Database query executes successfully
4. User list populated with all active users
5. Each user row shows: email, name, role, avatar, created date, status
6. Admin can see action buttons for each user (edit, deactivate, etc.)
7. Success message: "Users retrieved successfully"

**Abnormal Case Flow:**
- **Case 1: User lacks permission**
  - Error message: "Unauthorized: You do not have permission to view users"
  - Empty list displayed
  - Redirect to dashboard

- **Case 2: Database connection error**
  - Error message: "Failed to fetch users"
  - Display alert with error notification
  - Show retry button

- **Case 3: No users exist**
  - Display empty table
  - Show message: "No users found"
  - Suggest admin to create first user

- **Case 4: Permission revoked during session**
  - Error when accessing refresh button
  - Error message shown
  - User redirected to dashboard

**Data Returned:**
```typescript
{
  success: boolean,
  message: string,
  data: [
    {
      id: string,
      email: string,
      full_name: string,
      avatar_url?: string,
      created_at: Date,
      is_active: boolean,
      role_name?: string,
      role_id?: string
    }
  ]
}
```

---

### 3.2.3 Update User Role

#### Function Trigger
- **Navigation Path:** Dashboard → User Management → Manage Users Tab → Click user row → Select role dropdown → Click Save
- **Screen:** User Management Page > Manage Users Tab > User Edit Modal
- **User Action:** Admin selects a user from the list, changes role dropdown, and confirms update
- **Timing:** On-demand, triggered when admin submits role change

#### Function Description

**Actors/Roles:**
- Admin or authorized user with MANAGE_USERS permission (primary actor)
- System (updates role assignment)
- Target User (user whose role is being changed)

**Purpose:**
- Change the role assignment of an existing user
- Update permissions indirectly by changing user's role
- Support role changes without recreating user account

**Interface:**
- Modal/Dialog component triggered from user list table
- Located in: `/src/components/forms/user-list-table.tsx`
- UI Elements:
  - User selection (via table row click)
  - Role dropdown selector
  - Confirm button
  - Cancel button
- Shows current role and allows selection of new role

**Data Processing Flow:**
1. Admin clicks on user in the table
2. Edit modal opens with user details
3. Admin selects new role from dropdown
4. Admin clicks "Lưu" (Save) button
5. `updateUserRoleAction()` is called with userId and roleId
6. Server verifies MANAGE_USERS permission
7. Check if user exists in database
8. Check if user_roles record exists
9. Update or insert role assignment
10. Return success/failure response
11. Refresh user list view

#### Function Details

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-07, VR-08, VR-09)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-13, BR-14, BR-15, BR-16, BR-17, BR-18)

**Database Operations:**
1. Check user exists:
   ```sql
   SELECT id FROM users WHERE id = ${userId}
   ```

2. Check if role exists for user:
   ```sql
   SELECT user_id FROM user_roles WHERE user_id = ${userId}
   ```

3. Update if exists:
   ```sql
   UPDATE user_roles SET role_id = ${roleId} WHERE user_id = ${userId}
   ```

4. Insert if not exists:
   ```sql
   INSERT INTO user_roles (user_id, role_id) VALUES (${userId}, ${roleId})
   ```

**Normal Case Flow:**
1. Admin with MANAGE_USERS permission opens edit modal for user
2. Admin selects different role from dropdown
3. Admin clicks Save
4. Server verifies permission
5. Server confirms user exists
6. Role is updated/inserted in database
7. Success message: "User role updated successfully"
8. User list refreshes showing new role
9. User's permissions update immediately

**Abnormal Case Flow:**
- **Case 1: User not found**
  - Error message: "User not found"
  - Modal closes
  - User list remains unchanged
  - Example: User was deleted by another admin

- **Case 2: Invalid role ID**
  - Error message: "Invalid role selected"
  - Prevent update
  - Keep dropdown open for correction

- **Case 3: Permission denied**
  - Error message: "Unauthorized: You do not have permission to update users"
  - Close modal
  - Redirect or show error notification

- **Case 4: Database error**
  - Error message: "Failed to update user role"
  - Modal remains open
  - Show retry button

- **Case 5: Concurrent update**
  - If another admin changes role simultaneously
  - Latest update wins
  - Show message: "Role was recently updated"

**Data Payload:**
```typescript
FormData:
  userId: string,       // User's unique ID
  roleId: string        // New role ID to assign
```

---

### 3.2.4 Update User Information

#### Function Trigger
- **Navigation Path:** Dashboard → User Management → Manage Users Tab → Click user row → Edit fields → Save
- **Screen:** User Management Page > Manage Users Tab > User Edit Modal
- **User Action:** Admin clicks on user, edits email/name, clicks Save button
- **Timing:** On-demand, triggered when admin submits information changes

#### Function Description

**Actors/Roles:**
- Admin or authorized user with MANAGE_USERS permission (primary actor)
- System (updates user data)
- Target User (user whose information is being updated)

**Purpose:**
- Allow admins to correct or update user information
- Update email address if needed
- Update full name
- Maintain accurate user records

**Interface:**
- Modal/Dialog component from user list table
- Located in: `/src/components/forms/user-list-table.tsx`
- Editable Fields:
  - Full Name (text input)
  - Email Address (email input)
- Action Buttons:
  - Save (Lưu)
  - Cancel (Huỷ)

**Data Processing Flow:**
1. Admin opens user edit modal
2. Admin modifies email and/or full name
3. Admin clicks Save button
4. `updateUserInfoAction()` is called with userId, email, fullName
5. Server verifies MANAGE_USERS permission
6. Validate input fields
7. Check if new email already exists (if email changed)
8. Update user record in database
9. Return success/failure response
10. Refresh user list display

#### Function Details

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-10, VR-11, VR-12, VR-13)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-19, BR-20, BR-21, BR-22, BR-23, BR-24)

**Database Operations:**
1. Check if user exists:
   ```sql
   SELECT id FROM users WHERE id = ${userId}
   ```

2. Check if new email already used (if email changed):
   ```sql
   SELECT id FROM users WHERE email = ${newEmail} AND id != ${userId}
   ```

3. Update user information:
   ```sql
   UPDATE users SET full_name = ${fullName}, email = ${email} WHERE id = ${userId}
   ```

**Normal Case Flow:**
1. Admin with MANAGE_USERS permission opens user edit modal
2. Admin updates email field (e.g., "john@company.com" → "john.doe@company.com")
3. Admin updates full name (e.g., "John" → "John Doe")
4. Admin clicks Save
5. Server verifies permission
6. Server validates both fields
7. Server checks email uniqueness
8. Database updated with new values
9. Success message: "User information updated successfully"
10. User list refreshes with updated information
11. Modal closes

**Abnormal Case Flow:**
- **Case 1: Email already exists**
  - Error message: "Email already exists"
  - Prevent update
  - Keep modal open for correction
  - Highlight email field

- **Case 2: Invalid email format**
  - Error message: "Please enter a valid email address"
  - Prevent update
  - Keep modal open

- **Case 3: User not found**
  - Error message: "User not found"
  - Close modal
  - May indicate concurrent deletion
  - Refresh user list

- **Case 4: Permission denied**
  - Error message: "Unauthorized: You do not have permission to update users"
  - Close modal
  - No changes made

- **Case 5: No changes made**
  - User might click Save without editing
  - System can show message: "No changes to update"
  - Or proceed with no-op update

- **Case 6: Database error**
  - Error message: "Failed to update user"
  - Modal remains open
  - Show retry option

**Data Payload:**
```typescript
FormData:
  userId: string,       // User's unique ID
  fullName: string,     // Updated full name
  email: string         // Updated email address
```

---

### 3.2.5 Ban/Deactivate User

#### Function Trigger
- **Navigation Path:** Dashboard → User Management → Manage Users Tab → Click user row → Click Deactivate/Activate button
- **Screen:** User Management Page > Manage Users Tab > User Edit Modal / Table Row Actions
- **User Action:** Admin clicks "Vô hiệu hóa" (Deactivate) or "Kích hoạt" (Activate) button
- **Timing:** On-demand, triggered by admin action

#### Function Description

**Actors/Roles:**
- Admin or authorized user with MANAGE_USERS permission (primary actor)
- System (updates user status)
- Target User (user being deactivated/activated)

**Purpose:**
- Temporarily disable/enable user account without deleting
- Prevent deactivated user from logging in
- Allow reactivation without recreating account
- Support account suspension scenarios

**Interface:**
- Button in user list table actions column
- Located in: `/src/components/forms/user-list-table.tsx`
- UI Elements:
  - Action button showing current status
  - Popconfirm dialog asking for confirmation
  - Label changes based on current status:
    - If active: "Vô hiệu hóa" (Deactivate)
    - If inactive: "Kích hoạt" (Activate)
  - Confirmation message shown before action

**Data Processing Flow:**
1. Admin clicks Deactivate/Activate button on user row
2. Confirmation dialog appears
3. Admin confirms action
4. `banUserAction()` is called with userId and currentStatus
5. Server verifies MANAGE_USERS permission
6. Check if user exists
7. Toggle user's active status (active → inactive or vice versa)
8. Update database record
9. Return success message with new status
10. Update table display reflecting new status

#### Function Details

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-14, VR-15, VR-16)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-25, BR-26, BR-27, BR-28, BR-29, BR-30, BR-31, BR-32)

**Database Operations:**
1. Check user exists:
   ```sql
   SELECT id, is_active FROM users WHERE id = ${userId}
   ```

2. Toggle status:
   ```sql
   UPDATE users 
   SET is_active = ${newStatus}
   WHERE id = ${userId}
   ```

**Status Logic:**
```
currentStatus = "active"  →  newStatus = "inactive"
currentStatus = "inactive"  →  newStatus = "active"
```

**Normal Case Flow - Deactivate:**
1. Admin with permission clicks Deactivate button on active user
2. Confirmation dialog appears: "Confirm deactivation?"
3. Admin confirms
4. Server verifies permission
5. Server verifies user exists and is active
6. is_active status changes to "inactive"
7. Success message: "User deactivated successfully"
8. Button changes to "Kích hoạt" (Activate)
9. User row shows status as "Inactive"
10. User cannot log in next time they try

**Normal Case Flow - Activate:**
1. Admin clicks Activate button on inactive user
2. Confirmation dialog: "Confirm activation?"
3. Admin confirms
4. Server verifies permission
5. Server verifies user exists and is inactive
6. is_active status changes to "active"
7. Success message: "User activated successfully"
8. Button changes to "Vô hiệu hóa" (Deactivate)
9. User row shows status as "Active"
10. User can now log in again

**Abnormal Case Flow:**
- **Case 1: User not found**
  - Error message: "User not found"
  - May indicate concurrent deletion
  - Refresh user list

- **Case 2: Permission denied**
  - Error message: "Unauthorized: You do not have permission to deactivate users"
  - No action taken
  - Show error notification

- **Case 3: Invalid status value**
  - Error message: "Invalid status"
  - Status value not recognized
  - Refresh user list

- **Case 4: Database error**
  - Error message: "Failed to deactivate/activate user"
  - Show retry option

- **Case 5: Concurrent status change**
  - If another admin changes status simultaneously
  - Latest update is applied
  - Show refresh message

**Data Payload:**
```typescript
FormData:
  userId: string,           // User's unique ID
  currentStatus: string     // Current status ("active" or "inactive")
```

---

### 3.2.6 Get Current User Profile

#### Function Trigger
- **Navigation Path:** Dashboard → My Profile (menu icon) or Profile Page
- **Screen:** Profile Page → Summary/Overview Tab
- **User Action:** User clicks profile menu or navigates to profile page
- **Timing:** Automatic on page load, or on-demand

#### Function Description

**Actors/Roles:**
- Current logged-in user (primary actor - any authenticated user)
- System (retrieves user profile data)

**Purpose:**
- Display current logged-in user's profile information
- Show user's basic details (email, name, avatar, etc.)
- Enable user to view their own information
- Base data for profile editing

**Interface:**
- Profile summary card component
- Located in: `/src/app/(main)/profile/components/ProfilePageContent.tsx`
- Display Elements:
  - Avatar image
  - Full name
  - Email address
  - Role
  - Department (if applicable)
  - Account creation date
  - Edit button
- Tabs:
  - Summary (profile information)
  - Activity (login history, etc.)

**Data Processing Flow:**
1. User navigates to profile page or clicks profile menu
2. `getProfileAction()` is called
3. Server checks authentication (requireAuth)
4. Retrieve JWT token from cookies
5. Verify token and extract user ID
6. Query database for user profile data
7. Retrieve avatar, name, email, created date
8. Return user profile object
9. Display in UI

#### Function Details

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-17, VR-18)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-33, BR-34, BR-35, BR-36, BR-37)

**Database Query:**
```sql
SELECT 
  id, 
  email, 
  full_name, 
  avatar_url, 
  created_at 
FROM users 
WHERE id = ${userId} 
  AND (is_deleted = false OR is_deleted IS NULL)
```

**Normal Case Flow:**
1. Authenticated user navigates to Profile page
2. System verifies JWT token is valid
3. System retrieves user ID from token
4. Database query fetches user record
5. Profile data returned successfully:
   - Email: "john.doe@company.com"
   - Full Name: "John Doe"
   - Avatar: "/uploads/avatars/john.jpg"
   - Created At: "2024-01-15"
   - Role: "Employee"
6. Profile card displays with edit button
7. User can view their information

**Abnormal Case Flow:**
- **Case 1: User not authenticated**
  - Error message: "User not authenticated"
  - Redirect to login page
  - Session expired

- **Case 2: User not found in database**
  - Error message: "User not found"
  - May indicate user was deleted
  - Clear session and redirect to login

- **Case 3: Invalid or expired token**
  - Error message: "Failed to fetch profile"
  - Redirect to login
  - Clear auth cookies

- **Case 4: Database connection error**
  - Error message: "Failed to fetch profile"
  - Show retry button
  - Display cached data if available

**Data Returned:**
```typescript
{
  success: boolean,
  message: string,
  data?: {
    id: string,
    email: string,
    full_name: string,
    avatar_url?: string,
    created_at: Date
  }
}
```

---

### 3.2.7 Update User Profile

#### Function Trigger
- **Navigation Path:** Dashboard → My Profile → Click "Chỉnh sửa" (Edit) button
- **Screen:** Profile Page → Edit Mode / Profile Form
- **User Action:** User clicks Edit button and modifies profile fields
- **Timing:** On-demand, when user submits profile form

#### Function Description

**Actors/Roles:**
- Current logged-in user (primary actor - self-service)
- System (updates profile data)

**Purpose:**
- Allow users to update their own profile information
- Update full name
- Update avatar/profile picture
- Maintain account accuracy

**Interface:**
- Form component: `ProfileForm` component
- Located in: `/src/components/forms/profile-form.tsx`
- Editable Fields:
  - Full Name (text input)
  - Avatar (file upload or URL input)
- Action Buttons:
  - Save (Lưu)
  - Cancel (Huỷ)

**Data Processing Flow:**
1. User clicks Edit button on profile page
2. Profile form appears with current data
3. User modifies full_name and/or avatar_url
4. User clicks Save button
5. `updateProfileAction()` is called with FormData
6. Server checks authentication (requireAuth)
7. Extract full_name and avatar_url from FormData
8. Validate input fields
9. Call service function: updateUserProfileAction()
10. Update user record in database
11. Update Zustand store with new profile data
12. Return to view mode with updated info

#### Function Details

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-19, VR-20, VR-21)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-38, BR-39, BR-40, BR-41, BR-42, BR-43)

**Database Update:**
```sql
UPDATE users 
SET full_name = ${full_name}, avatar_url = ${avatar_url}
WHERE id = ${userId}
```

**Normal Case Flow:**
1. Authenticated user on profile page clicks Edit
2. Profile form displayed with current data:
   - Full Name: "John Doe"
   - Avatar: [current image]
3. User changes full name: "John Doe" → "John D. Smith"
4. User uploads new avatar image (file)
5. File uploaded to Cloudinary and URL generated
6. User clicks Save
7. Server verifies authentication
8. Server validates new full name
9. Server validates avatar URL
10. Database updated with new values
11. Zustand store updated with new profile
12. Success message: "Profile updated successfully"
13. Form switches to view mode showing updated info

**Abnormal Case Flow:**
- **Case 1: No fields provided**
  - Error message: "Please provide at least one field to update"
  - Prevent submission
  - Form remains open

- **Case 2: Full name too long**
  - Error message: "Full name must be less than 255 characters"
  - Highlight name field
  - Prevent submission

- **Case 3: Invalid avatar URL**
  - Error message: "Invalid avatar URL"
  - Prevent submission

- **Case 4: Upload failed**
  - Error message: "File upload failed"
  - Show retry option

- **Case 5: User not authenticated**
  - Error message: "User not authenticated"
  - Redirect to login

- **Case 6: Database error**
  - Error message: "Failed to update profile"
  - Show retry button
  - Keep form open

**Data Payload:**
```typescript
FormData:
  full_name?: string,    // Updated full name
  avatar_url?: string    // Updated avatar URL
```

---

### 3.2.8 Update User Password

#### Function Trigger
- **Navigation Path:** Dashboard → My Profile → Click "Đổi mật khẩu" (Change Password) button
- **Screen:** Profile Page → Password Form Tab
- **User Action:** User fills in current password and new password fields
- **Timing:** On-demand, when user submits password form

#### Function Description

**Actors/Roles:**
- Current logged-in user (primary actor - self-service)
- System (verifies and updates password)

**Purpose:**
- Allow users to change their own password
- Enforce password security practices
- Maintain account security
- Validate current password before change

**Interface:**
- Form component: `PasswordForm` component
- Located in: `/src/components/forms/password-form.tsx`
- Form Fields:
  - Current Password (password input, required)
  - New Password (password input, required)
  - Confirm New Password (password input, required)
  - Password strength indicator (optional)
- Action Buttons:
  - Change Password (Đổi mật khẩu)
  - Cancel (Huỷ)

**Data Processing Flow:**
1. User navigates to password change section
2. User enters current password
3. User enters new password
4. User confirms new password
5. User clicks "Đổi mật khẩu" button
6. `updatePasswordAction()` is called
7. Server verifies authentication
8. Extract password fields from FormData
9. Validate form data
10. Call service function: updateUserPasswordAction()
11. Verify current password matches stored hash
12. Hash new password using bcryptjs
13. Update password_hash in database
14. Return success/failure response

#### Function Details

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-22, VR-23, VR-24, VR-25, VR-26)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-44, BR-45, BR-46, BR-47, BR-48, BR-49, BR-50)

**Database Operations:**
1. Get current user password hash:
   ```sql
   SELECT password_hash FROM users WHERE id = ${userId}
   ```

2. Verify current password:
   ```
   bcrypt.compare(currentPassword, storedHash) → true/false
   ```

3. Update password:
   ```sql
   UPDATE users 
   SET password_hash = ${hashedNewPassword}
   WHERE id = ${userId}
   ```

**Normal Case Flow:**
1. User on profile page clicks "Đổi mật khẩu"
2. Password form displayed
3. User enters:
   - Current Password: "oldPass123"
   - New Password: "newSecurePass2024"
   - Confirm Password: "newSecurePass2024"
4. User clicks "Đổi mật khẩu"
5. Server verifies user is authenticated
6. Server validates all fields are present
7. Server checks new passwords match
8. Server verifies current password against stored hash
9. New password hashed with bcryptjs
10. Database updated with new hash
11. Success message: "Password changed successfully"
12. Form clears and returns to profile view
13. User's session remains active

**Abnormal Case Flow:**
- **Case 1: Missing required fields**
  - Error message: "Please fill in all password fields"
  - Highlight empty fields in red
  - Prevent submission

- **Case 2: New passwords don't match**
  - Error message: "New passwords do not match"
  - Highlight confirm field
  - Keep form open

- **Case 3: Password too short**
  - Error message: "Password must be at least 6 characters"
  - Highlight new password field
  - Show character count

- **Case 4: Current password incorrect**
  - Error message: "Current password is incorrect"
  - Highlight current password field
  - Prevent submission (security)
  - Optional: Log failed attempt

- **Case 5: User not authenticated**
  - Error message: "User not authenticated"
  - Redirect to login

- **Case 6: Database error**
  - Error message: "Failed to update password"
  - Show retry button
  - Keep form open

**Data Payload:**
```typescript
FormData:
  currentPassword: string,    // User's current password
  newPassword: string,        // Desired new password
  confirmPassword: string     // Confirmation of new password
```

---

### 3.2.9 Get All Role Permissions

#### Function Trigger
- **Navigation Path:** Dashboard → Role & Permissions Management → Page loads
- **Screen:** Role Permissions Management Page
- **User Action:** Navigate to role permissions page or click Refresh button
- **Timing:** Automatic on page load, manual on refresh

#### Function Description

**Actors/Roles:**
- Admin with role management permissions (primary actor)
- System (retrieves permission mappings)

**Purpose:**
- Display all roles and their assigned permissions
- Show permission matrix for role-based access control
- Enable permission management interface
- View current role-permission relationships

**Interface:**
- Table/matrix view component
- Located in: `/src/app/(main)/role-permissions/page.tsx`
- Display Format:
  - Rows: All system roles (Employee, Contributor, Training Manager, Admin, Dashboard Viewer)
  - Columns: Permission categories and individual permissions
  - Cells: Checkboxes indicating if role has permission
- Permission Groups Displayed:
  - Authentication (LOGIN, LOGOUT, VIEW_PROFILE)
  - Article Management (CREATE, READ, UPDATE, DELETE, etc.)
  - Question Management (VIEW, CREATE, UPDATE, etc.)
  - Course Management (CREATE, READ, ENROLL, etc.)
  - Quiz Management (CREATE, PARTICIPATE, VIEW_RESULT, etc.)
  - User Management (CREATE_ACCOUNT, MANAGE_USERS, etc.)
  - Category Management (CREATE, VIEW, UPDATE, DELETE)
  - System Administration (MONITOR_ACTIVITY, VIEW_STATISTICS, EXPORT_DATA)
  - System Settings (LANGUAGE_SETTING, EDIT_ROLE_PERMISSION, etc.)

**Data Processing Flow:**
1. Navigate to Role Permissions page
2. `getRolePermissionsAction()` is called
3. Server verifies user permission (VIEW_ROLE_PERMISSION)
4. Query database for all role-permission mappings
5. Group permissions by role
6. Return permission matrix
7. Display in table format with checkboxes

#### Function Details

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-27)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-51, BR-52, BR-53, BR-54, BR-55, BR-56)

**Database Query:**
```sql
SELECT 
  rp.role,
  rp.permission,
  r.name as role_name
FROM role_permissions rp
LEFT JOIN roles r ON rp.role = r.name
ORDER BY rp.role, rp.permission
```

**Data Transformation:**
```typescript
// Raw data
[
  { role: "Admin", permission: "LOGIN" },
  { role: "Admin", permission: "CREATE_ARTICLE" },
  ...
]

// Grouped by role
{
  "Admin": ["LOGIN", "CREATE_ARTICLE", ...],
  "Employee": ["LOGIN", "READ_ARTICLE", ...],
  ...
}
```

**Normal Case Flow:**
1. Admin with permission navigates to Role Permissions page
2. System verifies permission (VIEW_ROLE_PERMISSION)
3. Database fetches all role-permission records
4. Data grouped by role
5. Table displays:
   - All 5 roles in rows
   - All 50+ permissions in columns (grouped)
   - Checkmarks showing which role has which permission
6. Admin can see permission distribution across roles
7. Admin can identify role-permission gaps or overlaps

**Abnormal Case Flow:**
- **Case 1: User lacks permission**
  - Error message: "You do not have permission to view role permissions"
  - Empty page or redirect to dashboard
  - Hide role management menu

- **Case 2: Database error/connection failure**
  - Error message: "Failed to fetch role permissions"
  - Show retry button
  - Display cached data if available

- **Case 3: No permissions defined**
  - Display empty matrix
  - Show message: "No permissions configured"
  - Suggest admin to initialize permissions

**Data Returned:**
```typescript
{
  success: boolean,
  message: string,
  data?: {
    "Admin": ["LOGIN", "LOGOUT", ..., "MANAGE_USERS"],
    "Employee": ["LOGIN", "LOGOUT", ...],
    "Contributor": [...],
    ...
  }
}
```

---

### 3.2.10 Update Role Permissions

#### Function Trigger
- **Navigation Path:** Dashboard → Role & Permissions Management → Modify checkboxes → Click "Lưu" (Save) button
- **Screen:** Role Permissions Management Page
- **User Action:** Admin checks/unchecks permission checkboxes and clicks Save
- **Timing:** On-demand, when admin submits permission changes

#### Function Description

**Actors/Roles:**
- Admin with role/permission management access (primary actor)
- System (updates permission mappings)

**Purpose:**
- Allow admins to grant/revoke permissions for roles
- Configure role-based access control
- Control feature access by role
- Manage authorization policies

**Interface:**
- Permission matrix table with checkboxes
- Located in: `/src/app/(main)/role-permissions/page.tsx`
- Interactive Elements:
  - Checkboxes for each role-permission combination
  - Check = has permission, Uncheck = no permission
  - Save button at page bottom
  - Cancel button
  - Refresh button to reload
- Shows permission groups:
  - Authentication
  - Articles
  - Questions
  - Courses
  - Quizzes
  - Learning
  - User Management
  - Categories
  - System Administration
  - System Settings

**Data Processing Flow:**
1. Admin on Role Permissions page checks/unchecks permission boxes
2. Admin clicks "Lưu" (Save) button
3. `updateRolePermissionsAction()` is called with new permissions map
4. Server verifies EDIT_ROLE_PERMISSION permission
5. Validate role and permission values
6. Start database transaction
7. Delete all existing role_permissions records
8. Insert new role_permissions records based on updated selection
9. Commit transaction
10. Return success response
11. Display updated matrix

#### Function Details

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-28, VR-29, VR-30)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-57, BR-58, BR-59, BR-60, BR-61, BR-62, BR-63, BR-64)

**Database Operations:**
1. Start transaction:
   ```sql
   BEGIN TRANSACTION
   ```

2. Delete all existing mappings:
   ```sql
   DELETE FROM role_permissions
   ```

3. Insert new mappings:
   ```sql
   INSERT INTO role_permissions (role, permission, created_at, updated_at)
   VALUES ('Admin', 'LOGIN', NOW(), NOW()),
          ('Admin', 'CREATE_ARTICLE', NOW(), NOW()),
          ...
   ```

4. Commit transaction:
   ```sql
   COMMIT
   ```

**Data Structure for Update:**
```typescript
// Permissions map sent to server
{
  "Admin": [
    "LOGIN", "LOGOUT", "VIEW_PROFILE",
    "CREATE_ARTICLE", "READ_ARTICLE", ...
  ],
  "Employee": [
    "LOGIN", "LOGOUT", "VIEW_PROFILE",
    "READ_ARTICLE", ...
  ],
  "Contributor": [...],
  "Training Manager": [...],
  "Dashboard Viewer": [...]
}
```

**Normal Case Flow:**
1. Admin on Role Permissions page sees current matrix
2. Admin wants to give employees SEARCH_ARTICLE permission
3. Admin checks "SEARCH_ARTICLE" checkbox in Employee row
4. Admin wants to remove COMMENT_ARTICLE from Dashboard Viewer
5. Admin unchecks that permission
6. Admin clicks "Lưu" (Save)
7. Server verifies EDIT_ROLE_PERMISSION permission
8. Server validates all role and permission values
9. Transaction starts
10. All role_permissions deleted
11. New permissions inserted based on current checkbox state
12. Transaction committed
13. Success message: "Role permissions updated successfully"
14. Matrix reloads showing updated state
15. Changes effective immediately for new logins

**Abnormal Case Flow:**
- **Case 1: Permission denied**
  - Error message: "Unauthorized: Only admins can manage role permissions"
  - Changes not saved
  - Show error notification

- **Case 2: Invalid role**
  - Error message: "Invalid role"
  - Changes not saved
  - Refresh to reload correct data

- **Case 3: Invalid permission**
  - Error message: "Invalid permission"
  - Changes not saved
  - Highlight problematic permission

- **Case 4: Database transaction failed**
  - Error message: "Failed to update role permissions"
  - Rollback to previous state
  - Show retry option
  - Reload matrix from database

- **Case 5: Validation error during save**
  - Error message with specific validation issue
  - Keep form open for correction
  - Show which roles/permissions are invalid

- **Case 6: Removing critical permissions**
  - Optional warning: "Admin role will lose MANAGE_USERS permission. Continue?"
  - Allow admin to confirm intentional changes

**Response Data:**
```typescript
{
  success: boolean,
  message: string,
  data?: {
    "Admin": [...],
    "Employee": [...],
    ...
  }
}
```

---

### 3.2.11 Get Permissions by Role

#### Function Trigger
- **Navigation Path:** Backend API call (optional) - /api/role-permissions?role=Admin
- **Screen:** (Backend function, not directly user-triggered)
- **User Action:** System calls this function internally
- **Timing:** On-demand, used for permission verification

#### Function Description

**Actors/Roles:**
- System (primary actor - internal use)
- Authorization middleware/guards
- Backend processes verifying user permissions

**Purpose:**
- Retrieve specific role's permission list
- Used for permission verification in guards
- Support permission checking in authorization middleware
- Enable role-specific feature access control

**Interface:**
- Backend API endpoint (typically)
- Function call: `getRolePermissionsByRoleAction(role: Role)`
- Input: Role name
- Output: Array of permission strings

**Data Processing Flow:**
1. Authorization middleware needs to verify permissions
2. Calls getRolePermissionsByRoleAction(userRole)
3. Server queries database for role's permissions
4. Filter role_permissions where role = specified role
5. Return array of permission strings
6. Middleware uses permissions for access control

#### Function Details

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-31)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-65, BR-66, BR-67, BR-68, BR-69)

**Database Query:**
```sql
SELECT permission
FROM role_permissions
WHERE role = ${role}
ORDER BY permission
```

**Normal Case Flow:**
1. Authorization middleware intercepts request
2. Gets user's role from JWT token
3. Calls getRolePermissionsByRoleAction("Admin")
4. Database returns all Admin permissions
5. Middleware checks if required permission in list
6. Allows or denies request based on check
7. Response returned to user/frontend

**Abnormal Case Flow:**
- **Case 1: Invalid role provided**
  - Error message: "Invalid role"
  - Deny access (fail-safe)
  - Log error for debugging

- **Case 2: Role has no permissions**
  - Return empty array
  - User denied access to protected features
  - No error (valid state)

- **Case 3: Database error**
  - Error message: "Failed to fetch role permissions"
  - Deny access (fail-safe)
  - Try cache if available

**Data Returned:**
```typescript
{
  success: boolean,
  message: string,
  data?: string[]  // Array of permission strings
}

// Example:
{
  success: true,
  message: "Permissions for role Admin fetched successfully",
  data: ["LOGIN", "LOGOUT", "VIEW_PROFILE", "MANAGE_USERS", ...]
}
```

---

### 3.2.12 Update Permissions for Specific Role

#### Function Trigger
- **Navigation Path:** Backend API or internal system call
- **Screen:** (Backend function)
- **User Action:** Admin modifies permissions for one role (alternative to update all)
- **Timing:** On-demand, for targeted role permission changes

#### Function Description

**Actors/Roles:**
- Admin with EDIT_ROLE_PERMISSION permission (primary actor)
- System (updates permissions)

**Purpose:**
- Allow granular permission management per role
- Update permissions for single role without affecting others
- Alternative to bulk update of all roles
- Enable role-specific permission adjustments

**Interface:**
- Typically called via API endpoint
- Could be UI modal for single role editing
- Input: Role name and permission array
- Example URL: POST `/api/role-permissions/Admin`

**Data Processing Flow:**
1. Admin selects single role to edit
2. Admin modifies permissions for that role only
3. Calls updateRolePermissionsByRoleAction(role, permissions[])
4. Server verifies EDIT_ROLE_PERMISSION permission
5. Validate role and permissions
6. Start transaction
7. Delete existing role_permissions for specified role only
8. Insert new permissions for that role
9. Commit transaction
10. Return success response

#### Function Details

**Validation Rules:**
(See §3.5 - Validation Rules Matrix: VR-32, VR-33, VR-34)

**Business Rules:**
(See §3.6 - Business Rules Matrix: BR-70, BR-71, BR-72, BR-73, BR-74, BR-75)

**Database Operations:**
1. Start transaction:
   ```sql
   BEGIN TRANSACTION
   ```

2. Delete existing permissions for role:
   ```sql
   DELETE FROM role_permissions WHERE role = ${role}
   ```

3. Insert new permissions:
   ```sql
   INSERT INTO role_permissions (role, permission, created_at, updated_at)
   VALUES ('Admin', 'LOGIN', NOW(), NOW()),
          ('Admin', 'CREATE_ARTICLE', NOW(), NOW()),
          ...
   ```

4. Commit:
   ```sql
   COMMIT
   ```

**Normal Case Flow:**
1. Admin wants to add EXPORT_DATA permission to Training Manager role only
2. Calls updateRolePermissionsByRoleAction("Training Manager", [...permissions with EXPORT_DATA])
3. Server verifies EDIT_ROLE_PERMISSION permission
4. Server validates "Training Manager" is valid role
5. Server validates all permissions in array
6. Transaction starts
7. All existing Training Manager permissions deleted
8. New permission set inserted (including EXPORT_DATA)
9. Transaction committed
10. Success message: "Permissions for role Training Manager updated successfully"
11. Only Training Manager is affected
12. Admin and Employee roles unchanged

**Abnormal Case Flow:**
- **Case 1: Invalid role**
  - Error message: "Invalid role"
  - Changes not made
  - Specify valid role and retry

- **Case 2: Invalid permission in array**
  - Error message: "Invalid permission in array"
  - Changes not made
  - Check permission names against enum

- **Case 3: Permission denied**
  - Error message: "Unauthorized: Only admins can manage role permissions"
  - Changes not made

- **Case 4: Database error**
  - Error message: "Failed to update role permissions"
  - Rollback to previous state
  - Retry or reload

- **Case 5: Concurrent updates to same role**
  - Latest update wins
  - Previous changes overwritten
  - Show warning if available

**Data Payload:**
```typescript
{
  role: string,              // Role name (e.g., "Training Manager")
  permissions: Permission[]  // Array of permissions to assign
}

// Example:
{
  role: "Training Manager",
  permissions: [
    "LOGIN",
    "LOGOUT",
    "VIEW_PROFILE",
    "CREATE_COURSE",
    "MANAGE_USERS",
    ...
  ]
}
```

**Response:**
```typescript
{
  success: boolean,
  message: string,
  data?: {
    role: string,
    permissions: Permission[]
  }
}
```

---

## 3.3 Screen Functions Summary

### Screen 1: User Management Page
- **Location:** `/src/app/(main)/user-management/page.tsx`
- **Main Functions:**
  - Create User by Admin (3.2.1)
  - Get All Users for Management (3.2.2)
  - Update User Role (3.2.3)
  - Update User Information (3.2.4)
  - Ban/Deactivate User (3.2.5)
- **Actors:** Admin users
- **Tabs:** Create Account, Manage Users
- **Key Features:** User CRUD operations, role assignment, user status management

### Screen 2: Profile Page
- **Location:** `/src/app/(main)/profile/page.tsx`
- **Main Functions:**
  - Get Current User Profile (3.2.6)
  - Update User Profile (3.2.7)
  - Update User Password (3.2.8)
- **Actors:** All authenticated users
- **Tabs:** Summary, Activity, Settings
- **Key Features:** View/edit profile, password change, activity history

### Screen 3: Role Permissions Management Page
- **Location:** `/src/app/(main)/role-permissions/page.tsx`
- **Main Functions:**
  - Get All Role Permissions (3.2.9)
  - Update Role Permissions (3.2.10)
  - Get Permissions by Role (3.2.11)
  - Update Permissions for Specific Role (3.2.12)
- **Actors:** Administrators
- **Main Feature:** Permission matrix editor
- **Key Functionality:** Assign permissions to roles

### Screen 4: Settings Page
- **Location:** `/src/app/(main)/settings/page.tsx`
- **Main Functions:** Language settings
- **Actors:** All authenticated users
- **Key Features:** User preferences (language selection)

---

## 3.4 Data Models & Enums

### Available Roles
```typescript
enum Role {
  EMPLOYEE = "Employee",
  CONTRIBUTOR = "Contributor",
  TRAINING_MANAGER = "Training Manager",
  ADMIN = "Admin",
  DASHBOARD_VIEWER = "Dashboard Viewer",
}
```

### User Management Related Permissions
```typescript
// User Management (6 permissions)
CREATE_ACCOUNT = "CREATE_ACCOUNT"
VIEW_ACCOUNT_LIST = "VIEW_ACCOUNT_LIST"
UPDATE_ACCOUNT = "UPDATE_ACCOUNT"
DEACTIVATE_ACCOUNT = "DEACTIVATE_ACCOUNT"
SEARCH_ACCOUNT = "SEARCH_ACCOUNT"
MANAGE_USERS = "MANAGE_USERS"

// System Settings (6 permissions)
VIEW_ROLE_PERMISSION = "VIEW_ROLE_PERMISSION"
EDIT_ROLE_PERMISSION = "EDIT_ROLE_PERMISSION"
```

### Database Tables Involved
- **users:** Stores user account information
- **user_roles:** Maps users to roles (one-to-one)
- **roles:** Stores role definitions
- **role_permissions:** Maps roles to permissions (many-to-many)
- **permissions:** Stores permission definitions

---

## 3.5 Consolidated Validation Rules Matrix

| ID | Rule Definition |
|----|----|
| **VR-01** | Email Validation: Required field, must be valid email format (RFC 5322 standard), must be unique in system, Error: "Vui lòng nhập email hợp lệ" |
| **VR-02** | Password Validation: Required field, minimum 6 characters, will be hashed using bcryptjs algorithm, Error: "Mật khẩu phải có ít nhất 6 ký tự" |
| **VR-03** | Full Name Validation: Required field, cannot be empty or whitespace only, Error: "Vui lòng nhập họ tên" |
| **VR-04** | Role ID Validation: Required field, must be valid role ID from system (Employee=1, Contributor=2, Training Manager=3, Admin=4, Dashboard Viewer=5), Error: "Vui lòng chọn vai trò" |
| **VR-05** | Permission Check: User must have MANAGE_USERS permission, Error: "Unauthorized: You do not have permission to view users" |
| **VR-06** | User Status Filter: Only active (not soft-deleted) users displayed, Criteria: u.is_deleted = false OR u.is_deleted IS NULL |
| **VR-07** | Permission Check: User must have MANAGE_USERS permission, Error: "Unauthorized: You do not have permission to update users" |
| **VR-08** | User ID Validation: Required field, must be valid UUID format, must correspond to existing user, Error: "User not found" |
| **VR-09** | Role ID Validation: Required field, must be valid role ID from system, Error: "Invalid role selected" |
| **VR-10** | Permission Check: User must have MANAGE_USERS permission, Error: "Unauthorized: You do not have permission to update users" |
| **VR-11** | User ID Validation: Required field, must be valid UUID, Error: "User ID is required" |
| **VR-12** | Full Name Validation: If provided, must not be empty/whitespace only, maximum 255 characters, can contain letters, numbers, spaces, hyphens, accents |
| **VR-13** | Email Validation: If provided, must be valid email format, must not already exist in system, maximum 255 characters, Error: "Email already exists" |
| **VR-14** | Permission Check: User must have MANAGE_USERS permission or DEACTIVATE_ACCOUNT, Error: "Unauthorized: You do not have permission to deactivate users" |
| **VR-15** | User ID Validation: Required field, must be valid UUID, Error: "User ID is required" |
| **VR-16** | Current Status Validation: Must be either "active" or "inactive", case-insensitive for processing |
| **VR-17** | Authentication Check: User must be logged in (JWT token required), token must be valid and not expired, Error: "User not authenticated" or redirect to login |
| **VR-18** | User Existence Check: User ID from token must correspond to existing user, Error: "User not found" |
| **VR-19** | Authentication Check: User must be logged in, Error: "User not authenticated" |
| **VR-20** | Full Name Validation: If provided, must not be empty or whitespace only, maximum 255 characters, can contain letters, numbers, spaces, hyphens, accents, Error: "Full name is required or invalid" |
| **VR-21** | Avatar URL Validation: If provided, must be valid URL format, typically from Cloudinary or local upload, maximum 2048 characters |
| **VR-22** | Authentication Check: User must be logged in, Error: "User not authenticated" |
| **VR-23** | All Fields Required: currentPassword, newPassword, confirmPassword all required, Error: "Please fill in all password fields" |
| **VR-24** | New Password Validation: Minimum 6 characters, must not be empty, Error: "Password must be at least 6 characters" |
| **VR-25** | Password Confirmation: newPassword must equal confirmPassword, case-sensitive comparison, Error: "New passwords do not match" |
| **VR-26** | Current Password Verification: Must match stored password hash, verified using bcryptjs.compare(), Error: "Current password is incorrect" |
| **VR-27** | Permission Check: User must have VIEW_ROLE_PERMISSION permission (typically Admins), Error: "You do not have permission to view role permissions" |
| **VR-28** | Permission Check: User must have EDIT_ROLE_PERMISSION permission (Admins only), Error: "Unauthorized: Only admins can manage role permissions" |
| **VR-29** | Role Validation: Must be valid role name from enum (Employee, Contributor, Training Manager, Admin, Dashboard Viewer), Error: "Invalid role" |
| **VR-30** | Permission Validation: Must be valid permission name from enum, must be system-defined permission, Error: "Invalid permission" |
| **VR-31** | Role Validation: Must be valid Role enum value (Employee, Contributor, Training Manager, Admin, Dashboard Viewer), Error: "Invalid role" |
| **VR-32** | Permission Check: User must have EDIT_ROLE_PERMISSION permission (Admins only), Error: "Unauthorized: Only admins can manage role permissions" |
| **VR-33** | Role Validation: Must be valid Role enum value, Error: "Invalid role" |
| **VR-34** | Permissions Array Validation: All items must be valid Permission enum values, empty array allowed (role with no permissions), Error: "Invalid permission in array" |

---

## 3.6 Consolidated Business Rules Matrix

| ID | Rule Definition |
|----|----|
| **BR-01** | Only users with MANAGE_USERS permission can create users (typically Admins) |
| **BR-02** | Email must be unique across the system for each user account |
| **BR-03** | Password is hashed before storage using bcryptjs with salt factor 10 |
| **BR-04** | Newly created users are initialized with default status "active" |
| **BR-05** | Each user will be assigned exactly one role at a time |
| **BR-06** | Maximum email length is 255 characters (database constraint) |
| **BR-07** | Password hash is stored in database; original password is never persisted |
| **BR-08** | Users are sorted by creation date in descending order (newest first) |
| **BR-09** | Soft-deleted users are excluded from user list results |
| **BR-10** | User list includes joined role information via LEFT JOIN |
| **BR-11** | If user has no role assigned, role_name displays as NULL |
| **BR-12** | User list is typically paginated (page size configurable) |
| **BR-13** | Only one role per user at a time; if user has existing role, it is replaced |
| **BR-14** | If user has no role, new role is inserted; if exists, it is updated |
| **BR-15** | Role change is effective immediately for subsequent permission checks |
| **BR-16** | Role change triggers permission update (permissions change based on new role) |
| **BR-17** | Role update changes user's access level to all features immediately |
| **BR-18** | Limited admin roles can assign Admin role (optional business rule - configurable) |
| **BR-19** | At least one field must be updated for user information changes |
| **BR-20** | Email uniqueness is enforced during user information updates |
| **BR-21** | User information update is effective immediately |
| **BR-22** | Change timestamp should be recorded in updated_at field |
| **BR-23** | Admins cannot update their own information via admin function (use Profile page) |
| **BR-24** | All user information fields are optional (can update just email or just name) |
| **BR-25** | Deactivation/Activation is a toggle operation: active ↔ inactive |
| **BR-26** | Cannot deactivate the currently logged-in admin user (optional rule) |
| **BR-27** | Deactivated user cannot log in to the system |
| **BR-28** | User's data is preserved during deactivation (soft deactivation, not deletion) |
| **BR-29** | User can be reactivated anytime without loss of data |
| **BR-30** | Permissions for deactivated user are blocked at login attempt |
| **BR-31** | Deactivation is immediate, no grace period for access |
| **BR-32** | User's roles and permissions remain in database during deactivation |
| **BR-33** | Only authenticated users can access their own profile |
| **BR-34** | Users can only view their own profile information (not others') |
| **BR-35** | Profile data is cached in Zustand store (useUserStore) for performance |
| **BR-36** | Profile information is read-only in summary view tab |
| **BR-37** | JWT authorization token required for all profile requests |
| **BR-38** | Profile edit form allows both fields to be optional (update just one at a time) |
| **BR-39** | At least one field must be provided to update user profile |
| **BR-40** | Users can only update their own profile (not others') |
| **BR-41** | Avatar is typically uploaded to Cloudinary or local storage |
| **BR-42** | Profile updates are effective immediately upon save |
| **BR-43** | Previous avatar may be deleted from storage after upload (implementation dependent) |
| **BR-44** | User must verify current password before changing password (security best practice) |
| **BR-45** | New password is hashed using bcryptjs before database storage |
| **BR-46** | Password history is not tracked; new password can be similar to old password |
| **BR-47** | Password update is effective immediately (user not logged out) |
| **BR-48** | One password change is processed per request |
| **BR-49** | Minimum password length is 6 characters |
| **BR-50** | Maximum password hash length is 255 characters (database constraint) |
| **BR-51** | All system roles are displayed in role-permissions view |
| **BR-52** | All defined permissions including system permissions are included in view |
| **BR-53** | Permissions are grouped logically by module (Authentication, Articles, Questions, etc.) |
| **BR-54** | Role permissions are displayed in read-only mode by default |
| **BR-55** | Permission matrix shows current state of role-permission mappings |
| **BR-56** | System permissions cannot be hidden or filtered from view |
| **BR-57** | Role-Permission update is atomic operation (all or nothing) |
| **BR-58** | Both roles with no permissions and roles with all permissions are valid states |
| **BR-59** | Admin role typically retains most/all system permissions |
| **BR-60** | Employee role typically has limited permissions |
| **BR-61** | Permission changes take effect immediately for new logins |
| **BR-62** | Existing sessions continue with old permissions until user re-login |
| **BR-63** | All existing role-permission mappings are deleted and recreated per update |
| **BR-64** | Cannot remove LOGIN and LOGOUT permissions from any role |
| **BR-65** | Get Permissions function is used internally by authorization system |
| **BR-66** | Get Permissions is quick-access function for runtime permission checking |
| **BR-67** | Get Permissions is typically called during request processing |
| **BR-68** | Permission results may be cached for performance optimization |
| **BR-69** | Get Permissions should not be called directly from UI (use guards instead) |
| **BR-70** | Only specified role is modified in single role permission update |
| **BR-71** | Other roles' permissions remain unchanged during single role update |
| **BR-72** | Single role update only affects specified role (single role scope) |
| **BR-73** | Permissions are replaced entirely (all old permissions removed first) |
| **BR-74** | Single role permission changes effective immediately for new logins |
| **BR-75** | Database transaction ensures consistency during permission updates |

---

## 3.7 Business Rules Categorization

### Access Control & Permissions (BR-01, BR-09, BR-23, BR-30, BR-33, BR-34, BR-37, BR-59, BR-64, BR-69)
Core rules governing who can access what and when

### Data Integrity (BR-02, BR-06, BR-11, BR-19, BR-20, BR-39, BR-40, BR-43)
Rules ensuring data consistency and uniqueness

### User Status Management (BR-04, BR-24, BR-25, BR-26, BR-27, BR-28, BR-29, BR-31, BR-32)
Rules for managing user accounts and activation states

### Password Security (BR-03, BR-07, BR-44, BR-45, BR-46, BR-49, BR-50)
Rules ensuring strong password handling and security practices

### Role & Permission Management (BR-05, BR-13, BR-14, BR-15, BR-16, BR-17, BR-18, BR-51, BR-52, BR-53, BR-57, BR-58, BR-60, BR-61, BR-62, BR-63, BR-64, BR-73, BR-74)
Rules for role assignment and permission configuration

### Data Caching & Performance (BR-08, BR-35, BR-67, BR-68)
Rules for performance optimization and caching strategies

### Transaction & Consistency (BR-21, BR-22, BR-42, BR-48, BR-66, BR-70, BR-71, BR-72, BR-75)
Rules ensuring operation atomicity and consistency

### System Integration (BR-12, BR-38, BR-41, BR-47, BR-54, BR-55, BR-65)
Rules for system components and integration points

---

## End of SRS - User Management & Access Control Feature

**Document Version:** 1.0  
**Last Updated:** March 4, 2026  
**Prepared By:** System Architecture Team  
**Status:** Complete
