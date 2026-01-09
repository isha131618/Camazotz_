const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const Patient = require('../models/Patient');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

// Get all queries
router.get('/', auth, async (req, res) => {
  try {
    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const queries = await Query.find({ patientId: { $in: patientIds } })
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get query by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const query = await Query.findOne({
      _id: req.params.id,
      patientId: { $in: patientIds }
    })
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName specialization');
    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }
    res.json(query);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get queries by patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.patientId, doctorId: req.user.id });
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    const queries = await Query.find({ patientId: req.params.patientId })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new query
router.post('/', auth, [
  body('patientId').isMongoId().withMessage('Valid patient ID is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').isIn(['General', 'Urgent', 'Follow-up', 'Prescription', 'Test Results', 'Appointment']).withMessage('Valid category is required'),
  body('priority').isIn(['Low', 'Medium', 'High', 'Critical']).withMessage('Valid priority is required')
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

    const query = new Query(req.body);
    const savedQuery = await query.save();
    
    const populatedQuery = await Query.findById(savedQuery._id)
      .populate('patientId', 'firstName lastName email');
    
    res.status(201).json(populatedQuery);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Respond to query
router.put('/:id/respond', auth, [
  body('response.message').notEmpty().withMessage('Response message is required'),
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const query = await Query.findOneAndUpdate(
      { _id: req.params.id, patientId: { $in: patientIds } },
      {
        response: {
          message: req.body.response.message,
          doctorId: req.body.doctorId,
          respondedAt: new Date()
        },
        status: 'Answered',
        updatedAt: new Date()
      },
      { new: true }
    ).populate('doctorId', 'firstName lastName specialization');

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    res.json(query);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update query status
router.patch('/:id/status', auth, [
  body('status').isIn(['Open', 'In Progress', 'Answered', 'Closed']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const query = await Query.findOneAndUpdate(
      { _id: req.params.id, patientId: { $in: patientIds } },
      { 
        status: req.body.status,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    res.json(query);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete query
router.delete('/:id', auth, async (req, res) => {
  try {
    const patientIds = await Patient.find({ doctorId: req.user.id }).distinct('_id');
    const query = await Query.findOneAndDelete({
      _id: req.params.id,
      patientId: { $in: patientIds }
    });
    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }
    res.json({ message: 'Query deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
