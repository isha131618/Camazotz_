const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Get all appointments
router.get('/', auth, async (req, res) => {
  try {
    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const appointments = await Appointment.find({ patientId: { $in: patientIds } })
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get appointment by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patientId: { $in: patientIds }
    })
      .populate('patientId', 'firstName lastName email phone dateOfBirth')
      .populate('doctorId', 'firstName lastName specialization department');
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get appointments by patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.patientId, doctorId: req.user.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    const appointments = await Appointment.find({ patientId: req.params.patientId })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ date: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get appointments by doctor
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const appointments = await Appointment.find({
      doctorId: req.params.doctorId,
      patientId: { $in: patientIds }
    })
      .populate('patientId', 'firstName lastName email phone')
      .sort({ date: 1, time: 1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new appointment
router.post('/', auth, [
  body('patientId').isMongoId().withMessage('Valid patient ID is required'),
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid time format is required (HH:MM)'),
  body('reason').notEmpty().withMessage('Reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify patient exists
    const patient = await Patient.findOne({ _id: req.body.patientId, doctorId: req.user.id });
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }

    const appointment = new Appointment(req.body);
    const savedAppointment = await appointment.save();
    
    const populatedAppointment = await Appointment.findById(savedAppointment._id)
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName specialization');
    
    res.status(201).json(populatedAppointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update appointment
router.put('/:id', auth, async (req, res) => {
  try {
    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patientId: { $in: patientIds } },
      req.body,
      { new: true, runValidators: true }
    )
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName specialization');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update appointment status
router.patch('/:id/status', auth, [
  body('status').isIn(['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No Show']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patientId: { $in: patientIds } },
      { 
        status: req.body.status,
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName specialization');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add prescription to appointment
router.post('/:id/prescription', auth, [
  body('medication').notEmpty().withMessage('Medication is required'),
  body('dosage').notEmpty().withMessage('Dosage is required'),
  body('frequency').notEmpty().withMessage('Frequency is required'),
  body('duration').notEmpty().withMessage('Duration is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const appointment = await Appointment.findOneAndUpdate(
      { _id: req.params.id, patientId: { $in: patientIds } },
      { 
        $push: { prescription: req.body },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    res.json(appointment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete appointment
router.delete('/:id', auth, async (req, res) => {
  try {
    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const appointment = await Appointment.findOneAndDelete({
      _id: req.params.id,
      patientId: { $in: patientIds }
    });
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
