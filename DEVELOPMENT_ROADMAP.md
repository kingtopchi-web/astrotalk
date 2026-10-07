# Final Development Roadmap

**PHASE 1: Existing Project Audit**
- Completed (Current Phase).

**PHASE 2: Authentication & Role System**
- Setup JWT verification middleware.
- Implement RBAC (Role-Based Access Control) for User, Expert, and Admin.
- Secure frontend routes.

**PHASE 3: User Registration/Login**
- Refine existing user auth.
- Add password validation and reset flows.

**PHASE 4: Expert Registration/Profile**
- Create dedicated expert registration flow.
- Build expert dashboard frontend.

**PHASE 5: Category & Sub-category Management**
- Build category database models.
- Build Admin UI to manage categories.

**PHASE 6: Expert Document Upload & Verification**
- Integrate Cloud Storage (AWS S3/Cloudinary).
- Build expert document upload UI.

**PHASE 7: Admin Expert Approval/Rejection**
- Build Admin approval queue UI.
- Implement approval/rejection logic.

**PHASE 8: User Expert Discovery**
- Enhance `/experts` page with category filters and search.

**PHASE 9: Wallet & Payment**
- Integrate Payment Gateway.
- Implement real wallet top-up logic.

**PHASE 10: Consultation Request System**
- Implement request logic between User and Expert.
- Real-time notifications for requests.

**PHASE 11: Chat Consultation**
- Build real-time chat via WebSockets.

**PHASE 12: Audio Consultation**
- Integrate WebRTC/Twilio for audio.

**PHASE 13: Video Consultation**
- Integrate WebRTC/Twilio for video.

**PHASE 14: Timer & Per-minute Billing**
- Implement real-time consultation timer.
- Deduct wallet balance dynamically.

**PHASE 15: Expert Earnings & Admin Commission**
- Calculate earnings post-consultation.
- Build expert payout request flow.

**PHASE 16: Reviews & Ratings**
- Build review submission post-consultation.
- Update expert overall rating automatically.

**PHASE 17: Notifications**
- System-wide push/email notifications for events (approvals, bookings).

**PHASE 18: Admin Reports & Analytics**
- Build charts and financial reports in Admin dashboard.

**PHASE 19: Security & Performance**
- Rate limiting, security headers, database indexing.

**PHASE 20: Production Testing & Deployment**
- E2E testing, CI/CD setup, production rollout.
