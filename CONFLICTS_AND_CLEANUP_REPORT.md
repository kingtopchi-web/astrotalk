# Conflicts & Cleanup Report

## Security Audit
- **SECRET FOUND — MOVE TO ENVIRONMENT VARIABLE:** 
  - `backend/routes/authRoutes.js` (Hardcoded JWT fallback secret).
- **Missing Authorization:** No routes are currently protected. The JWT token is never verified by the backend.
- **Missing Input Validation:** Registration and login endpoints trust client input blindly without strict validation/sanitization.
- **Unsafe CORS:** Express CORS is enabled globally without specific origin restrictions.
- **Unsafe Password Handling:** Registration endpoint checks for existing users, but does not enforce strong password policies.

## Duplicate / Conflict Audit
- **Duplicate Logic:** None significant yet, as the codebase is small. 
- **Conflicting Route Names:** None currently.
- **Unused Files:** None currently.
- **Dead Code:** `controllers` and `middleware` directories in the backend are completely empty. Logic meant for controllers is currently written directly inside the route files (`authRoutes.js`, `expertRoutes.js`).

## Architecture Preservation
**SAFE TO EXTEND:**
- Existing frontend UI/Layout (Tailwind + React Router setup).
- Existing `Header` and `BottomNav` components.
- Existing Mongoose models (`User`, `Expert`, `Consultation`), but they require expansion.
- Existing Express setup in `server.js`.

**DO NOT MODIFY YET:**
- The current Authentication logic (until Phase 2 begins).
- The current Database schema structure.
- The seeded mock data.
