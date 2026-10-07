# Frontend Architecture Audit

## Existing Architecture
- **Framework:** React 18+ created with Vite.
- **Language:** JavaScript.
- **Routing:** React Router v6.
- **Styling:** Tailwind CSS.
- **API Client:** Axios.

## Existing Routes
Defined in `App.jsx`:
- `/` -> `Home.jsx`
- `/login` -> `Login.jsx`
- `/register` -> `Register.jsx`
- `/expert/:id` -> `ExpertProfile.jsx`
- `/book/:id` -> `BookConsultation.jsx`
- `/live/:id` -> `LiveSession.jsx`
- `/wallet` -> `WalletRecharge.jsx`
- `/experts` -> `Experts.jsx`
- `/market` -> `Market.jsx`
- `/bookings` -> `Bookings.jsx`
- `/profile` -> `Profile.jsx`

## Existing API Integration
- `Home.jsx` and `Experts.jsx` fetch from `/api/experts`.
- `ExpertProfile.jsx` fetches from `/api/experts/:id`.
- `Login.jsx` POSTs to `/api/auth/login`.
- `Register.jsx` POSTs to `/api/auth/register`.

## Existing Authentication Flow
- User inputs credentials in Login/Register.
- API returns `token` and `user` object.
- Frontend stores them in `localStorage`.
- No Auth Context or persistent global state exists; components read directly from `localStorage`.
- **Note:** Missing route protection. Currently, any unauthenticated user can theoretically navigate to protected views.

## Existing State Management
- Only local component state (`useState`, `useEffect`). No Redux, Zustand, or Context API.

## Existing Reusable Components
- `Header.jsx`: Top navigation/branding.
- `BottomNav.jsx`: Mobile-first bottom navigation tabs.

## Existing Problems
- **Missing Route Protection:** No PrivateRoute component to secure wallet, bookings, or profile.
- **Hardcoded API URLs:** Components use `http://localhost:5000` instead of a relative path or environment variable.
- **No Global Auth State:** Relying heavily on `localStorage.getItem` directly in components.

## Recommended Architecture Changes
1. Introduce a Global Context (e.g., `AuthContext`) for user state.
2. Implement a higher-order component (HOC) or wrapper for protected routes.
3. Configure Axios interceptors to inject the Bearer token into request headers.
4. Use environment variables for the API base URL.
5. Setup separate route groupings for Public, User, Expert, and Admin views.
