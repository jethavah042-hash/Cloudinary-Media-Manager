# Cloudinary Media Manager

A full-stack MERN (MongoDB, Express, React, Node.js) media management and administrative platform featuring secure image uploads, real-time previews, image replacements, Cloudinary asset destruction, MongoDB document synchronization, and a complete **Role-Based Admin Panel**.

---

## 1. Project Overview

**Cloudinary Media Manager** is a production-grade cloud media dashboard and administrative system. Images are streamed directly to **Cloudinary** using Multer with strict validation (5MB maximum, allowed formats: JPG, JPEG, PNG, WEBP). Complete metadata and user attributions are synced with **MongoDB**.

An integrated **Admin Panel** provides superusers with global user management (blocking/unblocking, role changes, user deletion with cascading Cloudinary image destruction), global media moderation, upload analytics, and system settings.

---

## 2. Features

### User Features:
- **Direct Cloudinary Integration**: Stream files directly to Cloudinary storage using `cloudinary` v2 and `multer-storage-cloudinary`.
- **MongoDB Synchronization**: Stores image references and metadata (`imageUrl`, `cloudinaryPublicId`, format, file size, user reference) with Mongoose.
- **Complete Image Lifecycle**:
  - **Upload**: File validation &rarr; Instant client preview (`URL.createObjectURL`) &rarr; Cloudinary upload with progress tracking &rarr; MongoDB document creation.
  - **Replace**: Choose new file &rarr; Upload to Cloudinary &rarr; Delete old asset on Cloudinary via `public_id` &rarr; Update MongoDB record.
  - **Delete**: Confirmation modal &rarr; Delete asset from Cloudinary &rarr; Remove document from MongoDB.
  - **Copy URL**: One-click clipboard copy of the direct Cloudinary secure URL.
- **Strict File Validation**: Allowed formats (`JPG`, `JPEG`, `PNG`, `WEBP`) and maximum `5MB` size limit.
- **Authentication**: JWT-based user authentication (Register & Login) with `bcryptjs` password hashing.

### Admin Panel Features:
- **Dashboard Overview**: Summary metric cards (Total Users, Total Images, Total Storage in MB, Today's Uploads, Active vs Blocked Users) and recent activity logs.
- **User Management**:
  - Search users by name or email.
  - Filter by role (`user`, `admin`) and status (`active`, `blocked`).
  - View user profile with all their uploaded images.
  - Block / Unblock user accounts (blocks immediate login and API access).
  - Promote or demote user roles (`user` &harr; `admin`).
  - Delete user accounts with **cascading Cloudinary asset destruction** (destroys all user images on Cloudinary and removes their DB records).
- **Image Management & Moderation**:
  - Global media grid across all users with uploader attribution (`populate('uploadedBy')`).
  - Search by image title or filename.
  - Filter by format (`JPG`, `PNG`, `WEBP`) and custom date ranges.
  - Admin image deletion from Cloudinary + MongoDB.
- **Analytics & Reporting**:
  - Uploads per day (last 7 days trend chart).
  - New user registrations over time.
  - File format distribution breakdown.
- **System Settings**:
  - Configurable application name, maximum upload size limit, and allowed MIME formats stored in MongoDB.

---

## 3. Default Admin Credentials

An initial admin account is automatically seeded into MongoDB on server startup:

- **Email**: `cloudinary@gmail.com`
- **Password**: `Cloudinary@123`
- **Role**: `admin`

---

## 4. Technology Stack

### Frontend:
- **React.js (v18)** - UI components, admin views, state management
- **Vite** - High-performance build tool and dev server
- **Axios** - HTTP client with request interceptors for JWT
- **Tailwind CSS** - Modern, utility-first styling
- **Lucide React** - Clean icons

### Backend:
- **Node.js & Express.js** - RESTful API framework
- **MongoDB & Mongoose** - Document database & schema validation
- **Multer & multer-storage-cloudinary** - Multipart form data and storage engine
- **jsonwebtoken (JWT)** - Stateless authentication & route protection
- **bcryptjs** - Password hashing
- **dotenv & cors** - Configuration & Cross-Origin Resource Sharing

### Cloud Storage:
- **Cloudinary** - Scalable cloud media storage and optimization

---

## 5. Project Structure

```
cloudinary-media-manager/
│
├── backend/
│   ├── config/
│   │   ├── cloudinary.js         # Cloudinary SDK configuration
│   │   └── db.js                 # MongoDB connection handler
│   ├── controllers/
│   │   ├── adminController.js    # Admin dashboard, users, images, analytics, settings
│   │   ├── authController.js     # User registration and login controllers
│   │   └── uploadController.js   # Upload, fetch, replace & delete logic
│   ├── middleware/
│   │   ├── adminMiddleware.js    # Admin role verification middleware (403 guard)
│   │   ├── authMiddleware.js     # JWT verification & blocked user check
│   │   └── upload.js             # Multer Cloudinary storage & 5MB validation
│   ├── models/
│   │   ├── Image.js              # Image metadata Mongoose schema
│   │   ├── Setting.js            # System settings schema
│   │   └── User.js               # User schema with role ('user' | 'admin') & isBlocked
│   ├── routes/
│   │   ├── adminRoutes.js        # Admin endpoints (/api/admin)
│   │   ├── authRoutes.js         # Auth endpoints (/api/auth)
│   │   └── uploadRoutes.js       # Media endpoints (/api/upload)
│   ├── .env.example              # Backend environment template
│   ├── package.json              # Backend dependencies and scripts
│   └── server.js                 # Express application & admin seeder
│
├── frontend/
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/            # Admin Panel Subsystem
│   │   │   │   ├── AdminAnalytics.jsx
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminImages.jsx
│   │   │   │   ├── AdminLayout.jsx
│   │   │   │   ├── AdminSettings.jsx
│   │   │   │   └── AdminUsers.jsx
│   │   │   ├── AuthModal.jsx     # Login and Register modal with Admin quick-fill
│   │   │   ├── ImageGallery.jsx  # Media cards, copy URL, replace & delete modals
│   │   │   ├── ImageUpload.jsx   # Upload card, preview, and progress bar
│   │   │   └── Navbar.jsx        # Top navigation with Admin Panel link
│   │   ├── services/
│   │   │   └── api.js            # Axios service layer (uploadApi, adminApi, authApi)
│   │   ├── App.jsx               # Dashboard and Admin view routing
│   │   ├── index.css             # Tailwind directives and custom styles
│   │   └── main.jsx              # React DOM mounting
│   ├── .env.example              # Frontend environment template
│   ├── index.html                # HTML entry point
│   ├── package.json              # Frontend dependencies and scripts
│   ├── postcss.config.js         # PostCSS configuration
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   └── vite.config.js            # Vite proxy and build configuration
│
├── .gitignore                    # Git ignore rules for secrets and build files
└── README.md                     # Project documentation
```

---

## 6. Installation & Quick Start

### 1. Clone the repository:
```bash
git clone https://github.com/jethavah042-hash/cloudinary-media-manager.git
cd cloudinary-media-manager
```

### 2. Configure Environment Variables:

Create `backend/.env` based on `backend/.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cloudinary_mern_db
JWT_SECRET=your_jwt_secret_key_change_in_production

# Cloudinary Credentials (from dashboard.cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Create `frontend/.env` based on `frontend/.env.example`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start the Backend Server:
```bash
cd backend
npm install
npm run dev
# Server will run on http://localhost:5000
```

### 4. Start the Frontend Application:
```bash
cd ../frontend
npm install
npm run dev
# Application will run on http://localhost:5173
```

---

## 7. API Endpoints

### Admin Endpoints (`/api/admin`) — Protected by `protect` + `adminOnly`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/admin/stats` | Summary statistics (users, images, storage, today's uploads) |
| `GET` | `/api/admin/users` | List all users with search (`?search=`) and filters (`?role=&status=`) |
| `GET` | `/api/admin/users/:id` | View specific user details and their uploaded images |
| `PUT` | `/api/admin/users/:id/block` | Block user account |
| `PUT` | `/api/admin/users/:id/unblock` | Unblock user account |
| `PUT` | `/api/admin/users/:id/role` | Change user role (`user` &harr; `admin`) |
| `DELETE` | `/api/admin/users/:id` | Delete user and destroy all their Cloudinary images |
| `GET` | `/api/admin/images` | View all images with populated uploader, search & format filters |
| `GET` | `/api/admin/images/:id` | Get detailed image metadata |
| `DELETE` | `/api/admin/images/:id` | Delete image from Cloudinary and MongoDB |
| `GET` | `/api/admin/analytics` | Uploads per day, registrations growth, format breakdown |
| `GET` | `/api/admin/settings` | Fetch system settings from MongoDB |
| `PUT` | `/api/admin/settings` | Update system settings in MongoDB |

### User Media Endpoints (`/api/upload`)

| Method | Endpoint | Description | Content-Type / Payload |
|---|---|---|---|
| `POST` | `/api/upload` | Upload single image to Cloudinary & MongoDB | `multipart/form-data` (`image` file) |
| `GET` | `/api/upload` | Fetch all uploaded image records | `application/json` |
| `GET` | `/api/upload/:id` | Get single image metadata by ID | `application/json` |
| `PUT` | `/api/upload/:id` | Replace existing image (destroys old asset) | `multipart/form-data` (`image` file) |
| `DELETE` | `/api/upload/:id` | Delete image by ID / `public_id` | URL parameter |

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Content-Type / Payload |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account | JSON: `{ name, email, password }` |
| `POST` | `/api/auth/login` | Log in user and receive JWT | JSON: `{ email, password }` |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Header: `Authorization: Bearer <token>` |

---

## 8. License

This project is open-source and available under the [ISC License](LICENSE).
