# Cinema E-Booking Users' Portal - Test Cases & Demo Checklist

## Pre-Demo Setup

### 1. Database Seeding
- **Action**: Call `/api/seed?seed=true` before demo
- **Expected Result**: Database populated with 6 test movies, each with 3-4 showtimes
  - Test data includes movies in Rooms A, B, and C
  - Each movie has distinct showtimes to avoid conflicts

### 2. Test Accounts
- **Admin Account**: (Use existing admin account from authentication)
- **Customer Account**: 
  - Username: testuser
  - Email: testuser@example.com
  - Password: (create before demo)

---

## Demo Checklist - User Flow

### Phase 1: Movie Selection (Showtimes Visibility - 5 pts)
- [ ] Navigate to homepage
- [ ] Click on any movie (e.g., "The Great Adventure")
- [ ] Verify movie details load:
  - [ ] Movie poster displays
  - [ ] Movie title, rating, genre, description visible
  - [ ] Trailer embeds properly
  - [ ] Showtimes are listed correctly (loaded from database)
    - [ ] Example: 14:00, 17:00, 20:00, 22:30

### Phase 2: Start Booking - Showtime Selection (Start Booking - 5 pts)
- [ ] Select a showtime (e.g., "5:00 PM")
- [ ] Verify redirect to booking page with:
  - [ ] Correct movie title
  - [ ] Correct showtime displayed
  - [ ] "Book Tickets" page loads

### Phase 3: Seat Selection with Seat Map (Seat Map Display & Selection - 20 pts)
- **Seat Map Display (5 pts)**:
  - [ ] Seat grid displays correctly (8x8 grid)
  - [ ] "SCREEN" label visible at top
  - [ ] Seat labels show correctly (A1, A2, ... H8)
  - [ ] Available seats have light gray background
  - [ ] UI is clear and user-friendly

- **Ticket Count Section (5 pts)**:
  - [ ] "Tickets" section displays
  - [ ] Adult tickets shown as $12 each
  - [ ] Child tickets shown as $8 each
  - [ ] Senior tickets shown as $10 each
  - [ ] Ticket counts auto-update based on seat selection

- **Seat Selection & Validation (15 pts)**:
  - [ ] Click multiple seats to select them
    - [ ] Selected seats change color to blue
    - [ ] Selected seats display selection state
  - [ ] Try selecting more seats than needed
    - [ ] Validation allows any number of selections
  - [ ] "See the Details" button:
    - [ ] **Disabled** when no seats selected
    - [ ] **Enabled** when seats selected
  - [ ] Error handling:
    - [ ] Try clicking "See the Details" with no seats
    - [ ] Error message: "Select at least one seat before continuing."

### Phase 4: Booking Details Display (Checkout Order Summary - Part 1)
- [ ] Click "See the Details" after selecting seats
- [ ] Verify Details page displays:
  - [ ] Movie name: "The Great Adventure"
  - [ ] Showtime: "5:00 PM"
  - [ ] Selected seats: "A1, A2, B5" (or your selection)
  - [ ] Number of tickets: matching seats
  - [ ] Price per ticket: $12.00
  - [ ] Total price: calculated correctly (seats × $12)
  - [ ] Total shown before tax

### Phase 5: Customer Information & Payment Method (Checkout Order Summary - Part 2)
- [ ] Click "Continue to Checkout"
- [ ] **Login Requirement Test (2 pts)**:
  - [ ] If not logged in, redirected to login page
  - [ ] Seats remain reserved after login
  - [ ] Return to checkout after successful login
  - [ ] Verify seats still selected
- [ ] Verify checkout form displays with required fields marked with red `*`:
  - **Full Name Field (required)**:
    - [ ] Try proceeding without name
    - [ ] Error: "⚠️ Full Name is required"
    - [ ] Try entering single character
    - [ ] Error: "⚠️ Full Name must be at least 2 characters"
    - [ ] Enter valid name: "John Doe"
  
  - **Email Address Field (required)**:
    - [ ] Try proceeding without email
    - [ ] Error: "⚠️ Email address is required"
    - [ ] Try invalid email: "notanemail"
    - [ ] Error: "⚠️ Please enter a valid email address"
    - [ ] Enter valid email: "john@example.com"
  
  - **Address Field (optional)**:
    - [ ] Address is optional (no asterisk)
    - [ ] Can be left blank
  
  - **Payment Method Section**:
    - [ ] If user has saved cards: Show option to use saved cards
    - [ ] Show option: "Use a different card for this checkout"
    - [ ] If new card selected, display:
      - [ ] Cardholder Name field (required) - marked with `*`
      - [ ] Card Number field (required) - marked with `*`
      - [ ] Expiration Date field (required) - marked with `*`
      - [ ] CVV field (required) - marked with `*`

### Phase 6: Payment Page Mockup Display (Checkout - Payment Processing)
- [ ] Click "Complete Checkout" after filling valid info
- [ ] Verify Payment Processing page displays:
  - [ ] "Secure Payment" header with lock icon 🔒
  - [ ] "Processing your payment securely..." message
  - [ ] Loading spinner animation
  - [ ] Payment details section showing:
    - [ ] Cardholder name
    - [ ] Card type and last 4 digits
    - [ ] Total amount
  - [ ] Order summary with:
    - [ ] Movie title
    - [ ] Showtime
    - [ ] Selected seats
    - [ ] Total amount
  - [ ] Security note about payment mockup
  - [ ] Clear note: "This is a mockup demonstration"
  - [ ] Back and "Complete Payment (Demo)" buttons

### Phase 7: Booking Confirmation & Email (Checkout Order Summary & Email - 20 pts)
- [ ] Click "Complete Payment (Demo)" button
- [ ] Verify Confirmation page displays:
  - **Confirmation Success Display (13 pts)**:
    - [ ] "Booking Confirmed" message
    - [ ] "Your tickets are ready" message
    - [ ] Confirmation code displayed (BK-XXXXXX format)
    - [ ] Confirmation Summary section with:
      - [ ] Movie name
      - [ ] Showtime
      - [ ] Selected seats
      - [ ] Customer email
      - [ ] Total paid amount
  
  - **Email Confirmation (5 pts)**:
    - [ ] Check email inbox for confirmation email
    - [ ] Email subject: "Booking Confirmation - BK-XXXXXX"
    - [ ] Email contains:
      - [ ] Confirmation code
      - [ ] Movie title
      - [ ] Showtime
      - [ ] Seat numbers
      - [ ] Total price
      - [ ] Professional formatting
  
  - **Navigation Options**:
    - [ ] "Return Home" button works
    - [ ] "View Profile" button works

---

## Additional Validation Tests

### Input Validation Tests
- **Client-Side Validation**:
  - [ ] Empty name field shows error message
  - [ ] Invalid email format shows specific error
  - [ ] Short name (1 char) shows length error
  - [ ] Empty card fields show individual errors
  - [ ] Card number validation checks length (13-19 digits)

- **Server-Side Validation** (Via API):
  - [ ] POST /api/bookings with invalid email rejected
  - [ ] POST /api/bookings with missing name rejected
  - [ ] POST /api/bookings with no seats rejected
  - [ ] Seats and ticket count mismatch rejected
  - [ ] Non-existent movie ID returns 404

### UI/UX Tests
- **Required Fields Indication**:
  - [ ] Red asterisk (*) shown for all required fields
  - [ ] Clear placeholder text in form fields
  - [ ] Arial labels for accessibility
  
- **Error Messages**:
  - [ ] All error messages start with warning icon ⚠️
  - [ ] Error messages are specific (not generic)
  - [ ] Error messages guide user on how to fix
  
- **Responsive Design**:
  - [ ] Work on desktop (tested)
  - [ ] Forms stack properly on mobile

### Architecture & Code Organization
- **MVC/Layered Architecture**:
  - [ ] Models: Movie, User, Booking (in `/models`)
  - [ ] Views: Pages and Components (in `/app`)
  - [ ] Controllers: API routes (in `/app/api`)
  - [ ] Services: Email, Auth utilities (in `/lib`)
  - [ ] Database: MongoDB connection (in `/database`)

---

## Performance & Edge Cases

### Seat Reservation Tests
- [ ] Multiple users can view same movie
- [ ] Seat selection is immediate
- [ ] No race conditions in this sprint (noted for final demo)

### Data Persistence Tests
- [ ] Booking created in database
- [ ] Email sent successfully (or gracefully fails)
- [ ] User can view past bookings (profile page)

### Error Handling Tests
- [ ] Network error during booking gracefully handled
- [ ] Invalid movie ID shows appropriate error
- [ ] Missing required field validation with clear messages

---

## Demo Timing

- **Database Seeding**: ~30 seconds
- **Full User Flow (Movie → Confirmation)**: ~3-5 minutes
- **Validation Testing**: ~2-3 minutes
- **Total Demo Time**: ~6-8 minutes

---

## Notes for Demo

1. **Ensure Test Data**: Run `/api/seed?seed=true` before demo start
2. **Use Test Account**: Log in with test account for full flow
3. **Explain Architecture**: Point out folder structure matches MVC pattern
4. **Highlight Validation**: Show both client and server-side validation
5. **Email Confirmation**: Have email client open to show confirmation email
6. **Payment Mockup Notice**: Emphasize this is a mockup for this sprint
7. **Seat Reservation Note**: Explain automatic unlock after 5 minutes is design consideration for final demo
