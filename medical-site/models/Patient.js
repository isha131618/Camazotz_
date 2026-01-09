const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  medicalId: {
    type: String,
    required: false,
    unique: true,
    index: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  allergies: [String],
  medicalConditions: [String],
  medications: [String],
  insurance: {
    provider: String,
    policyNumber: String,
    expiryDate: Date,
    groupNumber: String
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Discharged'],
    default: 'Active'
  },
  registrationDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

patientSchema.pre('validate', async function preValidate(next) {
  try {
    if (this.isNew && !this.medicalId) {
      const year = new Date().getFullYear();
      const count = await this.constructor.countDocuments({
        medicalId: { $regex: `^${year}` }
      });

      this.medicalId = `${year}${String(count + 1).padStart(6, '0')}`;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Patient', patientSchema);
