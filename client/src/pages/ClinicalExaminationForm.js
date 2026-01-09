import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Heart, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../utils/axios';
import AIVoiceToText from '../components/AIVoiceToText';
import VoiceTest from '../components/VoiceTest';
import MedicalFormLayout, { MedicalFormSection, MedicalFormField, MedicalFormGrid } from '../components/MedicalFormLayout';

const ClinicalExaminationForm = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm();

  const handleAITranscript = (structuredData) => {
    // Map AI-structured data to form fields
    if (structuredData.general_examination) {
      setValue('generalAppearance.notes', structuredData.general_examination);
    }
    
    if (structuredData.vital_signs) {
      Object.entries(structuredData.vital_signs).forEach(([key, value]) => {
        if (value) {
          const formKey = `vitalSigns.${key}`;
          setValue(formKey, value);
        }
      });
    }
    
    if (structuredData.systemic_examination) {
      Object.entries(structuredData.systemic_examination).forEach(([key, value]) => {
        if (value) {
          const formKey = `systemicExamination.${key}`;
          setValue(formKey, value);
        }
      });
    }
    
    toast.success('AI data populated to form fields');
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
        if (visitToUse?.forms?.clinicalExamination?.data) {
          const formData = visitToUse.forms.clinicalExamination.data;
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
        await API.put(`/visits/${currentVisit._id}/forms/clinicalExamination`, {
          data: data
        });
        toast.success('Clinical examination form saved successfully');
      } else {
        // Create new visit and save form
        const visitResponse = await API.post(`/visits/create/${patientId}`, {
          chiefComplaint: 'Clinical examination visit'
        });
        
        await API.put(`/visits/${visitResponse.data._id}/forms/clinicalExamination`, {
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
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Voice Test Component */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <VoiceTest />
      </div>
      
      {patient && (
        <MedicalFormLayout
          title="Clinical Examination"
          subtitle="Comprehensive physical examination and assessment"
          patient={patient}
          onSave={handleSubmit(onSubmit)}
          onBack={() => navigate(`/patients/${patientId}/forms`)}
          isLoading={isLoading}
          saveButtonText="Save Examination"
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-0">
            {/* Vital Signs */}
            <MedicalFormSection title="Vital Signs" icon={Heart}>
              <MedicalFormGrid columns={4}>
                <MedicalFormField label="Blood Pressure">
                  <input
                    {...register('vitalSigns.bloodPressure')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="120/80 mmHg"
                  />
                </MedicalFormField>
                <MedicalFormField label="Heart Rate">
                  <input
                    {...register('vitalSigns.heartRate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="72 bpm"
                  />
                </MedicalFormField>
                <MedicalFormField label="Respiratory Rate">
                  <input
                    {...register('vitalSigns.respiratoryRate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="16 breaths/min"
                  />
                </MedicalFormField>
                <MedicalFormField label="Temperature">
                  <input
                    {...register('vitalSigns.temperature')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="98.6°F"
                  />
                </MedicalFormField>
                <MedicalFormField label="Oxygen Saturation">
                  <input
                    {...register('vitalSigns.oxygenSaturation')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="98%"
                  />
                </MedicalFormField>
                <MedicalFormField label="Height">
                  <input
                    {...register('vitalSigns.height')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="5'10&quot;"
                  />
                </MedicalFormField>
                <MedicalFormField label="Weight">
                  <input
                    {...register('vitalSigns.weight')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="170 lbs"
                  />
                </MedicalFormField>
                <MedicalFormField label="BMI">
                  <input
                    {...register('vitalSigns.bmi')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="24.4"
                  />
                </MedicalFormField>
              </MedicalFormGrid>
            </MedicalFormSection>

            {/* General Appearance */}
            <MedicalFormSection title="General Appearance" icon={Activity}>
              <MedicalFormGrid columns={2}>
                <MedicalFormField label="Consciousness">
                  <select
                    {...register('generalAppearance.consciousness')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="alert">Alert</option>
                    <option value="lethargic">Lethargic</option>
                    <option value="stuporous">Stuporous</option>
                    <option value="comatose">Comatose</option>
                  </select>
                </MedicalFormField>
                <MedicalFormField label="Distress Level">
                  <select
                    {...register('generalAppearance.distress')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select...</option>
                    <option value="none">None</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                </MedicalFormField>
              </MedicalFormGrid>
              
              <MedicalFormField 
                label="Notes" 
                description="General appearance observations and overall assessment"
                className="mt-6"
              >
                <div className="relative">
                  <textarea
                    {...register('generalAppearance.notes')}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                    placeholder="Patient appears well-developed, well-nourished, in no acute distress..."
                  />
                  <AIVoiceToText 
                    onTranscript={handleAITranscript}
                    formType="clinical-examination"
                    placeholder="Describe general appearance, consciousness level, distress..."
                  />
                </div>
              </MedicalFormField>
            </MedicalFormSection>

            {/* Assessment and Plan */}
            <MedicalFormSection title="Assessment and Plan">
              <MedicalFormField 
                label="Assessment" 
                description="Clinical assessment and diagnosis"
                required
              >
                <div className="relative">
                  <textarea
                    {...register('assessment', { required: 'Assessment is required' })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                    placeholder="Patient presents with..."
                  />
                  <AIVoiceToText 
                    onTranscript={(data) => {
                      if (data.diagnosis) {
                        setValue('assessment', data.diagnosis);
                      }
                    }}
                    formType="diagnosis-treatment"
                    placeholder="Provide clinical assessment, diagnosis, and working diagnosis..."
                  />
                </div>
                {errors.assessment && (
                  <p className="text-xs text-red-600 mt-1">{errors.assessment.message}</p>
                )}
              </MedicalFormField>

              <MedicalFormField 
                label="Plan" 
                description="Treatment plan and follow-up"
                required
                className="mt-6"
              >
                <div className="relative">
                  <textarea
                    {...register('plan', { required: 'Plan is required' })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                    placeholder="1. Continue current medications..."
                  />
                  <AIVoiceToText 
                    onTranscript={(data) => {
                      const planText = [
                        data.treatment_given,
                        data.medications_prescribed,
                        data.advice_and_follow_up
                      ].filter(Boolean).join('\n');
                      if (planText) {
                        setValue('plan', planText);
                      }
                    }}
                    formType="diagnosis-treatment"
                    placeholder="Describe treatment plan, medications, and follow-up instructions..."
                  />
                </div>
                {errors.plan && (
                  <p className="text-xs text-red-600 mt-1">{errors.plan.message}</p>
                )}
              </MedicalFormField>
            </MedicalFormSection>
          </form>
        </MedicalFormLayout>
      )}
    </div>
  );
};

export default ClinicalExaminationForm;
