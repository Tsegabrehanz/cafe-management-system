# Cafe Management System

A full-stack point-of-sale app for a small café, built from scratch with the same feature set as the
BTech Days tutorial series:

- **Backend:** Spring Boot 3.3 (Java 17+), Spring Security with JWT, Spring Data JPA, MySQL, OpenPDF, Spring Mail
- **Frontend:** Angular 18 (standalone components, signals) + Angular Material 3

## Features

| Area | What it does |
|---|---|
| Sign up / approval | Anyone can sign up; the account stays *pending* until an admin approves it. All admins are notified by email when a user is approved or disabled. |
| Login | JWT (HS256, 10 h). Disabling a user revokes access immediately, even with a valid token. |
| Forgot / change password | Forgot password emails a random **temporary** password; change password requires the current one. |
| Categories (admin) | Add, edit, delete (blocked while the category still has products), filter, sort, paginate. |
| Products (admin) | Add, edit, delete, toggle availability. |
| Orders (all staff) | Enter customer details, pick category → product → quantity, build a cart, submit → bill PDF downloads. |
| Bills | Staff see their own bills, admins see all. View details, re-download PDF, admin can delete. |
| Dashboard | Counts of categories, products, bills, new online orders (and staff accounts for admins). |
| **Online ordering (customers)** | Public page `/online/menu` — no account needed. Customers browse the live menu, build a cart, choose **pickup or delivery**, and get a tracking code. `/online/track/<code>` shows live progress (Received → Preparing → Ready / On the way → Done). |
| **Online Orders (staff)** | New sidebar page with a badge for new orders. Accept → Ready → Complete, or Cancel. Completing asks for the payment method and creates a normal bill (PDF). Refreshes every 20 s. |

### Deliberate improvements over the tutorial
- **Passwords are BCrypt-hashed.** The tutorial stored plain text and emailed the old password back; this emails a temporary one instead.
- **Prices come from the database.** The order page only sends product IDs and quantities, so a tampered request can't change the bill total.
- **Forgot password doesn't reveal** whether an email is registered.
- **Online orders are protected against abuse:** prices are computed on the server, at most 30 lines and 50 of one item per order, and 5 orders per IP per 10 minutes (`app.online-order.*`). Tracking shows only the first name, never phone or address.
- **Role checks are enforced server-side** with `@PreAuthorize`, not just hidden in the UI.
- PDFs are generated on demand from the stored bill, so nothing is written to disk.
- Uses **OpenPDF** (LGPL/MPL) instead of iText 5 (AGPL).

## Project layout

```
cafe-management-system/
├── build-and-run.sh            # build everything and run on http://localhost:8081
├── start-backend.sh / start-frontend.sh / reset-database.sh   # development mode
├── database/cafe-mysql.sql    # MySQL schema + sample menu
├── docker-compose.yml          # local MySQL (optional)
├── backend/                    # Spring Boot API  (port 8081)
│   └── src/main/java/com/cafe/
│       ├── config/             # admin + sample-menu seeders
│       ├── controller/         # /user /category /product /bill /dashboard
│       ├── dto/                # request/response records
│       ├── entity/             # User, Category, Product, Bill
│       ├── exception/          # ApiException + global handler
│       ├── repository/
│       ├── security/           # JWT service + filter, SecurityConfig
│       └── service/            # business logic, email, PDF
└── frontend/                   # Angular app      (port 4200)
    └── src/app/
        ├── core/               # API service, auth, interceptor, guards, models
        ├── layout/             # toolbar + sidenav shell, change-password dialog
        ├── pages/              # home, dashboard, category, product, order, bill, user
        └── shared/             # footer, confirm dialog, validators
```

## Running it locally

**Prerequisites:** JDK 17+, Maven 3.6.3+, Node 20 (via nvm). MySQL 8 is optional.
On Ubuntu:
```bash
sudo apt install -y openjdk-17-jdk maven
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && source ~/.bashrc && nvm install 20
```

### Easiest: one command, one address
```bash
./build-and-run.sh            # builds frontend + backend, then starts everything
```
Open **http://localhost:8081** (customers: **http://localhost:8081/online/menu**). Stop with Ctrl+C.
Next time, start without rebuilding: `./build-and-run.sh --no-build`. With MySQL: `./build-and-run.sh mysql`.

### Development mode (two terminals, live reload)
```bash
./start-backend.sh      # terminal 1 — wait for "Started CafeApplication"
./start-frontend.sh     # terminal 2 — then open http://localhost:4200
```
Log in with **admin@cafe.com / admin123** and change the password from the account menu.

On first start the backend creates the admin account and a **sample menu** (5 categories, 15 products)
in a built-in database stored in `backend/data/` — no database installation needed.
Turn the sample menu off with `app.seed-sample-data=false`.

### Rebuild the database from scratch
Stop the backend, then:
```bash
./reset-database.sh           # built-in database
./reset-database.sh mysql     # MySQL: drops and recreates the "cafe" database
```
The admin account and sample menu are created again on the next start.

### Using MySQL instead
```bash
sudo mysql < database/cafe-mysql.sql   # creates database "cafe", user cafe/cafe123, tables and sample menu
./start-backend.sh mysql
```
`database/cafe-mysql.sql` documents the full schema. With Docker you can use `docker compose up -d` instead.

### Tests
```bash
cd backend && mvn test        # end-to-end API test on an in-memory database
```

## Configuration (environment variables)

| Variable | Default | Purpose |
|---|---|---|
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | local MySQL, cafe/cafe123 | Only with the `mysql` profile |
| `JWT_SECRET` | dev-only value | **Set this in production** — at least 32 bytes, e.g. `openssl rand -base64 48` |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | admin@cafe.com / admin123 | First admin, only used if no admin exists |
| `CORS_ORIGINS` | http://localhost:4200 | Comma-separated allowed origins |
| `FRONTEND_URL` | http://localhost:4200 | Login link in emails |
| `MAIL_ENABLED` | false | When false, emails are printed to the backend log |
| `MAIL_HOST` / `MAIL_PORT` | smtp.gmail.com / 587 | SMTP server |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | – | SMTP login. For Gmail use an **App Password** (Google Account → Security → 2-Step Verification → App passwords); "less secure apps" no longer exists. |

Currency on bills: `app.currency` in `application.properties` and `currency` in `environment.ts` (default EUR).

## API reference

All endpoints except signup, login and forgotPassword need `Authorization: Bearer <token>`.

| Method | Path | Role | Body / notes |
|---|---|---|---|
| POST | `/user/signup` | public | `{name, contactNumber, email, password}` |
| POST | `/user/login` | public | `{email, password}` → `{token, role, name}` |
| POST | `/user/forgotPassword` | public | `{email}` |
| GET | `/user/checkToken` | any | |
| GET | `/user/me` | any | |
| POST | `/user/changePassword` | any | `{oldPassword, newPassword}` |
| GET | `/user/get` | admin | staff accounts |
| POST | `/user/update` | admin | `{id, status}` approve / disable |
| POST | `/category/add` | admin | `{name}` |
| GET | `/category/get?filterValue=true` | any | `true` = only categories with available products |
| POST | `/category/update` | admin | `{id, name}` |
| DELETE | `/category/delete/{id}` | admin | |
| POST | `/product/add` | admin | `{name, categoryId, description, price}` |
| GET | `/product/get` | any | |
| POST | `/product/update` | admin | `{id, name, categoryId, description, price}` |
| DELETE | `/product/delete/{id}` | admin | |
| POST | `/product/updateStatus` | admin | `{id, status}` |
| GET | `/product/getByCategory/{id}` | any | available products only |
| GET | `/product/getById/{id}` | any | |
| POST | `/bill/generateReport` | any | `{name, email?, contactNumber?, paymentMethod, items:[{productId, quantity}]}` → `{uuid, total}` |
| GET | `/bill/getBills` | any | own bills; admin sees all |
| GET | `/bill/getPdf/{uuid}` | any | PDF download |
| DELETE | `/bill/delete/{id}` | admin | |
| GET | `/dashboard/details` | any | `{category, product, bill, user, pendingOnlineOrders}` |
| GET | `/public/menu` | public | categories with available products |
| POST | `/public/order` | public | `{customerName, contactNumber, email?, orderType: PICKUP\|DELIVERY, address?, note?, items:[{productId, quantity}]}` → `{code, total, status}`. Max 5 orders per IP per 10 min. |
| GET | `/public/order/{code}` | public | order status for tracking (no contact details) |
| GET | `/onlineOrder/get?status=` | any | staff queue; optional status filter |
| GET | `/onlineOrder/pendingCount` | any | `{count}` of new orders |
| POST | `/onlineOrder/updateStatus` | any | `{id, status, paymentMethod?}`; COMPLETED creates a bill |

## Production notes
- Set a strong `JWT_SECRET`, change the admin password, and restrict `CORS_ORIGINS`.
- Switch `spring.jpa.hibernate.ddl-auto` from `update` to `validate` and manage schema changes with Flyway or Liquibase.
- Build the frontend with `npm run build` and serve `dist/frontend/browser` from any static host; update `environment.ts` with the API URL.
