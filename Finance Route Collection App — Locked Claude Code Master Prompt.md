# FINANCE ROUTE COLLECTION & LENDING MANAGEMENT APP
## Production-Ready Full-Stack Android Application
## Locked Master Prompt for Claude Code

You are acting as a senior full-stack architect, product engineer, database architect, Android engineer, DevOps engineer, security engineer, QA engineer, and technical project manager.

Your job is to design, build, test, configure, deploy, and document a production-ready finance route collection application.

This is NOT a generic expense tracker.

This application is for a business that lends money to customers/dealers and collects repayment amounts, including interest, according to collection routes and recurring collection cycles.

The most important real-world workflow is:

**Route → Customer → Expected Collection → Paid / Due / Partial → Promise Date & Time → Reminder → Payment → Next Collection Cycle**

The application must be designed around this workflow.

---

# 1. VERY IMPORTANT — START WITH SETUP & REQUIREMENTS, NOT CODE

Before creating the application, DO NOT immediately start writing the complete codebase.

First perform a:

# PROJECT INITIALIZATION & REQUIREMENTS CHECK

Your first response must:

1. Understand the complete application requirements.
2. Identify all required external accounts/services.
3. Identify all required credentials/configuration.
4. Identify anything that must be created manually by the developer.
5. Explain exactly how I can create each required account.
6. Ask me to provide/configure the required credentials.
7. Verify that the required services are accessible.
8. Create a clear environment/configuration plan.
9. Only after the setup requirements are confirmed should implementation begin.

Do not repeatedly ask questions that are already answered in this specification.

If something is genuinely missing, ask only the necessary questions.

---

# 2. REQUIRED EXTERNAL SERVICES

The application is intended to use:

## Frontend / Backend Hosting

Vercel

## Database

Neon PostgreSQL

## ORM

Drizzle ORM

## Source Control

GitHub

## Android

Capacitor + Android

## Android Distribution

Google Play Console when the application is ready for production distribution.

For direct testing/distribution, also generate a signed APK when possible.

---

# 3. INITIAL ACCOUNT & CREDENTIAL SETUP

At the beginning of the project, create a checklist like:

## Required

- GitHub account/repository
- Vercel account/project
- Vercel deployment credentials/token if required for CLI automation
- Neon account/database
- Neon database connection string
- Authentication configuration
- Android development environment
- Android signing configuration
- Google Play Console account if Play Store publishing is required
- Any required notification configuration

Do NOT assume these already exist.

---

# 4. VERCEL SETUP

If Vercel is not already configured:

Explain to me:

1. How to create a Vercel account.
2. How to create/import the project.
3. How to connect the GitHub repository.
4. How to obtain/configure the required Vercel token or authentication for CLI deployment.
5. Where the token should be stored.
6. Which environment variables need to be configured in Vercel.
7. How to connect the production domain later.

If a Vercel token is required for automated deployment:

Ask me to create it and configure it securely.

NEVER:

- hardcode the Vercel token
- commit it to Git
- put it inside frontend JavaScript
- put it inside the Android APK
- expose it in public environment variables

Use secure environment configuration.

---

# 5. NEON DATABASE SETUP

If Neon is not configured:

Explain:

1. How to create the Neon account.
2. How to create the PostgreSQL project/database.
3. How to obtain the database connection string.
4. How to configure it locally.
5. How to configure it in Vercel.
6. How development and production databases should be separated.

Use:

Development database

and

Production database

as separate environments whenever practical.

Never use real customer financial data for development testing.

The database connection string must NEVER be exposed to the frontend.

---

# 6. DATABASE CREDENTIAL SECURITY

All secrets must be stored through environment variables or secure secret storage.

Examples:

DATABASE_URL

AUTH_SECRET

VERCEL_TOKEN

OTHER_PRIVATE_KEYS

Never commit:

.env

.env.local

production credentials

private keys

Android signing keys

service account JSON

to GitHub.

Create:

.env.example

containing placeholders only.

---

# 7. GOOGLE PLAY / ANDROID SETUP

Before production Android publishing, identify what is required.

Explain to me:

1. Android application/package name.
2. Application ID/package ID.
3. Android signing key/keystore.
4. Google Play Console account.
5. App listing information.
6. Privacy policy requirements.
7. App icon requirements.
8. Screenshots.
9. Release AAB.
10. Play Store release configuration.

If Google Play Console credentials or service account access is needed for automated deployment, explain exactly what I need to create.

Never ask me to paste private passwords into source code.

Never commit:

- keystore files
- keystore passwords
- Google service-account private keys
- Play Store credentials

---

# 8. ANDROID APPLICATION STRATEGY

Use:

Next.js + TypeScript + Capacitor + Android.

The web application will be the main application codebase.

Capacitor will package the application for Android.

Architecture:

Android App
↓
Capacitor
↓
Next.js Application
↓
Vercel
↓
API / Server Logic
↓
Neon PostgreSQL

The Android application must NOT connect directly to Neon.

---

# 9. PRODUCTION ARCHITECTURE

Use this architecture:

```text
                    ANDROID USER
                         |
                         v
                Capacitor Android App
                         |
                         | HTTPS
                         v
                      Vercel
              +----------+----------+
              |                     |
         Next.js UI            API / Logic
                                    |
                                    v
                              Neon PostgreSQL
                                    |
               +--------------------+--------------------+
               |                    |                    |
           Customers             Routes              Payments
               |                    |                    |
               +--------------------+--------------------+
                                    |
                              Collections
                                    |
                                Reminders
```

---

# 10. CORE BUSINESS CONCEPT

The business operates using collection routes.

There are 7 days:

- Sunday
- Monday
- Tuesday
- Wednesday
- Thursday
- Friday
- Saturday

Each day can have multiple routes.

Example:

Sunday:
- Route 1
- Route 2

Monday:
- Route 1
- Route 2
- Route 3

Routes must be database-driven.

Never hardcode routes.

---

# 11. PRIMARY USER FLOW

The application must optimize this exact workflow:

```text
Open App
↓
Today's Dashboard
↓
Select Today's Route
↓
See Customers
↓
Open Customer
↓
See Expected Amount
↓
PAID / DUE / PARTIAL
↓
If Due:
    Promise Date
    Promise Time
    Notes
↓
Schedule Reminder
↓
Notification
↓
Customer Pays
↓
Record Payment
↓
Calculate Next Collection
```

This is the highest-priority workflow.

---

# 12. DASHBOARD

Show:

- Today's date
- Day
- Today's routes
- Total customers
- Expected collection
- Collected amount
- Pending amount
- Paid count
- Due count
- Partial count
- Overdue count

Example:

Sunday

Expected: ₹25,000
Collected: ₹18,500
Pending: ₹6,500

Customers:
12 Total
8 Paid
3 Due
1 Partial

---

# 13. ROUTES

Route fields:

- ID
- Name
- Day of week
- Route order
- Description
- Active/inactive
- Created timestamp
- Updated timestamp

Allow:

- Create
- Edit
- Activate/deactivate
- View customers
- View today's expected amount
- View collected amount
- View pending amount

---

# 14. CUSTOMERS

Customer fields:

## Basic

- Customer ID
- Customer code
- Full name
- Mobile
- Alternative mobile
- Address
- Area
- Notes
- Active/inactive

## Route

- Route
- Day
- Route order/customer sequence

## Finance

- Principal amount
- Interest amount
- Total repayment
- Expected collection amount
- Collection cycle
- Start date
- Outstanding amount

Financial amounts must be manually editable.

Do not force an automatic interest calculation model.

---

# 15. COLLECTION CYCLES

Support:

- 5 days
- 7 days
- 10 days
- Custom number of days

Example:

7-day:

Sunday
→ next Sunday
→ next Sunday

5-day:

Sunday
→ Friday
→ Wednesday

10-day:

Sunday
→ Wednesday
→ Saturday

Calculate using actual dates.

Do not hardcode weekday behavior.

Allow manual override of next collection date.

---

# 16. COLLECTION SCHEDULE

Create a collection schedule/event system.

Each expected collection should have:

- ID
- Customer ID
- Route ID
- Scheduled date
- Expected amount
- Cycle number
- Status
- Created timestamp
- Updated timestamp

Statuses:

- Pending
- Paid
- Partial
- Due
- Rescheduled
- Cancelled
- Overdue

Do not overwrite historical collection events.

---

# 17. TODAY'S ROUTE SCREEN

When the user opens:

Sunday → Route 1

Show:

Customer name

Expected amount

Current status

Next collection

Last payment

Promised payment

Buttons:

**PAID**

**DUE**

**PARTIAL**

Make this screen extremely fast.

---

# 18. COLLECTION MODE

Create a special fast collection mode.

Example:

Sunday → Route 1

Customer 1

[PAID] [DUE] [PARTIAL]

After saving the result:

Automatically move to the next customer.

Allow previous/next navigation.

The user should be able to complete route collection with minimal taps.

---

# 19. PAID FLOW

When user clicks PAID:

Show:

- Amount collected
- Date
- Time
- Payment method
- Notes

Payment methods:

- Cash
- UPI
- Bank transfer
- Other

Default amount:

Today's expected amount.

But allow manual modification.

After saving:

- Mark collection as paid.
- Create payment transaction.
- Update route totals.
- Update dashboard totals.
- Update customer outstanding.
- Generate next expected collection based on cycle.

---

# 20. DUE FLOW

If customer does not pay:

Click DUE.

Allow:

- Reason
- Promised date
- Promised time
- Promised amount
- Notes

Example:

Customer says:

"I will pay Wednesday at 5 PM."

Save:

Wednesday
5:00 PM

Create payment promise.

Create reminder.

---

# 21. PAYMENT PROMISE

A promise is NOT a payment.

Keep it separate.

Example:

Expected:

₹1,500

Status:

Due

Promise:

Wednesday
5:00 PM

Only when money is actually received should a payment transaction be created.

---

# 22. REMINDER SYSTEM

When a customer promises payment:

Create reminder.

Support:

- Exact date
- Exact time
- Reminder before payment
- Exact-time reminder

Options:

- 15 minutes before
- 30 minutes before
- 1 hour before
- Exact time

Default:

15 minutes before.

Make configurable.

---

# 23. ANDROID NOTIFICATIONS

Use Capacitor Local Notifications.

Implement:

- Notification permission
- Schedule
- Cancel
- Reschedule
- Stable notification IDs
- Duplicate prevention
- Notification tap
- Deep link to customer

Example:

"Payment Reminder

Ravi promised ₹1,500 today at 5:00 PM."

Tapping notification should open Ravi's payment screen.

---

# 24. NOTIFICATION SYNCHRONIZATION

Database reminder and Android notification are two different things.

Implement synchronization.

When app opens/resumes:

1. Fetch upcoming reminders.
2. Compare with local scheduled notifications.
3. Schedule missing notifications.
4. Cancel obsolete notifications.
5. Update changed reminders.
6. Prevent duplicates.

If a promise date changes:

Old notification:
CANCEL

New notification:
SCHEDULE

If payment is completed:

Related pending reminder:
CANCEL

---

# 25. RECURRING ROUTE COLLECTION

The app must separately manage:

### Regular collection schedule

Example:

Ravi
Sunday Route 1
7-day cycle

AND

### One-time payment promise

Example:

Sunday collection missed.

Customer promises:

Wednesday 5 PM.

Both must be stored separately.

---

# 26. UPCOMING COLLECTIONS

Provide:

- Today
- Tomorrow
- Next 7 Days
- Custom date range

Group by:

Date
→ Route
→ Customer

Example:

Sunday
Route 1
- Ravi
- Kumar

Route 2
- Mani
- Bala

Monday
Route 1
- Arun
- Raj

---

# 27. NEXT 7 DAYS FILTER

Prominent filter:

NEXT 7 DAYS

Show all expected customers.

Filters:

- Date
- Route
- Customer
- Status
- Cycle
- Paid
- Due
- Partial
- Overdue

---

# 28. CUSTOMER DETAILS

Show:

## Profile

Name
Phone
Address
Route

## Finance

Principal
Interest
Total repayment
Collected
Outstanding
Expected collection

## Cycle

Cycle:
7 days

Next collection:
Date

## History

All previous collection events and payments.

---

# 29. PARTIAL PAYMENT

Example:

Expected:

₹1,500

Paid:

₹1,000

Remaining:

₹500

Status:

PARTIAL

Keep expected, paid and remaining amounts separately visible.

---

# 30. DUE / PENDING SCREEN

Show:

- Customer
- Route
- Expected amount
- Paid
- Remaining
- Promised date
- Promised time
- Overdue duration
- Contact
- Record payment

Sort by:

1. Most overdue
2. Promise date
3. Amount

---

# 31. SEARCH

Search by:

- Name
- Phone
- Customer ID
- Area
- Route

---

# 32. REPORTS

Implement:

## Daily

- Customers
- Expected
- Collected
- Pending
- Partial
- Collection percentage

## Route

- Customer count
- Expected
- Collected
- Pending

## Weekly

- Expected
- Collected
- Pending
- Outstanding
- Customer count

## Customer

- Principal
- Total repayment
- Collected
- Outstanding
- Payment history

---

# 33. DATABASE

Use PostgreSQL + Drizzle ORM.

Minimum tables:

## users

- id
- name
- email
- authentication reference
- created_at
- updated_at

## routes

- id
- name
- day_of_week
- route_order
- description
- is_active
- created_at
- updated_at

## customers

- id
- customer_code
- name
- phone
- alternate_phone
- address
- area
- route_id
- principal_amount
- interest_amount
- total_repayment_amount
- collection_amount
- cycle_days
- start_date
- is_active
- notes
- created_at
- updated_at

## collection_schedules

- id
- customer_id
- route_id
- scheduled_date
- expected_amount
- cycle_number
- status
- created_at
- updated_at

## payments

- id
- customer_id
- collection_schedule_id
- amount
- payment_date
- payment_time
- payment_method
- notes
- created_at
- updated_at

## payment_promises

- id
- customer_id
- collection_schedule_id
- promised_date
- promised_time
- promised_amount
- reason
- notes
- status
- created_at
- updated_at

## reminders

- id
- customer_id
- payment_promise_id
- scheduled_at
- reminder_type
- status
- notification_id
- created_at
- updated_at

## customer_notes

- id
- customer_id
- note
- created_at

Improve the schema if a better normalized architecture is required.

---

# 34. DATABASE SAFETY

Use:

- Primary keys
- Foreign keys
- Constraints
- Indexes
- Unique constraints
- NOT NULL where appropriate

Index:

- route
- scheduled_date
- phone
- customer
- status
- reminder date

Use migrations.

Never manually modify production schema without a migration.

---

# 35. DEVELOPMENT AND PRODUCTION DATABASE

Use separate environments.

Development:

Test data only.

Production:

Real financial data.

Never run destructive development tests against production.

---

# 36. OFFLINE SUPPORT

Because the application is used while travelling:

Support:

- Cached today's routes
- Cached customer details
- Offline indication
- Safe local queue where practical
- Synchronization after reconnect

For financial operations:

Never silently lose a payment.

Offline payment should have a synchronization state.

Prevent duplicate payment creation during retry.

---

# 37. AUTHENTICATION & SECURITY

Implement secure authentication.

Protect all business data.

Never expose:

- DATABASE_URL
- Vercel tokens
- Private keys
- Authentication secrets
- Android signing credentials

to the frontend.

Use server-side authorization.

Validate all financial operations server-side.

Use Zod or equivalent validation.

---

# 38. UI / UX

Mobile-first.

Professional finance application.

Prioritize:

- Fast navigation
- Large touch targets
- Minimal typing
- Clear amounts
- Clear status
- One-hand usage
- Fast Paid/Due actions

Include:

- Loading states
- Skeleton states
- Empty states
- Error states
- Confirmation states

---

# 39. MAIN NAVIGATION

Use:

- Dashboard
- Today's Routes
- Routes
- Customers
- Collections
- Due
- Reminders
- Reports
- Settings

On mobile use a suitable bottom navigation.

---

# 40. ADD CUSTOMER FLOW

Make it fast.

Step 1:
Basic information

Step 2:
Route

Step 3:
Finance

Step 4:
Cycle

Step 5:
Review

Save.

Automatically create first collection schedule.

---

# 41. SETTINGS

Include:

- Business name
- Currency
- Timezone
- Default reminder timing
- Notification settings
- Default payment method
- Export
- Logout

Default:

INR ₹

Timezone:

Asia/Kolkata

---

# 42. EXPORT

Support CSV export:

- Customers
- Payments
- Collections
- Due customers

---

# 43. MULTI-BUSINESS / FUTURE SCALABILITY

Even if V1 has one business owner, design the architecture so multi-business support can be added later.

Consider:

business_id

user_id

and appropriate ownership relationships.

Do not over-engineer V1.

---

# 44. AUDIT LOG

Because this is financial data, design for future auditability.

Important changes should eventually be traceable:

- Who changed
- What changed
- Old value
- New value
- Timestamp

At minimum, do not silently overwrite historical payment transactions.

---

# 45. PROJECT STRUCTURE

Use a clean architecture.

Example:

```text
app/
components/
lib/
db/
tests/
public/
capacitor/
docs/

.env.example
.gitignore
package.json
README.md
```

Possible:

```text
lib/
  db/
  auth/
  notifications/
  calculations/
  validation/
  utils/
```

Do not create giant files.

---

# 46. DOCUMENTATION

Create:

```text
docs/
  architecture.md
  database.md
  environment.md
  deployment.md
  android-build.md
  notifications.md
  maintenance.md
  troubleshooting.md
```

README must explain:

- Local setup
- Database setup
- Environment variables
- Migrations
- Development
- Testing
- Production build
- Vercel deployment
- Android build
- Release process

---

# 47. GIT / GITHUB

Use GitHub as the source of truth.

Recommended flow:

```text
feature branch
↓
test
↓
pull/merge
↓
main
↓
Vercel production
```

Do not commit secrets.

Ensure `.gitignore` includes sensitive files.

---

# 48. DEVELOPMENT PHASES

Do not build everything blindly in one step.

## PHASE 0 — PROJECT SETUP

Before code:

- Verify requirements.
- Verify accounts.
- Verify credentials.
- Verify GitHub.
- Verify Vercel.
- Verify Neon.
- Verify Android environment.
- Verify signing strategy.
- Verify Google Play requirements.

Create a setup checklist.

STOP and ask me only for missing setup items.

---

## PHASE 1 — ARCHITECTURE

Create:

- System architecture
- Database ERD
- Database schema
- User flow
- Notification architecture
- Android architecture
- Deployment architecture

Then implement.

---

## PHASE 2 — FOUNDATION

Implement:

- Next.js
- TypeScript
- Tailwind
- UI system
- Database
- Drizzle
- Migrations
- Authentication
- Layout
- Navigation

---

## PHASE 3 — ROUTES

Implement route management.

---

## PHASE 4 — CUSTOMERS

Implement customer management.

---

## PHASE 5 — COLLECTION ENGINE

Implement:

- Collection schedules
- Today's collections
- Upcoming
- Next 7 days
- Paid
- Due
- Partial
- Reschedule

---

## PHASE 6 — PAYMENTS

Implement:

- Transactions
- History
- Outstanding
- Reports

---

## PHASE 7 — REMINDERS

Implement:

- Promise dates
- Promise times
- Local Android notifications
- Synchronization
- Deep links

---

## PHASE 8 — DASHBOARD & REPORTS

Implement dashboard and reports.

---

## PHASE 9 — OFFLINE SUPPORT

Implement safe offline handling.

---

## PHASE 10 — TESTING

Test all critical business logic.

---

## PHASE 11 — PRODUCTION DEPLOYMENT

Prepare:

- Production environment
- Neon production database
- Database migrations
- Vercel production
- Domain
- Android production build
- APK
- AAB
- Signing
- Play Store preparation

---

# 49. DEPLOYMENT AUTOMATION

The final project must have a repeatable deployment process.

Target workflow:

```text
Developer changes code
↓
GitHub
↓
Vercel
↓
Production
```

Database:

```text
Schema change
↓
Drizzle migration
↓
Production migration
↓
Neon
```

Android:

```text
Code
↓
Capacitor sync
↓
Android build
↓
Signed APK/AAB
↓
Distribution
```

Document every step.

---

# 50. VERCEL DEPLOYMENT

Configure:

- GitHub integration
- Production project
- Environment variables
- Build configuration
- Domain
- Production URL

If CLI deployment is used:

Use a secure Vercel token.

Never expose the token.

At the end, verify:

- Build succeeds
- Application loads
- API works
- Database works
- Authentication works
- Production environment variables work

---

# 51. NEON DEPLOYMENT

Configure:

Development database.

Production database.

Run migrations.

Verify:

- Connection
- Tables
- Indexes
- Constraints
- Application queries
- Production data access

Never expose Neon credentials to the client.

---

# 52. ANDROID BUILD

Configure:

- Application ID
- App name
- Version
- Version code
- Icon
- Splash screen
- Capacitor
- Android permissions
- Notification permission
- Signing configuration

Build:

## Debug APK

For development.

## Release APK

For direct installation/testing.

## Release AAB

For Google Play Store.

---

# 53. APK DELIVERY

At the end of a successful release build:

Generate the APK.

Clearly report:

- APK filename
- APK version
- Build type
- Exact local file path

Example:

```text
android/app/build/outputs/apk/release/app-release.apk
```

If the development environment supports exposing generated files to me, make the release APK available for download.

Do not claim that an APK was generated unless the build actually succeeded.

---

# 54. GOOGLE PLAY DEPLOYMENT

If I request Play Store deployment:

First verify:

- Google Play Console access
- App/package ID
- Signing configuration
- Release AAB
- App metadata
- Privacy policy
- Screenshots
- Icon
- Required declarations

Do not pretend to publish if the required Play Console access is unavailable.

If automation is technically possible through configured credentials, perform the deployment.

Otherwise provide the exact remaining manual steps.

---

# 55. PRODUCTION RELEASE CHECKLIST

Before calling the application production-ready, verify:

### Application

- Login works
- Dashboard works
- Routes work
- Customers work
- Collections work
- Payments work
- Due works
- Partial payment works
- Reminders work
- Reports work

### Database

- Production database connected
- Migrations completed
- Constraints valid
- Indexes valid

### Security

- Secrets not committed
- Production environment variables configured
- Authentication protected
- API protected

### Android

- APK builds
- Release APK works
- Notifications work
- Notification tap works
- Deep links work

### Deployment

- Vercel production works
- Production API works
- Database works
- Domain works

---

# 56. TESTING

Write tests for:

- 5-day cycle
- 7-day cycle
- 10-day cycle
- Custom cycle
- Route filtering
- Date calculation
- Payment
- Partial payment
- Due
- Reschedule
- Promise creation
- Reminder creation
- Reminder cancellation
- Duplicate prevention
- Outstanding calculation
- Next collection generation
- Timezone behavior

Timezone:

Asia/Kolkata

---

# 57. EDGE CASES

Handle:

- Overpayment
- Underpayment
- Late payment
- Early payment
- Multiple promises
- Promise changes
- Customer changes route
- Customer changes cycle
- Customer inactive
- Route inactive
- Duplicate API requests
- Network failure
- Offline payment
- Notification permission denied
- App reinstall
- Device timezone difference
- Notification rescheduling

---

# 58. IMPORTANT FINANCIAL RULE

Do not build an automatic interest calculation model unless explicitly requested.

This is primarily a:

**finance lending collection tracking application**

The business owner controls:

- Principal
- Interest
- Total repayment
- Expected collection
- Actual payment

Manual values must always be supported.

---

# 59. EXACT END-TO-END EXAMPLE

Customer:

Ravi

Route:

Sunday → Route 1

Principal:

₹10,000

Interest:

₹2,000

Total:

₹12,000

Collection:

₹1,500

Cycle:

7 days

Start:

Sunday

Sunday:

Ravi appears.

Expected:

₹1,500

Customer pays.

User selects:

PAID

Amount:

₹1,500

Method:

Cash

System:

- Creates payment
- Marks collection paid
- Updates totals
- Creates next collection

Next Sunday:

Ravi appears.

Customer doesn't pay.

User selects:

DUE

Promise:

Wednesday
5:00 PM

System:

- Marks collection due
- Creates payment promise
- Creates reminder

Wednesday:

Android notification appears.

User opens notification.

Ravi payment page opens.

Customer pays.

User records:

₹1,500

System:

- Creates payment
- Updates outstanding
- Marks promise completed
- Cancels reminder
- Calculates next collection

This complete flow must work.

---

# 60. CLAUDE CODE BEHAVIOR RULES

You must:

- Think through architecture before implementation.
- Ask for missing setup requirements at the beginning.
- Never invent credentials.
- Never invent account IDs.
- Never invent deployment success.
- Never claim a build succeeded if it failed.
- Never expose secrets.
- Never hardcode tokens.
- Never commit credentials.
- Never expose database credentials in the client.
- Never use production data for testing.
- Never silently modify historical financial transactions.
- Never hardcode route data.
- Never hardcode customer schedules.
- Use strict TypeScript.
- Avoid `any`.
- Use reusable components.
- Use server-side validation.
- Use migrations.
- Test business-critical logic.
- Keep documentation updated.

---

# 61. WHEN A CREDENTIAL / ACCOUNT IS REQUIRED

If you reach a point where a service requires an external account or credential that has not been configured:

DO NOT guess.

Instead:

1. Tell me which service is required.
2. Explain why it is required.
3. Give me exact steps to create it.
4. Tell me exactly what credential/configuration is needed.
5. Tell me where to configure it securely.
6. Continue only after the required setup is available.

Do not ask me to paste sensitive passwords into source files.

---

# 62. DEPLOYMENT COMPLETION

When I say:

"Deploy the app"

you must interpret that as:

1. Run tests.
2. Run production build.
3. Verify environment variables.
4. Verify database connectivity.
5. Apply required migrations safely.
6. Deploy to Vercel.
7. Verify production URL.
8. Verify critical API endpoints.
9. Build Android release.
10. Generate APK.
11. Generate AAB if configured.
12. Verify Android application.
13. Report exactly what succeeded and what failed.

Do not simply say:

"Deployment completed."

Provide a deployment report.

---

# 63. FINAL DEPLOYMENT REPORT

At completion provide:

## Web

Production URL:

[actual URL]

## Database

Production database:

Neon PostgreSQL

Migration status:

[actual status]

## Android

Version:

[actual version]

APK:

[actual path/file if generated]

AAB:

[actual path/file if generated]

## Build

Status:

SUCCESS / FAILED

## Tests

Passed:

[number]

Failed:

[number]

## Remaining Issues

[list]

---

# 64. MAINTENANCE DOCUMENTATION

Create a developer maintenance guide covering:

- How to run locally
- How to connect development database
- How to create migrations
- How to deploy database migrations
- How to deploy Vercel
- How to update environment variables
- How to build Android
- How to create APK
- How to create AAB
- How to update app version
- How to update Capacitor
- How to troubleshoot notifications
- How to troubleshoot database
- How to restore/recover
- How to export data
- How to release future versions

The goal is that I, as the developer, can maintain this application without needing to rebuild the architecture from scratch.

---

# 65. VERSIONING

Use semantic-style versioning:

Example:

V1.0.0

Feature:

V1.1.0

Bug fix:

V1.1.1

Android version code must also be incremented appropriately for each release.

Document the current version.

---

# 66. FINAL DEFINITION OF DONE

The project is complete only when:

- Application works locally.
- Development database works.
- Production database works.
- Authentication works.
- Routes work.
- Customers work.
- Cycles work.
- Collection schedules work.
- Paid works.
- Due works.
- Partial payment works.
- Promise dates work.
- Promise times work.
- Reminders work.
- Android notifications work.
- Notification tap works.
- Next collection works.
- Next 7 Days works.
- Due customers work.
- Reports work.
- Export works.
- Offline behavior is safe.
- Tests pass.
- Vercel production deployment works.
- Neon production database works.
- Android release build works.
- Release APK is generated.
- Release AAB is generated when Play Store setup is available.
- Deployment documentation is complete.
- Maintenance documentation is complete.
- No secrets are committed.
- No critical errors remain.

---

# 67. FINAL INSTRUCTION TO CLAUDE CODE

Build this as a real production application for real financial collection operations.

Do not treat this as a UI demo.

Do not generate fake functionality.

Do not use mock APIs where real database functionality is required.

Do not skip deployment architecture.

Do not skip Android packaging.

Do not skip notifications.

Do not skip database migrations.

Do not skip security.

Do not skip testing.

Do not skip documentation.

The final developer experience should be:

```text
1. Configure accounts
        ↓
2. Configure environment variables
        ↓
3. Run locally
        ↓
4. Test
        ↓
5. Push to GitHub
        ↓
6. Deploy to Vercel
        ↓
7. Apply Neon migrations
        ↓
8. Build Android
        ↓
9. Generate APK/AAB
        ↓
10. Install/test
        ↓
11. Release to user
        ↓
12. Maintain through GitHub + Vercel + Neon
```

The application must be designed so that future feature development is straightforward and the developer can continuously maintain and release new versions without manually rebuilding the entire infrastructure.

Start by giving me the **Project Initialization & Requirements Checklist**.

Do NOT start the complete implementation until the required external services, accounts, environment configuration, and deployment strategy have been identified and confirmed.