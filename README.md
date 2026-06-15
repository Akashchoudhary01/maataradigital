# LoanPro — Loan Management System

A full-stack production-ready microfinance loan management system built with the MERN stack.

## Tech Stack

**Backend:** Node.js · Express.js · MongoDB · Mongoose · JWT · Bcrypt · Multer · Cloudinary · node-cron  
**Frontend:** React.js · Redux Toolkit · React Router · Axios · Tailwind CSS · React Hook Form · Recharts

---

## Quick Start

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env        # Fill in your credentials
npm run seed                # Creates the admin account
npm run dev                 # Starts on port 5000

# Frontend (new terminal)
cd frontend
npm install
npm run dev                 # Starts on port 5173
```

### 2. Environment Variables

**backend/.env**
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/loan_management
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_EMAIL=admin@loanapp.com
ADMIN_PASSWORD=Admin@123456
FRONTEND_URL=http://localhost:5173
```

---

## Features

### Authentication
- JWT-based secure login
- Auto login via stored token
- Password hashing with bcrypt
- Rate-limited auth endpoints (20 req/15min)

### Borrower Management
- Create/edit/delete borrowers
- Upload Aadhaar front/back, PAN card, photo to Cloudinary
- Search by name, mobile, Aadhaar
- Paginated list with full profile view

### Loan Management
- Create loans with automatic EMI calculation (flat interest)
- Auto-generate full repayment schedule on loan creation
- Loan statuses: ACTIVE / COMPLETED / DEFAULTED
- Prevent duplicate active loans per borrower

### EMI Calculation (Flat Rate)
```
Total Interest    = Principal × (Rate/100) × Months
Total Payable     = Principal + Total Interest
Monthly EMI       = Total Payable ÷ Months
```
**Example:** ₹1,00,000 @ 2%/month × 12 months  
→ Interest: ₹24,000 | Total: ₹1,24,000 | EMI: ₹10,334/month

### Repayment Module
- View full installment schedule per loan
- Collect payment with one click (mark as PAID)
- Undo payment if needed
- Daily cron job auto-marks overdue installments

### Penalty System
- Add penalties to any installment
- Penalty increases totalDue on the installment
- Full penalty history maintained
- Loan remaining amount updates automatically

### Dashboard
- Real-time stats: borrowers, loans, collections
- Bar chart: monthly collections (last 6 months)
- Pie chart: loan status distribution
- Alerts for due-today and overdue installments
- Recent payments feed

### Reports & Export
- Collection, Loan, Penalty, Borrower reports
- Date range filters
- CSV export

### Notifications
- Auto-created for overdue and due-today (via cron)
- In-app notification bell with unread count
- Mark all as read

---

## API Reference

All routes (except login) require: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/me` | Get current admin |
| PUT | `/api/auth/change-password` | Change password |

### Borrowers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/borrowers` | List (search, pagination) |
| POST | `/api/borrowers` | Create (multipart/form-data) |
| GET | `/api/borrowers/:id` | Get profile + loans |
| PUT | `/api/borrowers/:id` | Update |
| DELETE | `/api/borrowers/:id` | Delete |

### Loans
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/loans` | List (filter by status) |
| POST | `/api/loans` | Create + auto-generate schedule |
| GET | `/api/loans/:id` | Get with repayments |
| PUT | `/api/loans/:id/status` | Update status |
| DELETE | `/api/loans/:id` | Delete (if no payments) |

### Repayments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/repayments` | List (filter by status/date) |
| PUT | `/api/repayments/:id/pay` | Mark as paid |
| PUT | `/api/repayments/:id/undo-pay` | Undo payment |
| POST | `/api/repayments/:id/penalty` | Add penalty |
| GET | `/api/repayments/:id/penalties` | Get penalty history |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Full analytics |
| GET | `/api/dashboard/notifications` | Get notifications |
| PUT | `/api/dashboard/notifications/mark-read` | Mark all read |
| GET | `/api/dashboard/reports` | Generate report |

---

## Production Deployment

### Backend (e.g. Railway, Render, DigitalOcean)
```bash
cd backend
npm install
NODE_ENV=production node src/app.js
```

### Frontend (e.g. Vercel, Netlify)
```bash
cd frontend
npm run build          # outputs to dist/
```
Set `VITE_API_URL` env var to your backend URL.

### MongoDB
Use MongoDB Atlas free tier for production. Update `MONGODB_URI` in backend `.env`.

### Cloudinary
Sign up at cloudinary.com (free tier: 25GB storage). Add cloud name, API key, secret to `.env`.

---

## Security Features
- Helmet (HTTP security headers)
- CORS (configured per environment)
- Rate limiting (200 req/15min general, 20 req/15min auth)
- JWT verification on every protected route
- Password hashing with bcrypt (12 rounds)
- MongoDB injection protection via Mongoose
- Input validation on all endpoints

---

## Default Admin Credentials
After running `npm run seed`:
- **Email:** admin@loanapp.com  
- **Password:** Admin@123456

⚠️ Change these immediately in production!
