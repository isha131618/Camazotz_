const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  appointmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment'
  },
  visitDate: {
    type: Date,
    required: true
  },
  chiefComplaint: {
    type: String,
    required: true
  },
  historyOfPresentIllness: String,
  pastMedicalHistory: [String],
  familyHistory: [String],
  socialHistory: {
    smoking: Boolean,
    alcohol: Boolean,
    drugs: Boolean,
    exercise: String,
    diet: String
  },
  physicalExamination: {
    general: String,
    vitalSigns: {
      bloodPressure: String,
      heartRate: Number,
      respiratoryRate: Number,
      temperature: Number,
      weight: Number,
      height: Number
    },
    heent: String,
    cardiovascular: String,
    respiratory: String,
    gastrointestinal: String,
    neurological: String,
    musculoskeletal: String,
    skin: String
  },
  assessment: String,
  plan: String,
  diagnosis: [{
    condition: String,
    icd10Code: String,
    status: {
      type: String,
      enum: ['Active', 'Resolved', 'Chronic'],
      default: 'Active'
    }
  }],
  medications: [{
    name: String,
    dosage: String,
    frequency: String,
    route: String,
    startDate: Date,
    endDate: Date,
    instructions: String
  }],
  labTests: [{
    testName: String,
    orderedDate: Date,
    resultDate: Date,
    result: String,
    normalRange: String,
    status: {
      type: String,
      enum: ['Ordered', 'Pending', 'Completed', 'Abnormal'],
      default: 'Ordered'
    }
  }],
  imaging: [{
    type: String,
    orderedDate: Date,
    resultDate: Date,
    findings: String,
    impression: String,
    status: {
      type: String,
      enum: ['Ordered', 'Pending', 'Completed'],
      default: 'Ordered'
    }
  }],
  procedures: [{
    name: String,
    date: Date,
    complications: String,
    outcome: String
  }],
  followUp: {
    instructions: String,
    nextVisit: Date,
    reason: String
  },
  attachments: [{
    type: String,
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
