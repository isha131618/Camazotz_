const mongoose = require('mongoose');

const patientDischargeFormSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Hospital Information
  hospitalInfo: {
    name: {
      type: String,
      required: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },
    phone: String,
    fax: String,
    email: String,
    web: String
  },

  // Patient and Discharge Information
  patientName: {
    type: String,
    required: true
  },
  dateAdmitted: {
    type: Date,
    required: true
  },
  dateOfDischarge: {
    type: Date,
    required: true
  },
  physicianApproval: {
    type: String,
    required: true
  },
  dateOfNextCheckup: {
    type: Date
  },

  // Admission and Treatment Details
  reasonForAdmission: {
    type: String,
    required: true
  },
  diagnosisAtAdmission: {
    type: String,
    required: true
  },
  treatmentSummary: {
    type: String,
    required: true
  },
  reasonForDischarge: {
    type: String,
    required: true
  },
  diagnosisAtDischarge: {
    type: String,
    required: true
  },
  furtherTreatmentPlan: {
    type: String
  },

  // Patient Contact Information
  patientContactInfo: {
    address: {
      type: String,
      required: true
    },
    phone: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    }
  },

  // Medication Table
  medications: [{
    medication: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    amount: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    endDate: Date
  }],

  // Signature and Notes
  signature: {
    type: String,
    required: true
  },
  dateOfSignature: {
    type: Date,
    required: true
  },
  notes: {
    type: String
  },

  // Patient Status
  patientStatus: {
    type: String,
    enum: ['Deceased', 'Transferred', 'Terminated', 'Discharged'],
    default: 'Discharged'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PatientDischargeForm', patientDischargeFormSchema);
