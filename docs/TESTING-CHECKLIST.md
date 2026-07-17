# Admin Dashboard Testing Checklist

## Environment

- **Server**: http://localhost:3000
- **Status**: ✅ Running
- **Admin Credentials**:
  - Email: `admin@followersboost.com`
  - Password: `Admin123!`

---

## Phase 8: Analytics Dashboard Testing

### Standard Dashboard (`/admin/dashboard`)

- [ ] **Login as Admin**
  - Navigate to http://localhost:3000/login
  - Enter credentials above
  - Verify login successful

- [ ] **View Revenue Cards**
  - [ ] Total revenue displays correctly
  - [ ] Today's revenue shows
  - [ ] This week's revenue shows
  - [ ] This month's revenue shows

- [ ] **View Order Stats**
  - [ ] Total orders count displays
  - [ ] Order status breakdown shows (PENDING, PROCESSING, etc.)
  - [ ] Percentages add up to 100%

- [ ] **View User Stats**
  - [ ] Total users count
  - [ ] New users this week
  - [ ] Active users (30 days)

- [ ] **View Top Services**
  - [ ] Top 5 services by revenue listed
  - [ ] Platform names show correctly
  - [ ] Order counts display

- [ ] **View Time-Series Charts**
  - [ ] Revenue chart renders
  - [ ] Order volume chart renders
  - [ ] User growth chart renders
  - [ ] Date range tabs work (7d, 30d, 90d, all)
  - [ ] Chart data updates when changing range

- [ ] **Advanced Analytics Button**
  - [ ] Button visible in header
  - [ ] Clicking navigates to `/admin/analytics`

### Advanced Analytics (`/admin/analytics`)

#### Navigation
- [ ] **Sidebar Link**
  - [ ] "Analytics" link shows in admin sidebar
  - [ ] Icon displays correctly (BarChart3)
  - [ ] Active state when on page

- [ ] **Back Navigation**
  - [ ] Back to dashboard link works
  - [ ] Breadcrumb navigation (if any)

#### Customer Insights Section
- [ ] **Conversion Metrics Card**
  - [ ] Conversion rate displays (% format)
  - [ ] User counts show (converted vs total)
  - [ ] Repeat customer rate shows
  - [ ] Average time to first order shows (in days)

- [ ] **Payment Methods Chart**
  - [ ] Horizontal distribution bar renders
  - [ ] Payment method breakdown (Stripe, PayPal)
  - [ ] Transaction counts show
  - [ ] Revenue per method displays
  - [ ] Percentages calculate correctly

#### Customer Segmentation Section
- [ ] **Segment Overview**
  - [ ] Horizontal bar shows 4 segments (New, Occasional, Regular, VIP)
  - [ ] Color coding: Gray, Blue, Green, Purple
  - [ ] Percentages visible on hover or in bar

- [ ] **Segment Details**
  - [ ] Each segment card shows:
    - [ ] User count and percentage
    - [ ] Total revenue
    - [ ] Average order count
    - [ ] Average order value
  - [ ] Icons display correctly per segment

#### Platform Performance Section
- [ ] **Platform Bars**
  - [ ] All platforms listed (up to 8)
  - [ ] Revenue bars scale correctly
  - [ ] Platform names show

- [ ] **Platform Stats**
  - [ ] Order count per platform
  - [ ] Average order value
  - [ ] Completion rate with percentage
  - [ ] Icons render (Package, DollarSign, CheckCircle)

#### Fulfillment Performance Section
- [ ] **Provider Table**
  - [ ] Table headers render
  - [ ] Provider names list
  - [ ] Order counts show
  - [ ] Success rates color-coded:
    - [ ] Green for 90%+
    - [ ] Yellow for 70-89%
    - [ ] Red for <70%
  - [ ] Average completion time formats correctly (m/h/d)
  - [ ] Total revenue per provider

- [ ] **Summary Stats**
  - [ ] Total orders aggregate
  - [ ] Average success rate calculates
  - [ ] Total revenue sums

#### Cohort Retention Section
- [ ] **Cohort Table**
  - [ ] Monthly cohorts listed
  - [ ] Cohort size shows
  - [ ] M0-M3 retention percentages
  - [ ] Color coding:
    - [ ] Green (50%+)
    - [ ] Yellow (25-49%)
    - [ ] Orange (10-24%)
    - [ ] Red (<10%)
  - [ ] Empty cells show "-"

- [ ] **Legend and Info**
  - [ ] Color legend displays
  - [ ] Explanation text shows

#### General
- [ ] **No Data States**
  - [ ] Empty states show appropriate messages
  - [ ] No JavaScript errors in console
  - [ ] No layout shifts on load

- [ ] **Responsive Design**
  - [ ] Works on desktop (1920px)
  - [ ] Works on tablet (768px)
  - [ ] Works on mobile (375px)

- [ ] **Performance**
  - [ ] Page loads in <2 seconds
  - [ ] No visual lag or stuttering
  - [ ] Charts render smoothly

---

## Phase 9: Email Preferences Testing

### Email Preferences Page (`/settings/email-preferences`)

- [ ] **Navigation**
  - [ ] Page accessible from settings
  - [ ] Back button works
  - [ ] Breadcrumbs show

- [ ] **Unsubscribe from All**
  - [ ] Toggle switch visible
  - [ ] Clicking toggles state (off to on)
  - [ ] When ON, all other toggles disable
  - [ ] When ON, all other toggles turn off
  - [ ] Toggle color changes (gray to red)

- [ ] **Individual Categories**
  - [ ] 6 categories display:
    - [ ] Order Updates (🛒)
    - [ ] Order Completion (🔔)
    - [ ] Order Issues (📧)
    - [ ] Wallet Notifications (💰)
    - [ ] Promotional Emails (📢)
    - [ ] Newsletter (📰)
  - [ ] Icons render correctly
  - [ ] Descriptions show
  - [ ] Toggle switches work

- [ ] **Category Interaction**
  - [ ] Toggling any category ON sets "Unsubscribe All" to OFF
  - [ ] Categories disabled when "Unsubscribe All" is ON
  - [ ] Visual disabled state (gray background)

- [ ] **Save Preferences**
  - [ ] "Save Preferences" button visible
  - [ ] Button shows "Saving..." during save
  - [ ] Success toast notification shows
  - [ ] Error toast if save fails
  - [ ] Preferences persist after page reload

- [ ] **Info Banner**
  - [ ] Blue info banner displays
  - [ ] Message about security notifications shows

### Unsubscribe Page (`/unsubscribe`)

- [ ] **With Valid Token**
  - [ ] Navigate to `/unsubscribe?token=<valid-token>`
  - [ ] Success page shows
  - [ ] Green checkmark icon
  - [ ] Confirmation message
  - [ ] "Manage Email Preferences" button
  - [ ] "Go to Homepage" button

- [ ] **Without Token**
  - [ ] Navigate to `/unsubscribe` (no token)
  - [ ] Error page shows
  - [ ] Red mail icon
  - [ ] "Invalid Link" message
  - [ ] Link to preferences page

- [ ] **With Invalid Token**
  - [ ] Navigate to `/unsubscribe?token=invalid-token-123`
  - [ ] "Link Not Found" message
  - [ ] Appropriate error state

### Email Templates (Visual Check)

- [ ] **Footer Links**
  - [ ] All emails include footer with:
    - [ ] "Email Preferences" link
    - [ ] "Support" link
    - [ ] "Unsubscribe" link (when applicable)
  - [ ] Links styled correctly
  - [ ] Separator pipes (|) between links

---

## Phase 10: Rate Limiting Testing

### Without Redis (Development)

- [ ] **Server Startup**
  - [ ] No rate limiting errors on startup
  - [ ] Warning message: "Rate limiting disabled" (optional)
  - [ ] Application functions normally

- [ ] **API Requests**
  - [ ] All API requests work
  - [ ] No 429 errors unexpectedly
  - [ ] No rate limit headers in response

### With Redis (Optional - Production)

- [ ] **Setup Upstash**
  - [ ] Create Upstash account
  - [ ] Create Redis database
  - [ ] Add env vars to `.env.local`:
    ```
    UPSTASH_REDIS_REST_URL=https://...
    UPSTASH_REDIS_REST_TOKEN=...
    ```
  - [ ] Restart dev server

- [ ] **Auth Rate Limit (5 per 15min)**
  ```bash
  for i in {1..6}; do
    curl -X POST http://localhost:3000/api/auth/signup \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"test$i@test.com\",\"password\":\"Test123!\",\"name\":\"Test\"}"
  done
  ```
  - [ ] Requests 1-5 succeed (201 status)
  - [ ] Request 6 fails with 429 status
  - [ ] Error message: "Rate limit exceeded"
  - [ ] `retryAfter` seconds included in response
  - [ ] Rate limit headers present:
    - `X-RateLimit-Limit`
    - `X-RateLimit-Remaining`
    - `X-RateLimit-Reset`
    - `Retry-After`

- [ ] **API Rate Limit (100 per min)**
  ```bash
  # Login first, then make 100+ rapid order list requests
  for i in {1..101}; do
    curl http://localhost:3000/api/orders \
      -H "Cookie: <session-cookie>"
  done
  ```
  - [ ] Requests 1-100 succeed
  - [ ] Request 101 fails with 429

- [ ] **Upstash Dashboard**
  - [ ] Login to Upstash console
  - [ ] View database stats
  - [ ] See request counts
  - [ ] Analytics data present (if enabled)

### Security Headers

- [ ] **Response Headers**
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-XSS-Protection: 1; mode=block`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`

---

## General Testing

### Browser Compatibility
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari

### Console Checks
- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] No network errors (4xx/5xx)
- [ ] No CORS errors

### Performance
- [ ] Lighthouse score >90 (Performance)
- [ ] No memory leaks (check DevTools)
- [ ] Fast page transitions

### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader friendly
- [ ] Color contrast meets WCAG standards
- [ ] Focus indicators visible

---

## Known Issues / Expected Behavior

### Analytics with No Data
- If database is empty or has no orders/users:
  - Charts show "No data for this period"
  - Tables show empty states
  - Cohort analysis shows "Not enough data" message
  - **This is expected behavior**

### Email Preferences Without Migration
- Email preference page loads
- Toggles work in UI
- **BUT**: Database updates will fail until migration runs
  ```bash
  npx prisma migrate dev --name add_email_preferences
  ```

### Rate Limiting Without Redis
- All rate limit checks pass
- No 429 errors ever returned
- **This is expected behavior** (graceful degradation)

---

## Bug Reporting Template

If you find issues, report with:

```markdown
**Page/Feature**: [e.g., Advanced Analytics - Cohort Table]
**Issue**: [Brief description]
**Steps to Reproduce**:
1. Navigate to...
2. Click on...
3. Observe...

**Expected**: [What should happen]
**Actual**: [What actually happens]
**Browser**: [Chrome/Firefox/Safari + version]
**Console Errors**: [Any errors from DevTools console]
**Screenshot**: [If applicable]
```

---

## Success Criteria

All features are working if:
- ✅ Analytics page loads without errors
- ✅ All 6 insight sections render
- ✅ Email preferences page functional
- ✅ Unsubscribe flow works
- ✅ Rate limiting applies (when Redis configured)
- ✅ No console errors
- ✅ Mobile responsive
- ✅ Fast performance (<2s page loads)

---

## Next Steps After Testing

1. **If all tests pass**:
   - ✅ Mark Phase 8, 9, 10 as production-ready
   - Deploy to staging/production
   - Run migration for email preferences
   - Set up Upstash Redis for production

2. **If issues found**:
   - Document bugs using template above
   - Prioritize by severity
   - Fix critical issues before deployment

3. **Production Deployment Checklist**:
   - [ ] Run `npm run build` locally (check for errors)
   - [ ] Test build with `npm start`
   - [ ] Add Upstash env vars to Vercel
   - [ ] Run database migration on production DB
   - [ ] Monitor error tracking (Sentry)
   - [ ] Check analytics in Upstash dashboard
