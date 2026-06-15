const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { sendTokenResponse } = require('../utils/tokenUtils');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const cleanEmail = email.trim().toLowerCase();
    console.log('🔍 Login attempt for:', cleanEmail);

    // Query directly from collection — avoids any model select:false issues
    const admin = await mongoose.connection.collection('admins').findOne({ email: cleanEmail });

    if (!admin) {
      console.log('❌ No admin found with email:', cleanEmail);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log('✅ Admin found:', admin.email);
    console.log('🔐 Stored hash:', admin.password);

    const isMatch = await bcrypt.compare(password, admin.password);
    console.log('🔑 Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        _id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const admin = await mongoose.connection.collection('admins').findOne(
      { _id: req.admin._id },
      { projection: { password: 0 } }
    );
    res.status(200).json({ success: true, data: admin });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await mongoose.connection.collection('admins').findOne({ _id: req.admin._id });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await mongoose.connection.collection('admins').updateOne(
      { _id: req.admin._id },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, changePassword };