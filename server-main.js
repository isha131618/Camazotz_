const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medical-site', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/visits', require('./routes/visits'));
app.use('/api/medical-records', require('./routes/medicalRecords'));
app.use('/api/auth', require('./routes/auth'));

// Enhanced AI Endpoint with Tool Calling
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
});
/*

// Available tools for the AI agent
const availableTools = {
  search_medication: {
    description: "Search for medication information including indications, dosage, and side effects",
    parameters: {
      type: "object",
      properties: {
        drugName: { type: "string", description: "Name of the medication to search for" }
      },
      required: ["drugName"]
    }
  },
  check_drug_interactions: {
    description: "Check for potential drug interactions between multiple medications",
    parameters: {
      type: "object",
      properties: {
        drugs: {
          type: "array",
          items: { type: "string" },
          description: "Array of medication names to check for interactions"
        }
      },
      required: ["drugs"]
    }
  },
  get_patient_history: {
    description: "Retrieve patient's medical history and previous records",
    parameters: {
      type: "object",
      properties: {
        patientId: { type: "string", description: "Patient ID to retrieve history for" }
      },
      required: ["patientId"]
    }
  },
  schedule_followup: {
    description: "Schedule a follow-up appointment for the patient",
    parameters: {
      type: "object",
      properties: {
        patientId: { type: "string", description: "Patient ID" },
        date: { type: "string", description: "Follow-up date (YYYY-MM-DD)" },
        type: { type: "string", description: "Type of follow-up appointment" },
        notes: { type: "string", description: "Additional notes for the appointment" }
      },
      required: ["patientId", "date", "type"]
    }
  }
};

// Tool execution functions
const executeTool = async (toolName, parameters) => {
  switch (toolName) {
    case 'search_medication':
      return await searchMedication(parameters.drugName);
    case 'check_drug_interactions':
      return await checkDrugInteractions(parameters.drugs);
    case 'get_patient_history':
      return await getPatientHistory(parameters.patientId);
    case 'schedule_followup':
      return await scheduleFollowup(parameters);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
};

// Tool implementations
const searchMedication = async (drugName) => {
  // In a real implementation, this would query a drug database API
  // For now, return mock data
  const mockDrugData = {
    'amoxicillin': {
      name: 'Amoxicillin',
      class: 'Penicillin antibiotic',
      indications: ['Bacterial infections', 'Ear infections', 'Urinary tract infections'],
      dosage: '500mg every 8 hours for 7-10 days',
      sideEffects: ['Nausea', 'Diarrhea', 'Rash'],
      contraindications: ['Penicillin allergy']
    },
    'paracetamol': {
      name: 'Paracetamol (Acetaminophen)',
      class: 'Analgesic/Antipyretic',
      indications: ['Pain relief', 'Fever reduction'],
      dosage: '500-1000mg every 4-6 hours, max 4000mg/day',
      sideEffects: ['Liver toxicity (overdose)', 'Nausea'],
      contraindications: ['Severe liver disease']
    }
  };

  return mockDrugData[drugName.toLowerCase()] || {
    name: drugName,
    note: 'Medication information not found in database. Please verify manually.'
  };
};

const checkDrugInteractions = async (drugs) => {
  // Mock drug interaction checker
  const interactions = [];

  // Simple interaction rules (in reality, this would be much more complex)
  if (drugs.includes('warfarin') && drugs.some(d => d.includes('aspirin'))) {
    interactions.push({
      drugs: ['warfarin', 'aspirin'],
      severity: 'major',
      description: 'Increased risk of bleeding',
      recommendation: 'Monitor INR closely, consider alternative pain relief'
    });
  }

  return {
    interactions,
    overallRisk: interactions.length > 0 ? 'moderate' : 'low',
    recommendations: interactions.length === 0 ?
      ['No significant interactions detected'] :
      interactions.map(i => i.recommendation)
  };
};

const getPatientHistory = async (patientId) => {
  try {
    // This would query the actual database
    const Patient = require('./models/Patient');
    const MedicalRecord = require('./models/MedicalRecord');

    const patient = await Patient.findById(patientId);
    const records = await MedicalRecord.find({ patientId });

    return {
      patient: {
        name: `${patient.firstName} ${patient.lastName}`,
        age: patient.age,
        gender: patient.gender
      },
      medicalHistory: records.map(record => ({
        date: record.date,
        diagnosis: record.diagnosis,
        treatment: record.treatment,
        medications: record.medications
      })),
      allergies: patient.allergies || [],
      chronicConditions: patient.chronicConditions || []
    };
  } catch (error) {
    return {
      error: 'Patient history not found',
      patientId: patientId
    };
  }
};

const scheduleFollowup = async (params) => {
  try {
    // This would create an appointment in the database
    const Appointment = require('./models/Appointment');

    const appointment = new Appointment({
      patientId: params.patientId,
      date: new Date(params.date),
      type: params.type,
      notes: params.notes,
      status: 'scheduled'
    });

    await appointment.save();

    return {
      appointmentId: appointment._id,
      status: 'scheduled',
      date: params.date,
      type: params.type
    };
  } catch (error) {
    return {
      error: 'Failed to schedule appointment',
      details: error.message
    };
  }
};

app.post('/api/medical-ai', async (req, res) => {
  const { transcript, formType, enableTools = false } = req.body;

  try {
    const systemPrompt = `
You are a voice-enabled medical documentation assistant. Your job is to convert clinician dictation into structured, medical-grade documentation.

Strict rules:
- Do NOT diagnose, prescribe, or make medical decisions.
- Do NOT add facts that were not explicitly stated by the clinician.
- Only rewrite and organize the provided information.
- Keep the clinician fully in control of the final content.
- Return ONLY valid JSON.

Guidelines:
- Transform "patient came with" → "The patient presented with"
- Convert "started antibiotics" → "Patient was initiated on antibiotic therapy"
- Change "vitals ok" → "Vital signs were stable within normal limits"
- Format medications properly (drug name, dose, route, frequency)
- Use clinical terminology throughout
`;

    const formPrompts = {
      'patient-registration': `
Extract and structure patient registration information:
- firstName: Patient's first name
- lastName: Patient's last name
- email: Patient's email address
- phone: Patient's phone number
- dateOfBirth: Patient's date of birth (YYYY-MM-DD format)
- gender: Patient's gender (Male, Female, or Other)
- address: Patient's complete address

Example transformation:
"Register John Doe, email john@example.com, phone 555-0123, born January 15, 1985, male, lives at 123 Main St, Anytown, USA"
→ {
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "555-0123",
  "dateOfBirth": "1985-01-15",
  "gender": "Male",
  "address": "123 Main St, Anytown, USA"
}
`,
      'medical-history': `
Extract and structure the following medical history information:
- chief_complaint: Primary reason for visit in clinical terms
- history_of_present_illness: Detailed chronological description
- past_medical_history: Previous diagnoses, surgeries, chronic conditions
- allergies: Known drug/food allergies or "No known allergies"
- current_medications: Current medications with doses if mentioned

Example transformation:
"Patient has fever for 3 days, took paracetamol, no allergies"
→ {
  "chief_complaint": "Three-day history of fever",
  "history_of_present_illness": "Patient reports fever persisting for three days. Took paracetamol with temporary relief.",
  "past_medical_history": "",
  "allergies": "No known drug allergies",
  "current_medications": "Paracetamol as needed for fever"
}
`,
      'clinical-examination': `
Extract and structure clinical examination findings:
- general_examination: Overall appearance, consciousness, distress level
- vital_signs: Object containing bloodPressure, heartRate, respiratoryRate, temperature, oxygenSaturation
- systemic_examination: Findings by system (cardiovascular, respiratory, etc.)

Example transformation:
"BP 120/80, heart rate 72, patient alert, lungs clear"
→ {
  "general_examination": "Patient is alert and oriented, in no acute distress",
  "vital_signs": {
    "bloodPressure": "120/80 mmHg",
    "heartRate": "72 bpm",
    "respiratoryRate": "",
    "temperature": "",
    "oxygenSaturation": ""
  },
  "systemic_examination": {
    "cardiovascular": "Regular rate and rhythm",
    "respiratory": "Lungs clear to auscultation bilaterally"
  }
}
`,
      'diagnosis-treatment': `
Extract and structure diagnosis and treatment information:
- diagnosis: Primary and secondary diagnoses in clinical terms
- treatment_given: Immediate interventions and procedures
- medications_prescribed: Complete medication orders with doses
- advice_and_follow_up: Discharge instructions and follow-up plan

Example transformation:
"Diagnosed pneumonia, started ceftriaxone, follow up in 1 week"
→ {
  "diagnosis": "Community-acquired pneumonia",
  "treatment_given": "Patient was initiated on intravenous antibiotic therapy",
  "medications_prescribed": "Ceftriaxone 1g IV once daily",
  "advice_and_follow_up": "Follow-up appointment in 1 week for reassessment"
}
`,
      'discharge-form': `
Extract and structure discharge summary information:
- admission_reason: Primary reason for hospital admission
- final_diagnosis: Confirmed diagnoses at discharge
- treatment_summary: Hospital course and interventions provided
- discharge_medications: Complete discharge medication list
- follow_up_instructions: Specific follow-up instructions and appointments

Example transformation:
"Admitted for chest pain, ruled out MI, discharged on aspirin"
→ {
  "admission_reason": "Evaluation of chest pain",
  "final_diagnosis": "Chest pain, myocardial infarction ruled out",
  "treatment_summary": "Patient underwent cardiac evaluation including serial enzymes and ECG monitoring. Myocardial infarction was ruled out.",
  "discharge_medications": "Aspirin 81mg daily",
  "follow_up_instructions": "Follow up with primary care physician in 1 week, return to emergency department for recurrent chest pain"
}
`
    };

    const messages = [
      {
        role: 'system',
        content: systemPrompt + (formPrompts[formType] || '')
      },
      {
        role: 'user',
        content: `"${transcript}"\n\nConvert this dictation into structured medical documentation following the guidelines above.\nReturn ONLY valid JSON.`
      }
    ];

    // Make the API call to OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.2,
      max_tokens: 2000,
      ...(enableTools && {
        tools: Object.entries(availableTools).map(([name, tool]) => ({
          type: 'function',
          function: {
            name,
            description: tool.description,
            parameters: tool.parameters
          }
        })),
        tool_choice: 'auto'
      })
    });

    const response = completion.choices[0].message;

    // Handle tool calls if present
    if (response.tool_calls) {
      const toolResults = [];

      for (const toolCall of response.tool_calls) {
        try {
          const result = await executeTool(
            toolCall.function.name,
            JSON.parse(toolCall.function.arguments)
          );
          toolResults.push({
            tool: toolCall.function.name,
            result: result
          });
        } catch (error) {
          toolResults.push({
            tool: toolCall.function.name,
            error: error.message
          });
        }
      }

      // Make a follow-up call with tool results
      const followupMessages = [
        ...messages,
        response,
        {
          role: 'tool',
          content: JSON.stringify(toolResults)
        }
      ];

      const followupCompletion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: followupMessages,
        temperature: 0.2,
        max_tokens: 2000
      });

      const finalResponse = followupCompletion.choices[0].message.content;
      const json = JSON.parse(finalResponse);
      res.json({
        ...json,
        toolResults: toolResults
      });
    } else {
      // Regular response without tools
      const json = JSON.parse(response.content);
      res.json(json);
    }

  } catch (err) {
    console.error('AI Processing Error:', err);
    res.status(500).json({
      error: 'AI failed',
      details: err.message,
      chief_complaint: transcript || 'Unable to process voice input'
    });
  }
});

  const formPrompts = {
    'medical-history': `
Extract and structure the following medical history information:
- chief_complaint: Primary reason for visit in clinical terms
- history_of_present_illness: Detailed chronological description
- past_medical_history: Previous diagnoses, surgeries, chronic conditions
- allergies: Known drug/food allergies or "No known allergies"
- current_medications: Current medications with doses if mentioned

Example transformation:
"Patient has fever for 3 days, took paracetamol, no allergies" 
→ {
  "chief_complaint": "Three-day history of fever",
  "history_of_present_illness": "Patient reports fever persisting for three days. Took paracetamol with temporary relief.",
  "past_medical_history": "",
  "allergies": "No known drug allergies",
  "current_medications": "Paracetamol as needed for fever"
}
`,
    'clinical-examination': `
Extract and structure clinical examination findings:
- general_examination: Overall appearance, consciousness, distress level
- vital_signs: Object containing bloodPressure, heartRate, respiratoryRate, temperature, oxygenSaturation
- systemic_examination: Findings by system (cardiovascular, respiratory, etc.)

Example transformation:
"BP 120/80, heart rate 72, patient alert, lungs clear"
→ {
  "general_examination": "Patient is alert and oriented, in no acute distress",
  "vital_signs": {
    "bloodPressure": "120/80 mmHg",
    "heartRate": "72 bpm",
    "respiratoryRate": "",
    "temperature": "",
    "oxygenSaturation": ""
  },
  "systemic_examination": {
    "cardiovascular": "Regular rate and rhythm",
    "respiratory": "Lungs clear to auscultation bilaterally"
  }
}
`,
    'diagnosis-treatment': `
Extract and structure diagnosis and treatment information:
- diagnosis: Primary and secondary diagnoses in clinical terms
- treatment_given: Immediate interventions and procedures
- medications_prescribed: Complete medication orders with doses
- advice_and_follow_up: Discharge instructions and follow-up plan

Example transformation:
"Diagnosed pneumonia, started ceftriaxone, follow up in 1 week"
→ {
  "diagnosis": "Community-acquired pneumonia",
  "treatment_given": "Patient was initiated on intravenous antibiotic therapy",
  "medications_prescribed": "Ceftriaxone 1g IV once daily",
  "advice_and_follow_up": "Follow-up appointment in 1 week for reassessment"
}
`,
    'discharge-form': `
Extract and structure discharge summary information:
- admission_reason: Primary reason for hospital admission
- final_diagnosis: Confirmed diagnoses at discharge
- treatment_summary: Hospital course and interventions provided
- discharge_medications: Complete discharge medication list
- follow_up_instructions: Specific follow-up instructions and appointments

Example transformation:
"Admitted for chest pain, ruled out MI, discharged on aspirin"
→ {
  "admission_reason": "Evaluation of chest pain",
  "final_diagnosis": "Chest pain, myocardial infarction ruled out",
  "treatment_summary": "Patient underwent cardiac evaluation including serial enzymes and ECG monitoring. Myocardial infarction was ruled out.",
  "discharge_medications": "Aspirin 81mg daily",
  "follow_up_instructions": "Follow up with primary care physician in 1 week, return to emergency department for recurrent chest pain"
}
`,
  };

  try {
    // Demo mode - simulate AI responses for testing
    if (process.env.DEMO_MODE === 'true') {
      const demoResponses = {
        'medical-history': {
          chief_complaint: "Three-day history of fever",
          history_of_present_illness: "Patient reports fever persisting for three days. Took paracetamol with temporary relief.",
          past_medical_history: "",
          allergies: "No known drug allergies",
          current_medications: "Paracetamol as needed for fever"
        },
        'clinical-examination': {
          general_examination: "Patient is alert and oriented, in no acute distress",
          vital_signs: {
            bloodPressure: "120/80 mmHg",
            heartRate: "72 bpm",
            respiratoryRate: "16 breaths/min",
            temperature: "98.6°F",
            oxygenSaturation: "98%"
          },
          systemic_examination: {
            cardiovascular: "Regular rate and rhythm",
            respiratory: "Lungs clear to auscultation bilaterally"
          }
        },
        'diagnosis-treatment': {
          diagnosis: "Community-acquired pneumonia",
          treatment_given: "Patient was initiated on intravenous antibiotic therapy",
          medications_prescribed: "Ceftriaxone 1g IV once daily",
          advice_and_follow_up: "Follow-up appointment in 1 week for reassessment"
        },
        'discharge-form': {
          admission_reason: "Evaluation of chest pain",
          final_diagnosis: "Chest pain, myocardial infarction ruled out",
          treatment_summary: "Patient underwent cardiac evaluation including serial enzymes and ECG monitoring. Myocardial infarction was ruled out.",
          discharge_medications: "Aspirin 81mg daily",
          follow_up_instructions: "Follow up with primary care physician in 1 week, return to emergency department for recurrent chest pain"
        }
      };
      
      const response = demoResponses[formType] || {};
      console.log('Demo mode - returning simulated response:', response);
      return res.json(response);
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `
Doctor dictation:
"${transcript}"

${formPrompts[formType]}

Convert this dictation into structured medical documentation following the guidelines above.
Return ONLY valid JSON.
`,
        },
      ],
      temperature: 0.2,
    });

    const json = JSON.parse(completion.choices[0].message.content);
    res.json(json);
  } catch (err) {
    console.error('AI Processing Error:', err);
    res.status(500).json({ error: 'AI failed', details: err.message });
  }
});

*/
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Medical site server running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`- Patients: /api/patients`);
  console.log(`- Doctors: /api/doctors`);
  console.log(`- Appointments: /api/appointments`);
  console.log(`- Visits: /api/visits`);
  console.log(`- Medical Records: /api/medical-records`);
  console.log(`- AI Processing: /api/medical-ai`);
  console.log(`- Auth: /api/auth`);
});
