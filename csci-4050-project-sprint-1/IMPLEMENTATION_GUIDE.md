# Cinema E-Booking - Architecture & Implementation Guide

## System Architecture Overview

### MVC/Layered Architecture Pattern

The application follows a multi-layer architecture ensuring clear separation of concerns:

```
Client Layer (Frontend)
├── UI Pages (/app/*/page.js, /app/*/page.jsx)
└── Components (/components/)

API Layer (Endpoints)
├── /app/api/* (Route handlers)
└── Validation logic

Service Layer
├── /lib/auth/ (Authentication, Email)
├── /lib/security/ (Encryption)
└── /utils/ (Utilities)

Data Access Layer
├── /models/ (MongoDB schemas)
├── /database/db.js (Connection)
└── Database (MongoDB Atlas)
```

---

## Component Breakdown

### 1. Models (/models/)

**User.js** - User Schema
- Fields: name, email, username, password, role, status, verification
- Collections: addresses, favorites, payments
- Status: Active/Inactive, verified status tracking

**Movie.js** - Movie Schema (UPDATED)
- Fields: title, poster_url, rating, genre, status, description, trailer_url
- **NEW**: showtimes (array), showroom (location)
- Showtimes loaded from database

**Booking.js** - Booking Schema (NEW)
- Fields: movieId, userId, showtime, seats, numberOfTickets, ticketTypes
- Customer info: name, email, address
- Pricing: totalPrice, paymentInfo
- Status tracking: pending, confirmed, cancelled
- TTL index for automatic expiration (5 minutes)

### 2. API Routes (/app/api/)

#### Authentication Routes
- `/auth/login` - User login with session management
- `/auth/register` - User registration with email verification
- `/auth/logout` - Session termination
- `/auth/forgot-password` - Password reset flow
- `/auth/reset-password` - Password update

#### Movie Routes
- `GET /movies` - Fetch all movies with showtimes
- `GET /movies/[id]` - Fetch single movie details
- `GET /movies/search?q=title` - Search movies

#### NEW Booking Routes
- `POST /bookings` - Create booking with validation
- `GET /bookings?id=X` - Fetch booking details
- `GET /bookings?userId=X` - Get user's bookings
- `POST /bookings/confirm` - Confirm and process booking

#### NEW Seed Route
- `GET /seed?seed=true` - Populate test data

### 3. Frontend Pages & Components

#### Movie Browsing
- `/movies/[id]/page.js` - Movie details with showtimes
  - Shows database-loaded showtimes
  - Favoriting functionality
  - Trailer integration

#### Booking Flow
- `/booking/[id]/page.js` - Multi-step booking process
  - **Step 1**: Seat Selection
    - 8x8 seat grid
    - Visual feedback for selected seats
    - Real-time ticket count update
  - **Step 2**: Booking Details
    - Display selected configuration
    - Price summary
  - **Step 3**: Checkout
    - Customer information form
    - Payment method selection
    - Validation with error messages
  - **Step 4**: Payment Processing (Mockup)
    - Secure payment UI mockup
    - Loading animation
    - Demo-only completion button
  - **Step 5**: Confirmation
    - Booking confirmation with code
    - Email sent confirmation
    - Navigation options

---

## Data Flow: Complete User Journey

```
1. USER BROWSES MOVIES
   └─> GET /api/movies
       └─> Returns all movies with database showtimes

2. USER SELECTS MOVIE
   └─> Click movie → Navigate to /movies/[id]
       └─> GET /api/movies/[id]
           └─> Display movie details + showtimes

3. USER SELECTS SHOWTIME
   └─> Click showtime → Navigate to /booking/[id]?time=HH:MM
       └─> Booking page loads with selected time

4. USER SELECTS SEATS
   └─> Click seats in grid
       └─> Client-side state updates (no API call yet)
       └─> Button enables when 1+ seat selected

5. USER SUBMITS TICKET DETAILS
   └─> Click "See the Details"
       └─> Client validation: Check seat count > 0
       └─> Move to Details step

6. USER ENTERS CUSTOMER INFO
   └─> Click "Continue to Checkout"
       └─> CHECK: User logged in?
           ├─> YES: Continue to checkout
           └─> NO: Redirect to /login with return URL
               └─> On success, load profile & continue

7. USER ENTERS PAYMENT INFO & SUBMITS
   └─> Click "Complete Checkout"
       └─> Client validation: All fields valid?
       └─> Pass validation → Move to Payment step

8. USER CONFIRMS PAYMENT
   └─> Click "Complete Payment (Demo)"
       └─> Generate confirmation code
       └─> Move to confirmation page

9. SYSTEM SENDS CONFIRMATION
   └─> Generate confirmation code (BK-XXXXXX)
       └─> POST /api/bookings/confirm
           └─> Create booking in database
           └─> Send confirmation email
           └─> Display confirmation

10. USER COMPLETES
    └─> View confirmation
    └─> Click "Return Home" or "View Profile"
```

---

## Validation Architecture

### Client-Side Validation (Immediate Feedback)

**Seat Selection Validation**:
```javascript
- Prevents selecting 0 seats
- Error: "Select at least one seat before continuing."
```

**Customer Info Validation**:
```javascript
- Name: Non-empty, min 2 characters
- Email: Valid format check (regex)
- Card fields: Required when "new card" selected
- Card number: 13-19 digits
- All fields show specific error messages with ⚠️ icon
```

### Server-Side Validation (Data Integrity)

**Booking Creation Validation** (POST /api/bookings):
```javascript
- MovieId: Exists and valid
- Showtime: Valid format
- Seats: Non-empty array
- Customer Name: Min 2 characters
- Email: Valid email format
- Ticket count matches seat count
- Returns: 400 error with detailed validation messages
```

**Confirmation Validation** (POST /api/bookings/confirm):
```javascript
- Booking exists
- User authorized (owns booking or is admin)
- Payment info validated
- Email sent successfully (non-blocking)
```

---

## Data Integrity Measures

### Input Sanitization
- Email: Trimmed, lowercased
- Names: Trimmed
- Seat data: Validated as array of strings

### Database Constraints
- Email uniqueness on User model
- Foreign key references (movieId → Movie)
- TTL index for auto-expiring pending bookings

### Error Handling
- Try-catch blocks on all API routes
- Detailed error logging for debugging
- User-friendly error messages (no stack traces)

---

## Testing & Demo Data

### Seed Data (/api/seed)
6 movies across 3 showrooms (A, B, C):
1. **The Great Adventure** - Room A (4 showtimes)
2. **Romance Under Starlight** - Room B (3 showtimes)
3. **Sci-Fi Chronicles** - Room C (4 showtimes)
4. **Comedy Nights Out** - Room A (3 showtimes)
5. **Mystery Manor** - Room B (3 showtimes)
6. **Animation Dreams** - Room C (4 showtimes)

### Test Cases
- Complete booking flow validation
- Invalid input handling
- UI/UX clarity
- Email confirmation
- Responsive design

---

## Key Features Implemented

### ✅ Showtimes Visibility (5 pts)
- Movies load showtimes from database
- Showtimes display on movie details page
- User can select from available showtimes

### ✅ Start Booking (5 pts)
- User selects showtime
- Navigates to booking page with selected time
- Seat selection begins with context

### ✅ Seat Map Display (5 pts)
- 8x8 seat grid
- Clear labeling (A1, A2, ... H8)
- Visual distinction between available/selected seats
- Screen position indicator

### ✅ Seat Selection (15 pts)
- Click to select/deselect seats
- Validation: Both count displayed and validated
- Number matches seats selected
- Session reservation (5-minute TTL in design)
- Prevent double-booking (for final demo)

### ✅ Checkout Order Summary & Email (20 pts)
- Order summary page with all details
- Movie name, showtime, seats, ticket type
- Price per ticket and total (before tax)
- Email retrieval (confirm existing or enter new)
- Email confirmation sent with booking details
- Payment page mockup (demo-only)

### ✅ Login Requirement at Checkout (2 pts)
- If not logged in, redirect to login
- Seat selection preserved during login
- Continue checkout after successful login

### ✅ Non-Functional Requirements

**Architecture (10 pts)**:
- Clear MVC/layered pattern
- Separation of concerns
- Models, Views, Controllers distinct

**Usability (5 pts)**:
- Clear UI with helpful prompts
- Error messages specific and actionable
- Required fields marked with red asterisk
- Placeholder text for guidance

**Data Integrity (5 pts)**:
- Client and server validation
- No invalid data enters system
- Consistent data across layers

**Test Readiness (5 pts)**:
- Seed data prepared (6 movies, 3 rooms)
- Test cases documented
- Complete demo checklist

---

## Environment Variables Required

```env
# Database
MONGO_URI=mongodb+srv://...

# Email (Optional - confirmation still works without)
SENDGRID_API_KEY=...
EMAIL_FROM=...
EMAIL_FROM_NAME=Cinema E-Booking

# Session
SESSION_SECRET=...
JWT_SECRET=...
```

---

## File Structure Reference

```
csci-4050-project-sprint-1/
├── app/
│   ├── api/
│   │   ├── seed/route.js (NEW)
│   │   ├── bookings/ (NEW)
│   │   │   ├── route.js (NEW)
│   │   │   └── confirm/route.js (NEW)
│   │   └── ...existing auth/movies routes
│   ├── booking/
│   │   └── [id]/page.js (UPDATED - multi-step flow)
│   ├── movies/
│   │   └── [id]/page.js (UPDATED - load showtimes)
│   └── ...other pages
├── models/
│   ├── movie.js (UPDATED - added showtimes, showroom)
│   ├── booking.js (NEW)
│   ├── user.js
│   └── ...
├── lib/
│   ├── auth/
│   │   ├── email.js (UPDATED - sendBookingConfirmationEmail)
│   │   └── ...other auth
│   └── security/
├── database/
│   └── db.js
├── TEST_CASES.md (NEW - comprehensive test guide)
└── ...
```

---

## Demo Sequence

1. **Setup** (~30 sec)
   - Call `/api/seed?seed=true` to populate test data
   - Open user email to monitor for confirmation

2. **Movie Selection** (~1 min)
   - Show homepage with seeded movies
   - Click a movie, verify showtimes from database

3. **Full Booking Flow** (~3-4 min)
   - Select showtime
   - Select multiple seats
   - Enter customer information
   - Show validation (try invalid input)
   - Complete to payment mockup
   - Confirm booking

4. **Verification** (~1-2 min)
   - Show confirmation code
   - Check email inbox for confirmation
   - Demonstrate all fields in email

5. **Explanation** (~2-3 min)
   - Explain architecture (MVC pattern)
   - Point out validation (client + server)
   - Describe data flow
   - Discuss design considerations for final demo

**Total Demo Time**: ~8-10 minutes
