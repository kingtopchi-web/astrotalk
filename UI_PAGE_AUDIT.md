# Current UI Audit

## PUBLIC SCREENS

- **Page Name:** Home
  - **Route:** `/`
  - **Purpose:** Landing page, displays categories and top experts.
  - **Existing Functionality:** Fetches experts.
  - **API Used:** `GET /api/experts`
  - **Auth Required:** No
  - **UI Status:** Completed (functional).

- **Page Name:** Experts
  - **Route:** `/experts`
  - **Purpose:** Full list of all experts.
  - **Existing Functionality:** Fetches experts and displays list.
  - **API Used:** `GET /api/experts`
  - **Auth Required:** No
  - **UI Status:** Completed (functional).

- **Page Name:** Market
  - **Route:** `/market`
  - **Purpose:** E-commerce shop for items.
  - **Existing Functionality:** Displays static products.
  - **API Used:** None
  - **Auth Required:** No
  - **UI Status:** Completed (static UI).

- **Page Name:** Login
  - **Route:** `/login`
  - **Purpose:** User authentication.
  - **Existing Functionality:** Submits credentials, saves token.
  - **API Used:** `POST /api/auth/login`
  - **Auth Required:** No
  - **UI Status:** Completed.

- **Page Name:** Register
  - **Route:** `/register`
  - **Purpose:** User account creation.
  - **Existing Functionality:** Submits details, creates account.
  - **API Used:** `POST /api/auth/register`
  - **Auth Required:** No
  - **UI Status:** Completed.

- **Page Name:** Expert Profile
  - **Route:** `/expert/:id`
  - **Purpose:** Detailed view of an expert.
  - **Existing Functionality:** Fetches single expert data.
  - **API Used:** `GET /api/experts/:id`
  - **Auth Required:** No
  - **UI Status:** Completed.

## USER SCREENS

*(Note: Currently accessible without auth due to missing protection)*

- **Page Name:** Bookings
  - **Route:** `/bookings`
  - **Purpose:** List of upcoming/past sessions.
  - **Existing Functionality:** Static list.
  - **API Used:** None
  - **Auth Required:** Should be Yes (Currently No).
  - **UI Status:** Completed (static UI).

- **Page Name:** Profile
  - **Route:** `/profile`
  - **Purpose:** User details and logout.
  - **Existing Functionality:** Reads `localStorage`, executes logout.
  - **API Used:** None
  - **Auth Required:** Should be Yes (Currently No).
  - **UI Status:** Completed (reads local storage).

- **Page Name:** Wallet Recharge
  - **Route:** `/wallet`
  - **Purpose:** Add funds to wallet.
  - **Existing Functionality:** Static UI for selecting amounts.
  - **API Used:** None
  - **Auth Required:** Should be Yes.
  - **UI Status:** Completed (static UI).

- **Page Name:** Book Consultation
  - **Route:** `/book/:id`
  - **Purpose:** Flow to schedule a session.
  - **Existing Functionality:** Static calendar/time UI.
  - **API Used:** None
  - **Auth Required:** Should be Yes.
  - **UI Status:** Completed (static UI).

- **Page Name:** Live Session
  - **Route:** `/live/:id`
  - **Purpose:** The actual video/audio call interface.
  - **Existing Functionality:** Static mockup of a call.
  - **API Used:** None
  - **Auth Required:** Should be Yes.
  - **UI Status:** Completed (static UI).

## EXPERT SCREENS
- MISSING

## ADMIN SCREENS
- MISSING
