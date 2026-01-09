import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, AlertTriangle, Plus, Trash2, Bot, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../utils/axios';
import AIAgent from '../components/AIAgent';
import AIVoiceToText from '../components/AIVoiceToText';

const MedicalHistoryForm = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allergies, setAllergies] = useState(['']);
  const [medications, setMedications] = useState(['']);
  const [medicalConditions, setMedicalConditions] = useState(['']);
  const [surgeries, setSurgeries] = useState([{ year: '', procedure: '', complications: '' }]);
  const [familyHistory, setFamilyHistory] = useState([{ condition: '', relationship: '' }]);
  const [showAIAgent, setShowAIAgent] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      // Get patient details
      const patientResponse = await API.get(`/patients/${patientId}`);
      setPatient(patientResponse.data);

      // Get most recent visit (active preferred)
      const visitResponse = await API.get(`/visits/patient/${patientId}`);
      const visits = visitResponse.data || [];
      const activeVisit = visits.find(visit => visit.status === 'Active');
      const latestVisit = visits.length > 0 ? visits[visits.length - 1] : null;
      const visitToUse = activeVisit || latestVisit;
      setCurrentVisit(visitToUse);

      // Load existing form data if available
      if (visitToUse?.forms?.medicalHistory?.data) {
        const formData = visitToUse.forms.medicalHistory.data;
        Object.keys(formData).forEach(key => {
          setValue(key, formData[key]);
        });
        if (formData.allergies) setAllergies(formData.allergies);
        if (formData.medications) setMedications(formData.medications);
        if (formData.medicalConditions) setMedicalConditions(formData.medicalConditions);
        if (formData.surgeries) setSurgeries(formData.surgeries);
        if (formData.familyHistory) setFamilyHistory(formData.familyHistory);
      }
    } catch (error) {
      toast.error('Failed to fetch patient data');
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const formData = {
        ...data,
        allergies: allergies.filter(a => a.trim()),
        medications: medications.filter(m => m.trim()),
        medicalConditions: medicalConditions.filter(m => m.trim()),
        surgeries: surgeries.filter(s => s.procedure.trim()),
        familyHistory: familyHistory.filter(f => f.condition.trim())
      };

      if (currentVisit) {
        await API.put(`/visits/${currentVisit._id}/forms/medicalHistory`, {
          data: formData
        });
        toast.success('Medical history saved successfully');
        navigate(`/patients/${patientId}/forms`);
      } else {
        const visitResponse = await API.post(`/visits/create/${patientId}`, {
          chiefComplaint: 'Medical history visit'
        });
        await API.put(`/visits/${visitResponse.data._id}/forms/medicalHistory`, {
          data: formData
        });
        setCurrentVisit(visitResponse.data);
        toast.success('New visit created and medical history saved');
        navigate(`/patients/${patientId}/forms`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save medical history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIData = (data) => {
    // Auto-fill form with AI-extracted data
    if (data.chief_complaint) setValue('chiefComplaint', data.chief_complaint);
    if (data.history_of_present_illness) setValue('historyOfPresentIllness', data.history_of_present_illness);
    if (data.past_medical_history) setValue('pastMedicalHistory', data.past_medical_history);
    if (data.allergies) setAllergies(data.allergies.split(',').map(a => a.trim()));
    if (data.current_medications) setMedications(data.current_medications.split(',').map(m => m.trim()));
    
    toast.success('Form auto-filled with AI-extracted data');
  };

  const addField = (setter, current) => {
    setter([...current, '']);
  };

  const removeField = (setter, current, index) => {
    setter(current.filter((_, i) => i !== index));
  };

  const updateField = (setter, current, index, value) => {
    const updated = [...current];
    updated[index] = value;
    setter(updated);
  };
  const updateNestedField = (setter, current, index, key, value) => {
    const updated = [...current];
    updated[index] = { ...updated[index], [key]: value };
    setter(updated);
  };

  const handleTranscriptUpdate = (text) => {
    if (!focusedField) return;

    if (focusedField.type === 'form') {
      setValue(focusedField.name, text, { shouldDirty: true });
      return;
    }

    if (focusedField.type === 'allergies') {
      updateField(setAllergies, allergies, focusedField.index, text);
      return;
    }

    if (focusedField.type === 'medications') {
      updateField(setMedications, medications, focusedField.index, text);
      return;
    }

    if (focusedField.type === 'medicalConditions') {
      updateField(setMedicalConditions, medicalConditions, focusedField.index, text);
      return;
    }

    if (focusedField.type === 'surgeries') {
      updateNestedField(setSurgeries, surgeries, focusedField.index, focusedField.key, text);
      return;
    }

    if (focusedField.type === 'familyHistory') {
      updateNestedField(setFamilyHistory, familyHistory, focusedField.index, focusedField.key, text);
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <button
              onClick={() => navigate(`/patients/${patientId}/forms`)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-light text-gray-900">Medical History</h1>
              <p className="text-sm text-gray-500 mt-1">
                {patient.firstName} {patient.lastName} • {patient.medicalId}
              </p>
            </div>
          </div>
        </div>

        {/* AI Agent Section */}
        <div className="mb-8">
          <button
            onClick={() => setShowAIAgent(!showAIAgent)}
            className="flex items-center space-x-2 w-full p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:from-blue-100 hover:to-indigo-100 transition-colors duration-200"
          >
            <Bot className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">AI Voice Assistant</span>
            {showAIAgent ? (
              <ChevronUp className="w-4 h-4 text-blue-600 ml-auto" />
            ) : (
              <ChevronDown className="w-4 h-4 text-blue-600 ml-auto" />
            )}
          </button>
          
          {showAIAgent && (
            <div className="mt-4">
              <AIAgent
                onFormData={handleAIData}
                onTranscriptUpdate={handleTranscriptUpdate}
                currentFormType="medical-history"
              />
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Chief Complaint */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Chief Complaint
            </h2>
            <div className="relative">
              <textarea
                {...register('chiefComplaint', { required: 'Chief complaint is required' })}
                onFocus={() => setFocusedField({ type: 'form', name: 'chiefComplaint' })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Describe the patient's main reason for visit..."
              />
              <div className="absolute top-2 right-2">
                <AIVoiceToText
                  mode="raw"
                  onTranscript={(text) => setValue('chiefComplaint', text)}
                />
              </div>
            </div>
            {errors.chiefComplaint && (
              <p className="text-red-500 text-sm mt-1">{errors.chiefComplaint.message}</p>
            )}
          </div>

          {/* Present Illness */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
              History of Present Illness
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Onset</label>
                <input
                  {...register('presentIllness.onset')}
                  onFocus={() => setFocusedField({ type: 'form', name: 'presentIllness.onset' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="When did symptoms start?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                <input
                  {...register('presentIllness.duration')}
                  onFocus={() => setFocusedField({ type: 'form', name: 'presentIllness.duration' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="How long have symptoms persisted?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Progression</label>
                <div className="relative">
                  <textarea
                    {...register('presentIllness.progression')}
                    onFocus={() => setFocusedField({ type: 'form', name: 'presentIllness.progression' })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                    placeholder="How have symptoms changed over time?"
                  />
                  <div className="absolute top-2 right-2">
                    <AIVoiceToText
                      mode="raw"
                      onTranscript={(text) => setValue('presentIllness.progression', text)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                Allergies
              </h2>
              <button
                type="button"
                onClick={() => addField(setAllergies, allergies)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <div className="space-y-2">
              {allergies.map((allergy, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    value={allergy}
                    onChange={(e) => updateField(setAllergies, allergies, index, e.target.value)}
                    onFocus={() => setFocusedField({ type: 'allergies', index })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Penicillin, Peanuts, Latex"
                  />
                  {allergies.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(setAllergies, allergies, index)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Medications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900">Current Medications</h2>
              <button
                type="button"
                onClick={() => addField(setMedications, medications)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <div className="space-y-2">
              {medications.map((medication, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    value={medication}
                    onChange={(e) => updateField(setMedications, medications, index, e.target.value)}
                    onFocus={() => setFocusedField({ type: 'medications', index })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Lisinopril 10mg daily"
                  />
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(setMedications, medications, index)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Medical Conditions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900">Medical Conditions</h2>
              <button
                type="button"
                onClick={() => addField(setMedicalConditions, medicalConditions)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <div className="space-y-2">
              {medicalConditions.map((condition, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    value={condition}
                    onChange={(e) => updateField(setMedicalConditions, medicalConditions, index, e.target.value)}
                    onFocus={() => setFocusedField({ type: 'medicalConditions', index })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Hypertension, Diabetes Type 2"
                  />
                  {medicalConditions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeField(setMedicalConditions, medicalConditions, index)}
                      className="p-1 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Surgical History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900">Surgical History</h2>
              <button
                type="button"
                onClick={() => setSurgeries([...surgeries, { year: '', procedure: '', complications: '' }])}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Surgery</span>
              </button>
            </div>
            <div className="space-y-4">
              {surgeries.map((surgery, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                      <input
                        type="number"
                        value={surgery.year}
                        onChange={(e) => {
                          const updated = [...surgeries];
                          updated[index].year = e.target.value;
                          setSurgeries(updated);
                        }}
                        onFocus={() => setFocusedField({ type: 'surgeries', index, key: 'year' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., 2020"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Procedure</label>
                      <input
                        value={surgery.procedure}
                        onChange={(e) => {
                          const updated = [...surgeries];
                          updated[index].procedure = e.target.value;
                          setSurgeries(updated);
                        }}
                        onFocus={() => setFocusedField({ type: 'surgeries', index, key: 'procedure' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Appendectomy"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Complications</label>
                      <input
                        value={surgery.complications}
                        onChange={(e) => {
                          const updated = [...surgeries];
                          updated[index].complications = e.target.value;
                          setSurgeries(updated);
                        }}
                        onFocus={() => setFocusedField({ type: 'surgeries', index, key: 'complications' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., None"
                      />
                    </div>
                  </div>
                  {surgeries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSurgeries(surgeries.filter((_, i) => i !== index))}
                      className="mt-2 text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove Surgery
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Family History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
              <h2 className="text-lg font-medium text-gray-900">Family History</h2>
              <button
                type="button"
                onClick={() => setFamilyHistory([...familyHistory, { condition: '', relationship: '' }])}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
            <div className="space-y-4">
              {familyHistory.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                    <input
                      value={item.condition}
                      onChange={(e) => {
                        const updated = [...familyHistory];
                        updated[index].condition = e.target.value;
                        setFamilyHistory(updated);
                      }}
                      onFocus={() => setFocusedField({ type: 'familyHistory', index, key: 'condition' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Heart Disease"
                    />
                  </div>
                  <div className="flex items-end space-x-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                      <input
                        value={item.relationship}
                        onChange={(e) => {
                          const updated = [...familyHistory];
                          updated[index].relationship = e.target.value;
                          setFamilyHistory(updated);
                        }}
                        onFocus={() => setFocusedField({ type: 'familyHistory', index, key: 'relationship' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Father, Mother"
                      />
                    </div>
                    {familyHistory.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setFamilyHistory(familyHistory.filter((_, i) => i !== index))}
                        className="p-2 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Social History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
              Social History
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tobacco Use</label>
                <select
                  {...register('socialHistory.tobacco')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="never">Never</option>
                  <option value="former">Former</option>
                  <option value="current">Current</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alcohol Use</label>
                <select
                  {...register('socialHistory.alcohol')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select...</option>
                  <option value="none">None</option>
                  <option value="occasional">Occasional</option>
                  <option value="moderate">Moderate</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                <input
                  {...register('socialHistory.occupation')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Software Engineer"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(`/patients/${patientId}/forms`)}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Medical History</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicalHistoryForm;
