# Cloudinary Media Manager

A full-stack MERN (MongoDB, Express, React, Node.js) media management platform featuring secure image uploads, real-time previews, image replacements, Cloudinary asset destruction, and **TWO completely separate dashboards**:

1. **User Dashboard (`/dashboard`)**: Dedicated user workspace for uploading, storing, replacing, and managing personal images.
2. **Admin Dashboard (`/admin`)**: Administrative control panel for managing users, moderating all media assets, viewing analytics, and configuring system settings.

---

## 1. Authentication Flow

```
                      VISITOR
                         │
                         ▼
                   /login (or /register)
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
   [ User Login ]                   [ Admin Login ]
        │                                 │
   Check MongoDB                     Check MongoDB
   (User exists? Match pwd?)         (Admin exists? Role === 'admin'?)
        │                                 │
        ▼ (role: "user")                  ▼ (role: "admin")
   /dashboard                        /admin
   (User Dashboard)                  (Admin Dashboard)
```

### Flow Details:
1. **User Registration (`/register`)**:
   - Fields: Full Name, Email, Password, Confirm Password.
   - Public registration always sets `role: "user"`.
   - On success, redirects to User Login.
2. **User Login (`/login` with User Tab)**:
   - Validates email and password.
   - If email is not registered in MongoDB: returns `"Account not found. Please register first."`
   - On success, redirects to `/dashboard`.
3. **Admin Login (`/login` with Admin Tab)**:
   - Validates email and password.
   - Enforces `role === "admin"`. If a regular user tries to log in as admin, returns: `"Access denied. Admin account required."`
   - On success, redirects to `/admin`.
4. **Access Control & Route Protection**:
   - Unauthenticated visitors on `/dashboard` or `/admin` &rarr; redirected to `/login`.
   - Normal users attempting to access `/admin` &rarr; redirected to `/dashboard` with access denied notice.
   - Blocked accounts cannot log in and have API requests rejected with `"Your account has been blocked by the administrator."`

---

## 2. Seed / Create Admin Account

To create the first admin user securely from the command line:

```bash
cd backend
node scripts/createAdmin.js
```

Admin credentials can be customized via `.env` (`ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`) or default to:
- **Email**: `cloudinary@gmail.com`
- **Password**: `Cloudinary@123`
- **Role**: `admin`

---

## 3. Technology Stack

### Frontend:
- **React.js (v18)** - UI components and view routing
- **Vite** - High-speed build tool and dev server
- **Axios** - HTTP client with request & response interceptors
- **Tailwind CSS** - Modern, utility-first styling
- **Lucide React** - Clean icons

### Backend:
- **Node.js & Express.js** - RESTful API framework
- **MongoDB & Mongoose** - Document database & user-scoped queries
- **Multer & multer-storage-cloudinary** - Direct multipart streaming to Cloudinary
- **jsonwebtoken (JWT)** - Stateless authentication
- **bcryptjs** - Password hashing
- **dotenv & cors** - Configuration & CORS handling

### Cloud Storage:
- **Cloudinary** - Scalable cloud media storage and optimization

---

## 4. Project Structure

```
cloudinary-media-manager/
│
├── backend/
│   ├── config/
│   │   ├── cloudinary.js         # Cloudinary SDK configuration
│   │   └── db.js                 # MongoDB connection handler
│   ├── controllers/
│   │   ├── adminController.js    # Admin dashboard, users, images, analytics, settings
│   │   ├── authController.js     # User registration and dual-type login controllers
│   │   └── uploadController.js   # User-scoped upload, replace, and delete logic
│   ├── middleware/
│   │   ├── adminMiddleware.js    # Admin role verification (403 guard)
│   │   ├── authMiddleware.js     # JWT verification & blocked check
│   │   └── upload.js             # Multer Cloudinary storage & 5MB validation
│   ├── models/
│   │   ├── Image.js              # Image metadata schema with uploadedBy user reference
│   │   ├── Setting.js            # System settings schema
│   │   └── User.js               # User schema with role ('user' | 'admin') & isBlocked
│   ├── routes/
│   │   ├── adminRoutes.js        # Admin endpoints (/api/admin)
│   │   ├── authRoutes.js         # Auth endpoints (/api/auth)
│   │   └── uploadRoutes.js       # Media endpoints (/api/upload)
│   ├── scripts/
│   │   └── createAdmin.js        # Standalone admin creation CLI script
│   ├── .env.example              # Backend environment template
│   ├── package.json              # Backend dependencies and scripts
│   └── server.js                 # Express application entry point
│
├── frontend/
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/            # Admin Dashboard Subsystem
│   │   │   │   ├── AdminAnalytics.jsx
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminImages.jsx
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   ├── AdminSettings.jsx
│   │   │   │   └── AdminUsers.jsx
│   │   │   ├── auth/             # Authentication Pages
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── RegisterPage.jsx
│   │   │   ├── user/             # User Dashboard Subsystem
│   │   │   │   └── UserDashboard.jsx
│   │   │   ├── ImageGallery.jsx  # Media cards, copy URL, replace & delete modals
│   │   │   ├── ImageUpload.jsx   # Drag & drop upload card with progress bar
│   │   │   └── Navbar.jsx        # Top navigation header
│   │   ├── services/
│   │   │   └── api.js            # Axios service layer (uploadApi, adminApi, authApi)
│   │   ├── App.jsx               # Main application router and auth state
│   │   ├── index.css             # Tailwind directives and custom styles
│   │   └── main.jsx              # React DOM entry point
│   ├── .env.example              # Frontend environment template
│   ├── index.html                # HTML entry point
│   ├── package.json              # Frontend dependencies and scripts
│   ├── postcss.config.js         # PostCSS configuration
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   └── vite.config.js            # Vite configuration
│
├── .gitignore                    # Secrets and build artifact exclusions
└── README.md                     # Project documentation
```

---

## 5. API Endpoints

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Payload |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user (`role: "user"`) | `{ name, email, password }` |
| `POST` | `/api/auth/login` | Login user or admin | `{ email, password, loginType: "user" \| "admin" }` |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Header: `Authorization: Bearer <token>` |

### User Media Endpoints (`/api/upload`) — Protected (Scoped to authenticated user)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload image to Cloudinary (assigned to logged in user) |
| `GET` | `/api/upload` | List only images uploaded by the current user |
| `GET` | `/api/upload/:id` | View user's own image metadata |
| `PUT` | `/api/upload/:id` | Replace user's own image (destroys old Cloudinary asset) |
| `DELETE` | `/api/upload/:id` | Delete user's own image (destroys from Cloudinary & DB) |

### Admin Endpoints (`/api/admin`) — Protected (`protect` + `adminOnly`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Global summary metrics (users, images, storage, today's uploads) |
| `GET` | `/api/admin/users` | List all users with search (`?search=`) and filters (`?role=&status=`) |
| `GET` | `/api/admin/users/:id` | View specific user profile and their uploaded images |
| `PUT` | `/api/admin/users/:id/block` | Block user account (`isBlocked: true`) |
| `PUT` | `/api/admin/users/:id/unblock` | Unblock user account (`isBlocked: false`) |
| `PUT` | `/api/admin/users/:id/role` | Change user role (`user` &harr; `admin`) |
| `DELETE` | `/api/admin/users/:id` | Delete user and destroy all their Cloudinary images |
| `GET` | `/api/admin/images` | Global image list with populated uploader, search & filters |
| `DELETE` | `/api/admin/images/:id` | Delete any image from Cloudinary and MongoDB |
| `GET` | `/api/admin/analytics` | Uploads per day, registrations growth, format distribution |
| `GET` | `/api/admin/settings` | Get system settings |
| `PUT` | `/api/admin/settings` | Update system settings |

---

## 6. How to Run

### 1. Start Backend Server:
```bash
cd backend
npm install
npm run dev
# Server running on http://localhost:5000
```

### 2. Start Frontend Application:
```bash
cd frontend
npm install
npm run dev
# Application running on http://localhost:5173
```

---

## License

This project is open-source and available under the [ISC License](LICENSE).
