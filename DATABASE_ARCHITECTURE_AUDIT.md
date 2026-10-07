# Database Architecture Audit

## General Overview
- **Database Technology:** MongoDB
- **Connection:** Managed via Mongoose in `backend/server.js`. URL supplied by `MONGODB_URI` environment variable.

## Existing Models

### 1. User
- **Fields:**
  - `name`: String, required
  - `email`: String, required, unique
  - `password`: String, required
  - `walletBalance`: Number, default 0
  - `timestamps`: true

### 2. Expert
- **Fields:**
  - `name`: String, required
  - `specialty`: String, required
  - `rating`: Number
  - `reviewsCount`: Number
  - `pricePerMinute`: Number, required
  - `languages`: [String]
  - `status`: String, default 'offline'
  - `profileImage`: String
  - `isVerified`: Boolean, default false
  - `timestamps`: true

### 3. Consultation
- **Fields:**
  - `user`: ObjectId, ref 'User', required
  - `expert`: ObjectId, ref 'Expert', required
  - `type`: String, enum ['chat', 'audio', 'video'], required
  - `status`: String, enum ['pending', 'active', 'completed', 'cancelled'], default 'pending'
  - `startTime`: Date
  - `endTime`: Date
  - `durationMinutes`: Number
  - `totalCost`: Number
  - `timestamps`: true

## Diagram
```text
User
 |
 |--- Consultations (ref: user)

Expert
 |
 |--- Consultations (ref: expert)

Consultation
```
