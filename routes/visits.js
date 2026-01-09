const express = require('express');
const router = express.Router();
const Visit = require('../models/Visit');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');

// Create new visit for patient
router.post('/create/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { chiefComplaint } = req.body;
    const doctorId = req.user?.id || req.body.doctorId;

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: 'Patient not found' });
    }
    // Create new visit without checking for existing active visits
    const visit = new Visit({
      patientId,
      ...(doctorId ? { doctorId } : {}),
      chiefComplaint: chiefComplaint || 'Visit'
    });
    
    await visit.save();

    await visit.populate('patientId', 'firstName lastName medicalId');
    
    res.status(201).json(visit);
  } catch (error) {
    console.error('Create visit error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get visit details
router.get('/:visitId', auth, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.visitId)
      .populate('patientId', 'firstName lastName medicalId dateOfBirth')
      .populate('doctorId', 'name email');
    
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    
    res.json(visit);
  } catch (error) {
    console.error('Update visit form error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update form data for a visit
router.put('/:visitId/forms/:formType', auth, async (req, res) => {
  try {
    const { visitId, formType } = req.params;
    const { data } = req.body;
    
    const validFormTypes = ['medicalHistory', 'clinicalExamination', 'diagnosisTreatment', 'dischargeForm'];
    if (!validFormTypes.includes(formType)) {
      return res.status(400).json({ message: 'Invalid form type' });
    }
    
    const visit = await Visit.findById(visitId);
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    
    // Update form data and status
    visit.forms[formType].data = data;
    visit.forms[formType].status = 'Completed';
    visit.forms[formType].lastUpdated = new Date();
    
    await visit.save();
    
    res.json({ message: 'Form updated successfully', visit });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all visits for a patient
router.get('/patient/:patientId', auth, async (req, res) => {
  try {
    const visits = await Visit.find({ patientId: req.params.patientId })
      .populate('doctorId', 'name')
      .sort({ createdAt: -1 });
    
    res.json(visits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Discharge patient
router.post('/:visitId/discharge', auth, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.visitId);
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    
    visit.status = 'Discharged';
    visit.dischargeDate = new Date();
    
    await visit.save();
    
    // Update patient status
    await Patient.findByIdAndUpdate(visit.patientId, {
      status: 'Discharged',
      currentVisit: null
    });
    
    res.json({ message: 'Patient discharged successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Generate discharge summary
router.post('/:visitId/discharge-summary', auth, async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.visitId)
      .populate('patientId', 'firstName lastName medicalId dateOfBirth')
      .populate('doctorId', 'name');
    
    if (!visit) {
      return res.status(404).json({ message: 'Visit not found' });
    }
    
    // Generate comprehensive discharge summary
    const summary = {
      patientInfo: {
        medicalId: visit.patientId.medicalId,
        name: `${visit.patientId.firstName} ${visit.patientId.lastName}`,
        dateOfBirth: visit.patientId.dateOfBirth
      },
      visitInfo: {
        admissionDate: visit.admissionDate,
        dischargeDate: visit.dischargeDate,
        doctor: visit.doctorId.name,
        chiefComplaint: visit.chiefComplaint
      },
      forms: visit.forms,
      notes: visit.notes
    };
    
    visit.dischargeSummary = {
      generated: true,
      data: summary,
      generatedAt: new Date()
    };
    
    await visit.save();
    
    res.json({ message: 'Discharge summary generated', summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
