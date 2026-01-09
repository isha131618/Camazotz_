import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Brain, Stethoscope, Pill, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../utils/axios';
import AIVoiceToText from '../components/AIVoiceToText';
import MedicalFormLayout, { MedicalFormSection, MedicalFormField, MedicalFormGrid } from '../components/MedicalFormLayout';

const DiagnosisTreatmentForm = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const handleAITranscript = (structuredData) => {
    // Map AI-structured data to form fields
    if (structuredData.diagnosis) {
      setValue('primaryDiagnosis', structuredData.diagnosis);
    }
    
    if (structuredData.treatment_given) {
      setValue('treatmentPlan', structuredData.treatment_given);
    }
    
    if (structuredData.medications_prescribed) {
      setValue('medications', structuredData.medications_prescribed);
    }
    
    if (structuredData.advice_and_follow_up) {
      setValue('followUpPlan', structuredData.advice_and_follow_up);
    }
    
    toast.success('AI data populated to form fields');
  };

  const handleTranscriptUpdate = (text) => {
    if (!focusedField) return;
    setValue(focusedField, text, { shouldDirty: true });
  };

  const fetchPatientData = useCallback(async () => {
    try {
      // Get patient details
      const patientResponse = await API.get(`/patients/${patientId}`);
      setPatient(patientResponse.data);

      // Get current visit (optional - forms can be filled without active visit)
      try {
        const visitResponse = await API.get(`/visits/patient/${patientId}`);
        const visits = visitResponse.data || [];
        const activeVisit = visits.find(visit => visit.status === 'Active');
        const latestVisit = visits.length > 0 ? visits[visits.length - 1] : null;
        const visitToUse = activeVisit || latestVisit;
        setCurrentVisit(visitToUse);

        // Load existing form data if available
        if (visitToUse?.forms?.diagnosisTreatment?.data) {
          const formData = visitToUse.forms.diagnosisTreatment.data;
          const setDeepValues = (obj, prefix = '') => {
            if (!obj || typeof obj !== 'object') return;

            Object.entries(obj).forEach(([key, value]) => {
              const nextPath = prefix ? `${prefix}.${key}` : key;

              if (value && typeof value === 'object' && !Array.isArray(value)) {
                setDeepValues(value, nextPath);
                return;
              }

              setValue(nextPath, value);
            });
          };

          setDeepValues(formData);
        }
      } catch (error) {
        // No visits found - that's okay, forms can be filled without visits
        setCurrentVisit(null);
      }
    } catch (error) {
      toast.error('Failed to fetch patient data');
    }
  }, [patientId, setValue]);

  useEffect(() => {
    fetchPatientData();
  }, [patientId, fetchPatientData]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (currentVisit) {
        // Save to existing visit
        await API.put(`/visits/${currentVisit._id}/forms/diagnosisTreatment`, {
          data: data
        });
        toast.success('Diagnosis and treatment form saved successfully');
      } else {
        // Create new visit and save form
        const visitResponse = await API.post(`/visits/create/${patientId}`, {
          chiefComplaint: 'Diagnosis and treatment visit'
        });
        
        await API.put(`/visits/${visitResponse.data._id}/forms/diagnosisTreatment`, {
          data: data
        });
        
        setCurrentVisit(visitResponse.data);
        toast.success('New visit created and form saved successfully');
      }
    } catch (error) {
      toast.error('Failed to save form');
    } finally {
      setIsLoading(false);
    }
  };

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <MedicalFormLayout
      title="Diagnosis and Treatment Plan"
      subtitle="Clinical diagnosis, differential diagnoses, and comprehensive treatment plan"
      patient={patient}
      onSave={handleSubmit(onSubmit)}
      onBack={() => navigate(`/patients/${patientId}/forms`)}
      isLoading={isLoading}
      saveButtonText="Save Treatment Plan"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
        {/* Primary Diagnosis */}
        <MedicalFormSection title="Primary Diagnosis" icon={Brain}>
          <MedicalFormField 
            label="Primary Diagnosis" 
            description="Main clinical diagnosis based on examination and findings"
            required
          >
            <div className="relative">
              <textarea
                {...register('primaryDiagnosis', { required: 'Primary diagnosis is required' })}
                onFocus={() => setFocusedField('primaryDiagnosis')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Enter primary diagnosis with ICD-10 code if available..."
              />
              <div className="absolute top-2 right-2">
                <AIVoiceToText 
                  mode="raw"
                  onTranscript={(text) => setValue('primaryDiagnosis', text)}
                  formType="diagnosis-treatment"
                  placeholder="State primary diagnosis, working diagnosis, and ICD codes..."
                />
              </div>
            </div>
            {errors.primaryDiagnosis && (
              <p className="text-xs text-red-600 mt-1">{errors.primaryDiagnosis.message}</p>
            )}
          </MedicalFormField>

          <MedicalFormField 
            label="Diagnosis Code" 
            description="ICD-10 diagnosis code"
          >
            <input
              {...register('diagnosisCode')}
              onFocus={() => setFocusedField('diagnosisCode')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., J45.909"
            />
          </MedicalFormField>

          <MedicalFormField 
            label="Clinical Severity" 
            description="Severity of the primary diagnosis"
          >
            <select
              {...register('severity')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select severity...</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
              <option value="critical">Critical</option>
            </select>
          </MedicalFormField>
        </MedicalFormSection>

        {/* Differential Diagnoses */}
        <MedicalFormSection title="Differential Diagnoses" icon={Stethoscope}>
          <MedicalFormField 
            label="Differential Diagnoses" 
            description="Alternative diagnoses to consider"
          >
            <div className="relative">
              <textarea
                {...register('differentialDiagnoses')}
                onFocus={() => setFocusedField('differentialDiagnoses')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="List alternative diagnoses with rationale..."
              />
              <div className="absolute top-2 right-2">
                <AIVoiceToText 
                  mode="raw"
                  onTranscript={(text) => setValue('differentialDiagnoses', text)}
                  formType="diagnosis-treatment"
                  placeholder="List alternative diagnoses with rationale..."
                />
              </div>
            </div>
          </MedicalFormField>

          <MedicalFormField 
            label="Diagnostic Plan" 
            description="Further tests and investigations needed"
          >
            <div className="relative">
              <textarea
                {...register('diagnosticPlan')}
                onFocus={() => setFocusedField('diagnosticPlan')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Laboratory tests, imaging studies, consultations..."
              />
              <div className="absolute top-2 right-2">
                <AIVoiceToText 
                  mode="raw"
                  onTranscript={(text) => setValue('diagnosticPlan', text)}
                  formType="diagnosis-treatment"
                  placeholder="Laboratory tests, imaging studies, consultations..."
                />
              </div>
            </div>
          </MedicalFormField>
        </MedicalFormSection>

        {/* Treatment Plan */}
        <MedicalFormSection title="Treatment Plan" icon={Pill}>
          <MedicalFormGrid columns={2}>
            <MedicalFormField label="Treatment Setting">
              <select
                {...register('treatmentSetting')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select setting...</option>
                <option value="outpatient">Outpatient</option>
                <option value="inpatient">Inpatient</option>
                <option value="observation">Observation</option>
                <option value="emergency">Emergency</option>
              </select>
            </MedicalFormField>

            <MedicalFormField label="Treatment Urgency">
              <select
                {...register('treatmentUrgency')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select urgency...</option>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="emergent">Emergent</option>
              </select>
            </MedicalFormField>
          </MedicalFormGrid>

          <MedicalFormField 
            label="Medications" 
            description="Current and prescribed medications"
            className="mt-6"
          >
            <div className="relative">
              <textarea
                {...register('medications')}
                onFocus={() => setFocusedField('medications')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="List medications with dosage, frequency, and duration..."
              />
              <div className="absolute top-2 right-2">
                <AIVoiceToText 
                  mode="raw"
                  onTranscript={(text) => setValue('medications', text)}
                  formType="diagnosis-treatment"
                  placeholder="List planned procedures with indications..."
                />
              </div>
            </div>
          </MedicalFormField>

          <MedicalFormField 
            label="Procedures" 
            description="Planned medical or surgical procedures"
          >
            <div className="relative">
              <textarea
                {...register('procedures')}
                onFocus={() => setFocusedField('procedures')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="List planned procedures with indications..."
              />
              <div className="absolute top-2 right-2">
                <AIVoiceToText 
                  mode="raw"
                  onTranscript={(text) => setValue('procedures', text)}
                  formType="diagnosis-treatment"
                  placeholder="Physical therapy, occupational therapy, speech therapy..."
                />
              </div>
            </div>
          </MedicalFormField>

          <MedicalFormField 
            label="Therapy Interventions" 
            description="Physical therapy, occupational therapy, etc."
          >
            <div className="relative">
              <textarea
                {...register('therapyInterventions')}
                onFocus={() => setFocusedField('therapyInterventions')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Physical therapy, occupational therapy, speech therapy..."
              />
              <div className="absolute top-2 right-2">
                <AIVoiceToText 
                  mode="raw"
                  onTranscript={(text) => setValue('therapyInterventions', text)}
                  formType="diagnosis-treatment"
                  placeholder="Physical therapy, occupational therapy, etc."
                />
              </div>
            </div>
          </MedicalFormField>
        </MedicalFormSection>

        {/* Follow-up Plan */}
        <MedicalFormSection title="Follow-up Plan" icon={Calendar}>
          <MedicalFormGrid columns={2}>
            <MedicalFormField label="Follow-up Timeline">
              <select
                {...register('followupTimeline')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select timeline...</option>
                <option value="24-48-hours">24-48 hours</option>
                <option value="1-week">1 week</option>
                <option value="2-weeks">2 weeks</option>
                <option value="1-month">1 month</option>
                <option value="3-months">3 months</option>
                <option value="6-months">6 months</option>
                <option value="as-needed">As needed</option>
              </select>
            </MedicalFormField>

            <MedicalFormField label="Follow-up Type">
              <select
                {...register('followupType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select type...</option>
                <option value="in-person">In-person visit</option>
                <option value="telemedicine">Telemedicine</option>
                <option value="phone">Phone call</option>
                <option value="lab-only">Lab tests only</option>
              </select>
            </MedicalFormField>
          </MedicalFormGrid>

          <MedicalFormField 
            label="Follow-up Instructions" 
            description="Specific instructions for follow-up care"
            className="mt-6"
          >
            <div className="relative">
              <textarea
                {...register('followupInstructions')}
                onFocus={() => setFocusedField('followupInstructions')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Detailed follow-up instructions and monitoring parameters..."
              />
              <div className="absolute top-2 right-2">
                <AIVoiceToText 
                  mode="raw"
                  onTranscript={(text) => setValue('followupInstructions', text)}
                  formType="diagnosis-treatment"
                  placeholder="Detailed follow-up instructions and monitoring parameters..."
                />
              </div>
            </div>
          </MedicalFormField>

          <MedicalFormField 
            label="Red Flag Symptoms" 
            description="Symptoms that should prompt immediate medical attention"
          >
            <div className="relative">
              <textarea
                {...register('redFlagSymptoms')}
                onFocus={() => setFocusedField('redFlagSymptoms')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="List warning signs and symptoms that require urgent care..."
              />
              <div className="absolute top-2 right-2">
                <AIVoiceToText 
                  mode="raw"
                  onTranscript={(text) => setValue('redFlagSymptoms', text)}
                  formType="diagnosis-treatment"
                  placeholder="List warning signs and symptoms that require urgent care..."
                />
              </div>
            </div>
          </MedicalFormField>
        </MedicalFormSection>

        {/* Patient Education */}
        <MedicalFormSection title="Patient Education">
          <MedicalFormField 
            label="Patient Education" 
            description="Information provided to patient about condition and treatment"
          >
            <div className="relative">
              <textarea
                {...register('patientEducation')}
                onFocus={() => setFocusedField('patientEducation')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Education about diagnosis, treatment, prognosis, and self-care..."
              />
              <div className="absolute top-2 right-2">
                <AIVoiceToText 
                  mode="raw"
                  onTranscript={(text) => setValue('patientEducation', text)}
                  formType="diagnosis-treatment"
                  placeholder="Education about diagnosis, treatment, prognosis, and self-care..."
                />
              </div>
            </div>
          </MedicalFormField>

          <MedicalFormField 
            label="Lifestyle Modifications" 
            description="Recommended lifestyle changes"
          >
            <div className="relative">
              <textarea
                {...register('lifestyleModifications')}
                onFocus={() => setFocusedField('lifestyleModifications')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Diet, exercise, smoking cessation, alcohol reduction..."
              />
              <div className="absolute top-2 right-2">
                <AIVoiceToText 
                  mode="raw"
                  onTranscript={(text) => setValue('lifestyleModifications', text)}
                  formType="diagnosis-treatment"
                  placeholder="Diet, exercise, smoking cessation, alcohol reduction..."
                />
              </div>
            </div>
          </MedicalFormField>
        </MedicalFormSection>

        {/* Clinical Notes */}
        <MedicalFormSection title="Clinical Notes">
          <MedicalFormField 
            label="Assessment Summary" 
            description="Overall clinical assessment and reasoning"
            required
          >
            <div className="relative">
              <textarea
                {...register('assessmentSummary', { required: 'Assessment summary is required' })}
                onFocus={() => setFocusedField('assessmentSummary')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Comprehensive clinical assessment and diagnostic reasoning..."
              />
              <div className="absolute top-2 right-2">
                <AIVoiceToText 
                  mode="raw"
                  onTranscript={(text) => setValue('assessmentSummary', text)}
                  formType="diagnosis-treatment"
                  placeholder="Comprehensive clinical assessment and diagnostic reasoning..."
                />
              </div>
            </div>
            {errors.assessmentSummary && (
              <p className="text-xs text-red-600 mt-1">{errors.assessmentSummary.message}</p>
            )}
          </MedicalFormField>

          <MedicalFormField 
            label="Treatment Rationale" 
            description="Reasoning behind chosen treatment approach"
          >
            <div className="relative">
              <textarea
                {...register('treatmentRationale')}
                onFocus={() => setFocusedField('treatmentRationale')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Explanation of why this treatment plan was chosen..."
              />
              <div className="absolute top-2 right-2">
                <AIVoiceToText 
                  mode="raw"
                  onTranscript={(text) => setValue('treatmentRationale', text)}
                  formType="diagnosis-treatment"
                  placeholder="Explanation of why this treatment plan was chosen..."
                />
              </div>
            </div>
          </MedicalFormField>
        </MedicalFormSection>
      </form>
    </MedicalFormLayout>
  );
};

export default DiagnosisTreatmentForm;
