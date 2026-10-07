# Project Structure Audit

## 1. Current Folder Structure
```
c:\NG-Office_work\stitch_expert_consultation_marketplace_platform\
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── config/
│   ├── controllers/ (Empty)
│   ├── middleware/ (Empty)
│   ├── models/
│   │   ├── Consultation.js
│   │   ├── Expert.js
│   │   └── User.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── expertRoutes.js
│   ├── services/ (Empty)
│   ├── utils/ (Empty)
│   ├── seeder.js
│   ├── server.js
│   └── package.json
└── frontend/
    ├── .env
    ├── .env.example
    ├── index.html
    ├── public/
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   │   ├── BottomNav.jsx
    │   │   └── Header.jsx
    │   ├── hooks/
    │   ├── pages/
    │   │   ├── BookConsultation.jsx
    │   │   ├── Bookings.jsx
    │   │   ├── ExpertProfile.jsx
    │   │   ├── Experts.jsx
    │   │   ├── Home.jsx
    │   │   ├── LiveSession.jsx
    │   │   ├── Login.jsx
    │   │   ├── Market.jsx
    │   │   ├── Placeholder.jsx
    │   │   ├── Profile.jsx
    │   │   ├── Register.jsx
    │   │   └── WalletRecharge.jsx
    │   ├── services/
    │   ├── utils/
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css
    │   └── App.css
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

## 2. Frontend Architecture
- **Framework**: React via Vite
- **Styling**: Tailwind CSS
- **Routing**: `react-router-dom`
- **State Management**: None (Local component state)
- **API Client**: `axios`

## 3. Backend Architecture
- **Framework**: Express.js
- **Architecture Pattern**: MVC (Routes & Models exist, Controllers pending)
- **Database**: MongoDB via Mongoose

## 4. Database Architecture
- **Collections**: Users, Experts, Consultations (via Mongoose models).

## 5. Authentication Architecture
- **Method**: JWT Token
- **Location**: `backend/routes/authRoutes.js`
- **Current Flow**: Standard Email/Password Registration and Login. Token returned to client.

## 6. API Architecture
- **Base Route**: `/api`
- **Endpoints**:
  - `/api/auth/login` (POST)
  - `/api/auth/register` (POST)
  - `/api/experts` (GET)
  - `/api/experts/:id` (GET)

## 7. Admin Architecture
- **Current Status**: MISSING. No admin routes, pages, or models exist.

## 8. Existing User Functionality
- Login
- Register
- View list of experts
- View expert profile
- (UI only) Book consultation, view wallet, view profile

## 9. Existing Expert/Service-Provider Functionality
- **Current Status**: Seeded via database script (`seeder.js`). No dedicated expert registration or login UI/logic exists.

## 10. Existing Payment Functionality
- **Current Status**: MISSING logic. UI for "WalletRecharge" exists but doesn't process actual payments.

## 11. Existing Upload Functionality
- **Current Status**: MISSING.

## 12. Existing Notification Functionality
- **Current Status**: MISSING.

## 13. Existing UI/Pages
- Home, Experts, Market, Bookings, Profile, ExpertProfile, Login, Register, WalletRecharge, LiveSession, BookConsultation.

## 14. Important Reusable Components
- `Header.jsx`
- `BottomNav.jsx`

## 15. Potential Conflicts
- None identified at this stage.

## 16. Missing Architecture Required for the Future System
- Admin Dashboard (Frontend & Backend)
- Expert Dashboard (Frontend & Backend)
- Real Payment Integration (Stripe/Razorpay)
- Real-time signaling (WebSockets/Socket.io) for Chat/Video/Audio consultations
- File upload handling (AWS S3/Cloudinary) for documents and profile images
- Notification system (Push/Email)
- Complex role-based access control (RBAC) middleware
