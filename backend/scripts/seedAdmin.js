require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const Admin    = require('../src/models/Admin');

const ADMIN = {
  name:        'Super Admin',
  email:       'admin@thararide.com',
  password:    'Thara@Admin#2025',
  role:        'superadmin',
  permissions: ['*'],
};

async function seed() {
  try {
    console.log('🔌 Connecting to:', process.env.MONGODB_URI?.slice(0, 30) + '...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    await Admin.deleteOne({ email: ADMIN.email });

    const admin = await Admin.create(ADMIN);
    console.log('✅ Admin created successfully');
    console.log('─────────────────────────────────');
    console.log('  Email   :', ADMIN.email);
    console.log('  Password:', ADMIN.password);
    console.log('  Role    :', admin.role);
    console.log('─────────────────────────────────');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();