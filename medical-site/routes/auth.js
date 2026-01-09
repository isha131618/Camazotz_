const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const Query = require('../models/Query');
const Visit = require('../models/Visit');
const PatientDischargeForm = require('../models/PatientDischargeForm');

// Create default doctor user if none exists
const createDefaultDoctor = async () => {
  try {
    const existingDoctor = await User.findOne({ email: 'doctor@medicare.com' });
    if (!existingDoctor) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const doctor = new User({
        name: 'Default Doctor',
        email: 'doctor@medicare.com',
        password: hashedPassword,
        role: 'doctor'
      });
      
      await doctor.save();
      console.log('Default doctor user created: doctor@medicare.com / password123');
    }
  } catch (error) {
    console.log('Error creating default doctor:', error.message);
  }
};

// Initialize default doctor
createDefaultDoctor();

// Register user
router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['doctor']).withMessage('Only doctor role is allowed')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, name } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      role: 'doctor',
      name
    });

    await user.save();

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    if (user.role !== 'doctor') {
      return res.status(403).json({ message: 'Only doctors are allowed to log in' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user (protected route)
router.get('/me', (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    User.findById(decoded.id).then(user => {
      if (!user) {
        return res.status(401).json({ message: 'Token is not valid' });
      }

      res.json({
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          name: user.name
        }
      });
    }).catch(error => {
      res.status(401).json({ message: 'Token is not valid' });
    });
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// Update email (protected route)
router.put('/email', auth, [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const newEmail = req.body.email.toLowerCase();
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { email: newEmail },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Email updated successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete account and all related patient data (protected route)
router.delete('/me', auth, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const patientIds = await Patient.find({ doctorId }).distinct('_id');

    if (patientIds.length > 0) {
      await Appointment.deleteMany({ patientId: { $in: patientIds } });
      await MedicalRecord.deleteMany({ patientId: { $in: patientIds } });
      await Query.deleteMany({ patientId: { $in: patientIds } });
      await Visit.deleteMany({ patientId: { $in: patientIds } });
      await PatientDischargeForm.deleteMany({ patientId: { $in: patientIds } });
    }

    await PatientDischargeForm.deleteMany({ doctorId });
    await Patient.deleteMany({ doctorId });
    await User.findByIdAndDelete(doctorId);

    res.json({ message: 'Account and related data removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
