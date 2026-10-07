# Future System Architecture

Based on the existing project, here is the proposed architecture for the future expert consultation platform.

## USER
- **Register:** Create account.
- **Login:** Access account.
- **Profile:** Manage personal details.
- **Categories:** Browse experts by category/subcategory.
- **Expert Listing:** View list of verified experts.
- **Expert Profile:** View detailed expert information, ratings, and reviews.
- **Wallet:** View balance.
- **Recharge:** Add funds via payment gateway.
- **Consultation:** Request and participate in chat, audio, or video sessions.
- **Consultation History:** View past sessions and receipts.
- **Reviews:** Leave ratings and reviews post-consultation.

## EXPERT
- **Register:** Apply to be an expert.
- **Login:** Access expert dashboard.
- **Professional Profile:** Manage bio, specialty, languages, etc.
- **Qualification:** Add degrees/certifications.
- **Experience:** List professional history.
- **Category:** Select primary category.
- **Sub-category:** Select specialized subcategories.
- **Degree/Document Upload:** Upload identity and qualification proofs.
- **Verification Status:** Track approval status.
- **Admin Approval:** Requires admin manual approval to become active.
- **Online/Offline:** Toggle availability for instant consultations.
- **Consultation Requests:** Accept/decline incoming requests.
- **Active Consultation:** Conduct the session.
- **Earnings:** View accumulated earnings.
- **Transaction History:** View withdrawals and payments.

## ADMIN
- **Login:** Secure admin access.
- **Dashboard:** Overview of platform metrics.
- **User Management:** View, ban, or manage users.
- **Expert Management:** View all experts.
- **Expert Approval/Rejection:** Review documents and approve/reject expert applications.
- **Category Management:** Create/edit/delete categories.
- **Sub-category Management:** Manage subcategories under main categories.
- **Pricing:** Set platform-wide pricing rules or commission rates.
- **Consultations:** Monitor active and past consultations (for dispute resolution).
- **Payments:** Manage payout requests from experts.
- **Wallet:** Oversee overall platform funds.
- **Transactions:** View all financial transactions.
- **Commission:** Track platform revenue.
- **Reviews:** Moderate reviews and ratings.
- **Reports:** Generate financial and usage analytics.

## Category Architecture (Planning)
Categories and subcategories should be a separate database model referenced by the Expert model.
```text
Astrology
  ├── Vedic Astrology
  ├── Numerology
  └── Tarot

Wellness
  ├── Life Coach
  ├── Nutritionist
  └── Therapist
```

## Consultation Architecture (Planning)
1. **User:** Views Expert Profile -> Selects Consultation Type (Chat/Audio/Video).
2. **System:** Checks Expert Availability (Online/Offline) -> Checks User Wallet balance (Must have enough for X minutes).
3. **User:** Initiates Request.
4. **Expert:** Accepts Request.
5. **System:** Consultation Starts -> Timer Starts (WebSockets).
6. **System:** Continuous Billing (Deducts from user wallet, holds in escrow).
7. **System/User/Expert:** Consultation Ends.
8. **System:** Final Settlement (Credits expert earnings minus platform commission).

## Expert Approval Architecture (Planning)
```text
REGISTERED (Basic auth created)
    ↓
PENDING (Documents uploaded, awaiting review)
    ↓
ADMIN REVIEW (Admin inspects documents)
    ↓
APPROVED / REJECTED
    ↓
(If Approved) -> ACTIVE / SUSPENDED (Can toggle online status)
(If Rejected) -> Requires resubmission
```
