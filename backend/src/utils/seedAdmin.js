require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Connect directly to the collection and delete all admins
    await mongoose.connection.collection('admins').deleteMany({});
    console.log('🗑️  Deleted all existing admins');

    const email = process.env.ADMIN_EMAIL || 'admin@loanapp.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

    // Hash password manually here
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed');

    // Insert directly - bypass mongoose model to avoid any hook issues
    await mongoose.connection.collection('admins').insertOne({
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: 'Administrator',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('✅ Admin created!');
    console.log('📧 Email:   ', email);
    console.log('🔑 Password:', password);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error.message);
    process.exit(1);
  }
};

seedAdmin();