# Authentication & Role Audit

## Current Authentication System
- **Registration/Login Flow:** Traditional email/password authentication using Express/Mongoose and JWT.
- **Password Hashing:** `bcryptjs` is implemented in the `User` model (`matchPassword` method).
- **Token Generation:** `jsonwebtoken` is used. Token is returned in the API response payload.
- **Token Storage:** Frontend currently stores the token in `localStorage`.
- **Protected Routes:** Currently, NO routes on the frontend or backend are actually protected. The token is generated and stored but never verified or used in subsequent requests.
- **Logout:** Frontend manually clears `localStorage`.
- **Refresh Token:** Missing.

## Role Checking
- **Current Status:** Missing. The `User` model currently lacks a `role` field.
- **Admin Authentication:** Missing entirely.
- **Expert Authentication:** Missing entirely (experts exist in the DB but cannot log in).

## Future Proofing
The current system cannot safely support USER, EXPERT, and ADMIN. To support this:
1. The `User` model needs a `role` field (Enum: 'user', 'expert', 'admin') OR separate models with linked Auth profiles.
2. A robust authentication middleware (`protect`, `authorize`) must be implemented on the backend to verify the JWT and check roles.
3. The frontend needs protected route wrappers for each role.
