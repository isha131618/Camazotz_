const express = require('express');
const router = express.Router();
const Query = require('../models/Query');
const Patient = require('../models/Patient');
const { body, validationResult } = require('express-validator');

// Get all queries
router.get('/', async (req, res) => {
  try {
    const queries = await Query.find()
      .populate('patientId', 'firstName lastName email')
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get query by ID
router.get('/:id', async (req, res) => {
  try {
    const query = await Query.findById(req.params.id)
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
router.get('/patient/:patientId', async (req, res) => {
  try {
    const queries = await Query.find({ patientId: req.params.patientId })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ createdAt: -1 });
    res.json(queries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new query
router.post('/', [
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
    const patient = await Patient.findById(req.body.patientId);
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
router.put('/:id/respond', [
  body('response.message').notEmpty().withMessage('Response message is required'),
  body('doctorId').isMongoId().withMessage('Valid doctor ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const query = await Query.findByIdAndUpdate(
      req.params.id,
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
router.patch('/:id/status', [
  body('status').isIn(['Open', 'In Progress', 'Answered', 'Closed']).withMessage('Valid status is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const query = await Query.findByIdAndUpdate(
      req.params.id,
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
router.delete('/:id', async (req, res) => {
  try {
    const query = await Query.findByIdAndDelete(req.params.id);
    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }
    res.json({ message: 'Query deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
