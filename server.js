const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
});

app.post('/api/medical-ai', async (req, res) => {
  const { transcript, formType } = req.body;

  const systemPrompt = `
You are a voice-enabled medical documentation assistant. Your job is to convert clinician dictation into structured, medical-grade documentation.

Strict rules:
- Do NOT diagnose, prescribe, or make medical decisions.
- Do NOT add facts that were not explicitly stated by the clinician.
- Only rewrite and organize the provided information.
- Keep the clinician fully in control of the final content.
- Return ONLY valid JSON structured for the specific form type.

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
`,
  };

  try {
    // Demo mode - simulate AI responses for testing
    if (process.env.DEMO_MODE === 'true') {
      const demoResponses = {
        'patient-registration': {
          firstName: "John",
          lastName: "Doe",
          email: "john.doe@example.com",
          phone: "555-0123",
          dateOfBirth: "1985-01-15",
          gender: "Male",
          address: "123 Main Street, Anytown, USA"
        },
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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
