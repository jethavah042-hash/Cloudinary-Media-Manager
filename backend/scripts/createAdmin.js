const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloudinary_mern_db';
    await mongoose.connect(mongoUri);
    console.log('[MongoDB] Connected successfully');

    const adminName = process.env.ADMIN_NAME || 'Super Admin';
    const adminEmail = (process.env.ADMIN_EMAIL || 'cloudinary@gmail.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'Cloudinary@123';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      if (existingAdmin.role !== 'admin') {
        existingAdmin.role = 'admin';
        existingAdmin.isBlocked = false;
        await existingAdmin.save();
        console.log(`[Admin Setup] Updated existing user ${adminEmail} to admin role.`);
      } else {
        console.log('Admin already exists.');
      }
      process.exit(0);
    }

    // Create new admin user
    await User.create({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      isBlocked: false
    });

    console.log('========================================');
    console.log('Admin created successfully!');
    console.log(`Name:     ${adminName}`);
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Role:     admin');
    console.log('========================================');

    process.exit(0);
  } catch (error) {
    console.error('[Create Admin Error]:', error.message);
    process.exit(1);
  }
};

createAdmin();
