const mongoose = require('mongoose');

const visitSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  visitNumber: {
    type: Number,
    required: true
  },
  admissionDate: {
    type: Date,
    default: Date.now
  },
  dischargeDate: Date,
  status: {
    type: String,
    enum: ['Active', 'Discharged'],
    default: 'Active'
  },
  chiefComplaint: String,
  diagnosis: String,
  forms: {
    medicalHistory: {
      status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Completed'],
        default: 'Not Started'
      },
      data: mongoose.Schema.Types.Mixed,
      lastUpdated: Date
    },
    clinicalExamination: {
      status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Completed'],
        default: 'Not Started'
      },
      data: mongoose.Schema.Types.Mixed,
      lastUpdated: Date
    },
    diagnosisTreatment: {
      status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Completed'],
        default: 'Not Started'
      },
      data: mongoose.Schema.Types.Mixed,
      lastUpdated: Date
    },
    dischargeForm: {
      status: {
        type: String,
        enum: ['Not Started', 'In Progress', 'Completed'],
        default: 'Not Started'
      },
      data: mongoose.Schema.Types.Mixed,
      lastUpdated: Date
    }
  },
  dischargeSummary: {
    generated: {
      type: Boolean,
      default: false
    },
    data: mongoose.Schema.Types.Mixed,
    generatedAt: Date
  },
  notes: String
}, {
  timestamps: true
});

// Generate visit number before validation so required passes
visitSchema.pre('validate', async function(next) {
  try {
    if (this.isNew && !this.visitNumber) {
      const count = await this.constructor.countDocuments({
        patientId: this.patientId
      });
      this.visitNumber = count + 1;
    }
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Visit', visitSchema);
