const express = require('express');
const router = express.Router();
const PatientDischargeForm = require('../models/PatientDischargeForm');
const auth = require('../middleware/auth');

// Get all discharge forms for a doctor
router.get('/', auth, async (req, res) => {
  try {
    const doctorId = req.user.id;
    const forms = await PatientDischargeForm.find({ doctorId })
      .populate('patientId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get discharge forms for a specific patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const forms = await PatientDischargeForm.find({ patientId })
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 });
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific discharge form
router.get('/:id', auth, async (req, res) => {
  try {
    const form = await PatientDischargeForm.findById(req.params.id)
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'name email');
    
    if (!form) {
      return res.status(404).json({ message: 'Discharge form not found' });
    }
    
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new discharge form
router.post('/', auth, async (req, res) => {
  try {
    const formData = {
      ...req.body,
      doctorId: req.user.id
    };
    
    const newForm = new PatientDischargeForm(formData);
    const savedForm = await newForm.save();
    
    const populatedForm = await PatientDischargeForm.findById(savedForm._id)
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'name email');
    
    res.status(201).json(populatedForm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a discharge form
router.put('/:id', auth, async (req, res) => {
  try {
    const form = await PatientDischargeForm.findById(req.params.id);
    
    if (!form) {
      return res.status(404).json({ message: 'Discharge form not found' });
    }
    
    // Check if the user owns this form or is admin
    if (form.doctorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this form' });
    }
    
    const updatedForm = await PatientDischargeForm.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'name email');
    
    res.json(updatedForm);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a discharge form
router.delete('/:id', auth, async (req, res) => {
  try {
    const form = await PatientDischargeForm.findById(req.params.id);
    
    if (!form) {
      return res.status(404).json({ message: 'Discharge form not found' });
    }
    
    // Check if the user owns this form or is admin
    if (form.doctorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this form' });
    }
    
    await PatientDischargeForm.findByIdAndDelete(req.params.id);
    res.json({ message: 'Discharge form deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search discharge forms
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;
    const doctorId = req.user.id;
    
    const forms = await PatientDischargeForm.find({
      doctorId,
      $or: [
        { 'patientName': { $regex: query, $options: 'i' } },
        { 'reasonForAdmission': { $regex: query, $options: 'i' } },
        { 'diagnosisAtAdmission': { $regex: query, $options: 'i' } },
        { 'diagnosisAtDischarge': { $regex: query, $options: 'i' } }
      ]
    })
      .populate('patientId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Filter discharge forms by date range
router.post('/filter', auth, async (req, res) => {
  try {
    const { startDate, endDate, patientStatus } = req.body;
    const doctorId = req.user.id;
    
    const filter = { doctorId };
    
    if (startDate || endDate) {
      filter.dateOfDischarge = {};
      if (startDate) filter.dateOfDischarge.$gte = new Date(startDate);
      if (endDate) filter.dateOfDischarge.$lte = new Date(endDate);
    }
    
    if (patientStatus) {
      filter.patientStatus = patientStatus;
    }
    
    const forms = await PatientDischargeForm.find(filter)
      .populate('patientId', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    
    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
