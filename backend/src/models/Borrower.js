const mongoose = require('mongoose');

const borrowerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    fatherName: { type: String, trim: true },
    mobileNumber: { type: String, required: true, trim: true },
    alternateNumber: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    dateOfBirth: { type: Date },
    address: {
      village: { type: String, trim: true },
      city: { type: String, trim: true },
      district: { type: String, trim: true },
      state: { type: String, trim: true },
      pincode: { type: String, trim: true },
    },
    occupation: { type: String, trim: true },
    monthlyIncome: { type: Number, default: 0 },
    aadhaarNumber: { type: String, trim: true },
    panNumber: { type: String, trim: true, uppercase: true },
    // Cloudinary URLs
    aadhaarFrontImage: { type: String },
    aadhaarBackImage: { type: String },
    panCardImage: { type: String },
    photo: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text search index
borrowerSchema.index({
  fullName: 'text',
  mobileNumber: 'text',
  aadhaarNumber: 'text',
  email: 'text',
});

module.exports = mongoose.model('Borrower', borrowerSchema);
