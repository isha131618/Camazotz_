const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const { body, validationResult } = require('express-validator');

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ lastName: 1, firstName: 1 });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new doctor
router.post('/', [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('specialization').notEmpty().withMessage('Specialization is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('licenseNumber').notEmpty().withMessage('License number is required'),
  body('experience').isInt({ min: 0 }).withMessage('Valid experience is required'),
  body('consultationFee').isFloat({ min: 0 }).withMessage('Valid consultation fee is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const doctor = new Doctor(req.body);
    const savedDoctor = await doctor.save();
    res.status(201).json(savedDoctor);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email or license number already exists' });
    }
    res.status(400).json({ message: error.message });
  }
});

// Update doctor
router.put('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json(doctor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update doctor status
router.patch('/:id/status', [
  body('status').isIn(['Available', 'Busy', 'On Leave']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const doctor = await Doctor.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete doctor
router.delete('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search doctors by specialization
router.get('/specialization/:specialization', async (req, res) => {
  try {
    const doctors = await Doctor.find({ 
      specialization: { $regex: req.params.specialization, $options: 'i' }
    });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get doctors by department
router.get('/department/:department', async (req, res) => {
  try {
    const doctors = await Doctor.find({ 
      department: { $regex: req.params.department, $options: 'i' }
    });
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
