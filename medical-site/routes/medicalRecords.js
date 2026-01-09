const express = require('express');
const router = express.Router();
const MedicalRecord = require('../models/MedicalRecord');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Get all medical records
router.get('/', auth, async (req, res) => {
  try {
    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const records = await MedicalRecord.find({ patientId: { $in: patientIds } })
      .populate('patientId', 'firstName lastName email dateOfBirth')
      .populate('doctorId', 'firstName lastName specialization')
      .populate('appointmentId', 'date time type')
      .sort({ visitDate: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get medical record by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const record = await MedicalRecord.findOne({
      _id: req.params.id,
      patientId: { $in: patientIds }
    })
      .populate('patientId', 'firstName lastName email phone dateOfBirth')
      .populate('doctorId', 'firstName lastName specialization department')
      .populate('appointmentId', 'date time type reason');
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get medical records by patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.patientId, doctorId: req.user.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    const records = await MedicalRecord.find({ patientId: req.params.patientId })
      .populate('doctorId', 'firstName lastName specialization')
      .populate('appointmentId', 'date time type')
      .sort({ visitDate: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get medical records by doctor
router.get('/doctor/:doctorId', auth, async (req, res) => {
  try {
    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const records = await MedicalRecord.find({
      doctorId: req.params.doctorId,
      patientId: { $in: patientIds }
    })
      .populate('patientId', 'firstName lastName email phone')
      .sort({ visitDate: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new medical record
router.post('/', auth, [
  body('patientId').isMongoId().withMessage('Valid patient ID is required'),
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required'),
  body('visitDate').isISO8601().withMessage('Valid visit date is required'),
  body('chiefComplaint').notEmpty().withMessage('Chief complaint is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify patient and doctor exist
    const patient = await Patient.findOne({ _id: req.body.patientId, doctorId: req.user.id });
    const doctor = await Doctor.findById(req.body.doctorId);
    
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const medicalRecord = new MedicalRecord(req.body);
    const savedRecord = await medicalRecord.save();
    
    const populatedRecord = await MedicalRecord.findById(savedRecord._id)
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName specialization');
    
    res.status(201).json(populatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update medical record
router.put('/:id', auth, async (req, res) => {
  try {
    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const record = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.id, patientId: { $in: patientIds } },
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    )
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName specialization');

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add diagnosis to medical record
router.post('/:id/diagnosis', auth, [
  body('condition').notEmpty().withMessage('Condition is required'),
  body('icd10Code').notEmpty().withMessage('ICD-10 code is required'),
  body('status').isIn(['Active', 'Resolved', 'Chronic']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const record = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.id, patientId: { $in: patientIds } },
      { 
        $push: { diagnosis: req.body },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add medication to medical record
router.post('/:id/medications', auth, [
  body('name').notEmpty().withMessage('Medication name is required'),
  body('dosage').notEmpty().withMessage('Dosage is required'),
  body('frequency').notEmpty().withMessage('Frequency is required'),
  body('route').notEmpty().withMessage('Route is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const record = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.id, patientId: { $in: patientIds } },
      { 
        $push: { medications: req.body },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add lab test to medical record
router.post('/:id/lab-tests', auth, [
  body('testName').notEmpty().withMessage('Test name is required'),
  body('normalRange').notEmpty().withMessage('Normal range is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const record = await MedicalRecord.findOneAndUpdate(
      { _id: req.params.id, patientId: { $in: patientIds } },
      { 
        $push: { 
          labTests: {
            ...req.body,
            orderedDate: new Date()
          }
        },
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }

    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete medical record
router.delete('/:id', auth, async (req, res) => {
  try {
    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const record = await MedicalRecord.findOneAndDelete({
      _id: req.params.id,
      patientId: { $in: patientIds }
    });
    if (!record) {
      return res.status(404).json({ message: 'Medical record not found' });
    }
    res.json({ message: 'Medical record deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
