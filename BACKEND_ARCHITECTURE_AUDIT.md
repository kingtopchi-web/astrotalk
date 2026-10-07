# Backend Architecture Audit

## Existing Setup
- **Server Entry Point:** `server.js` (Express initialized, MongoDB connected via mongoose, CORS enabled).
- **Controllers:** Directory exists but logic is currently coupled inside route files.
- **Services:** Empty directory.
- **Middleware:** Empty directory. No auth protection middleware implemented yet.
- **Validation:** Basic conditional checks; no external libraries like Joi or express-validator.
- **Error Handling:** Standard try/catch returning JSON. No centralized error handling middleware.

## Existing APIs

### Authentication
**METHOD:** POST
**ENDPOINT:** `/api/auth/register`
**PURPOSE:** Register a new user
**AUTH REQUIRED:** No
**ROLE:** Public
**REQUEST BODY:** `{ name, email, password }`
**RESPONSE:** `{ _id, name, email, walletBalance, token }`
**DATABASE COLLECTION/MODEL USED:** User

**METHOD:** POST
**ENDPOINT:** `/api/auth/login`
**PURPOSE:** User login
**AUTH REQUIRED:** No
**ROLE:** Public
**REQUEST BODY:** `{ email, password }`
**RESPONSE:** `{ _id, name, email, walletBalance, token }`
**DATABASE COLLECTION/MODEL USED:** User

### Experts
**METHOD:** GET
**ENDPOINT:** `/api/experts`
**PURPOSE:** Get all experts
**AUTH REQUIRED:** No
**ROLE:** Public
**REQUEST BODY:** None
**RESPONSE:** Array of expert objects
**DATABASE COLLECTION/MODEL USED:** Expert

**METHOD:** GET
**ENDPOINT:** `/api/experts/:id`
**PURPOSE:** Get single expert by ID
**AUTH REQUIRED:** No
**ROLE:** Public
**REQUEST BODY:** None
**RESPONSE:** Expert object
**DATABASE COLLECTION/MODEL USED:** Expert
