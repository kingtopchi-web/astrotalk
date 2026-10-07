# Razorpay Integration Implementation Report

## Files Created
1. `backend/models/Payment.js` - New model to store Razorpay order, payment ID, amount, and status.
2. `backend/controllers/paymentController.js` - Handles order creation, signature verification, and webhook processing securely on the server side.
3. `backend/routes/paymentRoutes.js` - Defines endpoints for `/api/payments/create-order`, `/api/payments/verify`, and `/api/payments/webhook`.

## Files Modified
1. `backend/models/Consultation.js` - Added `paymentStatus` field with `pending`, `paid`, and `failed` enum. Updated `status` enum to include `pending`.
2. `backend/routes/bookingRoutes.js` - Updated to set initial `status` and `paymentStatus` to `pending` upon booking creation.
3. `backend/server.js` - Added `app.use('/api/payments', paymentRoutes)` to expose payment endpoints.
4. `frontend/.env` - Added `VITE_RAZORPAY_KEY_ID`.
5. `backend/.env` - Added `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`.

## Environment Variables Required
### Backend:
- `RAZORPAY_KEY_ID`=rzp_test_SBFgUhpkJffWZY
- `RAZORPAY_KEY_SECRET`=YKf15utu1cQxRP9WkcHWD5L8

### Frontend:
- `VITE_RAZORPAY_KEY_ID`=rzp_test_SBFgUhpkJffWZY

## API Endpoints Added/Modified
- `POST /api/payments/create-order`: Authenticated endpoint that retrieves consultation details from the DB and generates a Razorpay Order ID to securely prevent amount tampering.
- `POST /api/payments/verify`: Authenticated endpoint verifying `razorpay_signature` from Razorpay Checkout success callbacks. Marks payment and consultation as `paid` and `scheduled` respectively.
- `POST /api/payments/webhook`: Placeholder webhook receiver endpoint for asynchronous payment updates from Razorpay servers.

## Database Changes
- Introduced `Payment` schema storing details like user, expert, consultation reference, razorpay IDs, amounts and status.
- Migrated `Consultation` schemas to include `paymentStatus` tracking.

## Razorpay Dashboard Configuration Required
1. Generate test keys and configure in `.env`.
2. Register webhook URL in Razorpay Dashboard to point to `POST /api/payments/webhook` with appropriate events (`payment.captured`, `payment.failed`, `refund.processed`).
3. Set Webhook Secret in Razorpay and configure matching environment variable on your backend (e.g. `RAZORPAY_WEBHOOK_SECRET`) when finalizing webhook processing.

## Webhook URL
For production/Render deployment, set webhook URL as:
`https://YOUR_BACKEND_DOMAIN/api/payments/webhook`

## Test Steps
1. **Successful Payment:** Login to frontend -> Book an expert -> Check Network tab to see order being generated securely by Backend -> Complete Checkout with test cards -> Verify backend signature validates the payment and updates DB.
2. **Failed Payment:** Simulate a failed test card payment -> Ensure consultation remains in `pending` status.
3. **Admin Verification:** Go to Admin -> Check Payments/Transactions page (need to wire up backend fetching to newly populated `Payment` collection).
4. **Duplicate Payment / Cancellation:** Test closing the checkout modal and ensuring the consultation remains `pending` and handles re-attempts smoothly.

## Remaining Manual Steps
1. **Frontend UI Checkout Wiring:** Include the Razorpay JS script (`https://checkout.razorpay.com/v1/checkout.js`) in `index.html` or dynamically in your checkout component. Create frontend button click handler to `POST /api/payments/create-order` and instantiate `new window.Razorpay(options)` upon receiving the `orderId`. On `handler` success, post to `POST /api/payments/verify`.
2. **Admin Integration:** Create UI pages in Admin panel (`Admin/src/pages/...`) that fetch `Payment` model data.
3. **Notification Setup:** Add email/sms triggers post-verification inside `paymentController.js`.
