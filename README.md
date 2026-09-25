# Cloudinary Media Manager

A full-stack MERN (MongoDB, Express, React, Node.js) media management application featuring secure image uploads, real-time local previews, image replacements, Cloudinary asset destruction, and MongoDB document synchronization.

---

## 1. Project Overview

**Cloudinary Media Manager** is a complete, production-ready solution for managing image assets in the cloud. Instead of storing large binary blobs in MongoDB or saving files on local server disks, images are streamed directly to **Cloudinary** using Multer. Metadata such as the secure HTTPS URL, Cloudinary `public_id`, image format, dimensions, file size, and timestamps are synced with **MongoDB**.

---

## 2. Features

- **Direct Cloudinary Integration**: Stream files directly to Cloudinary storage using `cloudinary` v2 and `multer-storage-cloudinary`.
- **MongoDB Synchronization**: Stores image references and metadata (`imageUrl`, `cloudinaryPublicId`, format, file size, user reference) with Mongoose.
- **Complete Image Lifecycle**:
  - **Upload**: File validation &rarr; Instant client preview (`URL.createObjectURL`) &rarr; Cloudinary upload with progress tracking &rarr; MongoDB document creation.
  - **Replace**: Choose new file &rarr; Upload to Cloudinary &rarr; Delete old asset on Cloudinary via `public_id` &rarr; Update MongoDB record.
  - **Delete**: Confirmation modal &rarr; Delete asset from Cloudinary &rarr; Remove document from MongoDB.
  - **Copy URL**: One-click clipboard copy of the direct Cloudinary secure URL.
- **Strict File Validation**:
  - Allowed formats: `JPG`, `JPEG`, `PNG`, `WEBP`.
  - Max file size: `5MB` (both client-side & server-side validation).
- **Authentication**: JWT-based user authentication (Register & Login) with `bcryptjs` password hashing and protected API route support.
- **Clean Developer Dashboard**: Minimal, responsive UI built with React, Vite, and Tailwind CSS.

---

## 3. Technology Stack

### Frontend:
- **React.js (v18)** - UI components and state management
- **Vite** - Build tool and development server
- **Axios** - HTTP client with request interceptors for JWT
- **Tailwind CSS** - Modern, utility-first styling
- **Lucide React** - Clean icons

### Backend:
- **Node.js** - Server-side runtime environment
- **Express.js** - RESTful API framework
- **MongoDB** - Document database
- **Mongoose** - Object Data Modeling (ODM) library
- **Multer & multer-storage-cloudinary** - Multipart form data and storage engine
- **dotenv** - Environment variable management

### Cloud Storage:
- **Cloudinary** - Scalable cloud media storage and optimization

### Authentication & Security:
- **JSON Web Tokens (JWT)** - Stateless authentication
- **bcryptjs** - Password hashing
- **cors** - Cross-Origin Resource Sharing

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
│   │   ├── authController.js     # User registration and login controllers
│   │   └── uploadController.js   # Upload, fetch, replace & delete logic
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification middleware
│   │   └── upload.js             # Multer Cloudinary storage & 5MB validation
│   ├── models/
│   │   ├── Image.js              # Image metadata Mongoose schema
│   │   └── User.js               # User authentication Mongoose schema
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints (/api/auth)
│   │   └── uploadRoutes.js       # Media endpoints (/api/upload)
│   ├── .env.example              # Backend environment template
│   ├── package.json              # Backend dependencies and scripts
│   └── server.js                 # Express application entry point
│
├── frontend/
│   ├── public/                   # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthModal.jsx     # Login and Register modal
│   │   │   ├── ImageGallery.jsx  # Media cards, copy URL, replace & delete modals
│   │   │   ├── ImageUpload.jsx   # Upload card, preview, and progress bar
│   │   │   └── Navbar.jsx        # Top navigation header
│   │   ├── services/
│   │   │   └── api.js            # Axios service layer
│   │   ├── App.jsx               # Main dashboard component
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

## 5. Installation

Clone the repository to your local machine:

```bash
git clone https://github.com/jethavah042-hash/cloudinary-media-manager.git
cd cloudinary-media-manager
```

### Install Backend Dependencies:
```bash
cd backend
npm install
```

### Install Frontend Dependencies:
```bash
cd ../frontend
npm install
```

---

## 6. Environment Variables

### Backend Configuration (`backend/.env`)

Create a `.env` file in the `backend/` directory based on `backend/.env.example`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cloudinary_mern_db
JWT_SECRET=your_jwt_secret_key_change_in_production

# Cloudinary Credentials (from your Cloudinary Dashboard)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Frontend Configuration (`frontend/.env`)

Create a `.env` file in the `frontend/` directory based on `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 7. How to Run Backend

Ensure your MongoDB instance is running locally or provide a MongoDB Atlas connection string in `backend/.env`.

```bash
cd backend
npm run dev
```

*The server will start at `http://localhost:5000`.*

---

## 8. How to Run Frontend

In a separate terminal window:

```bash
cd frontend
npm run dev
```

*The frontend application will start at `http://localhost:5173`.*

---

## 9. API Endpoints

### Media Endpoints (`/api/upload`)

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

## 10. Cloudinary Configuration

1. Create a free account at [Cloudinary](https://cloudinary.com/).
2. Navigate to your **Cloudinary Dashboard / Console**.
3. Copy your **Cloud Name**, **API Key**, and **API Secret**.
4. Paste them into your `backend/.env` file.
5. Uploaded images will be placed in the `mern-app` folder on Cloudinary.

---

## 11. Upload / Replace / Delete Workflow

### Upload Workflow:
```
User selects file &rarr; Client validates type & size &rarr; Local preview generated (URL.createObjectURL)
&rarr; Axios multipart POST &rarr; Multer Cloudinary storage &rarr; Cloudinary secure URL & public_id generated
&rarr; Metadata saved to MongoDB &rarr; UI renders image in Media Gallery.
```

### Replace Workflow:
```
User clicks "Replace" on card &rarr; Selects replacement file &rarr; PUT request sent with new file
&rarr; New image uploaded to Cloudinary &rarr; Backend invokes cloudinary.uploader.destroy(oldPublicId)
&rarr; MongoDB document updated with new URL and public_id &rarr; UI updates state.
```

### Delete Workflow:
```
User clicks "Delete" &rarr; Confirmation modal appears &rarr; DELETE request sent
&rarr; Backend invokes cloudinary.uploader.destroy(publicId) &rarr; MongoDB document deleted
&rarr; UI removes card from gallery.
```

---

## 12. Future Improvements

- **Bulk / Multi-image uploads**: Support uploading multiple images simultaneously.
- **Image Transformation Presets**: On-the-fly thumbnail resizing, cropping, and background removal via Cloudinary transformation URLs.
- **Folder / Tag Management**: Organize media items into customizable folders and tags.
- **Pagination & Search**: Paginated media grid with search by title or date range.

---

## License

This project is open-source and available under the [ISC License](LICENSE).
