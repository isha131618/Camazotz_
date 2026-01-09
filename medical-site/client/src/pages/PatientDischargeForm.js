import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Save, 
  FileText, 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  MapPin, 
  Plus, 
  Trash2,
  ArrowLeft,
  Stethoscope,
  Building,
  Signature
} from 'lucide-react';
import API from '../utils/axios';
import AIVoiceToText from '../components/AIVoiceToText';

const PatientDischargeForm = () => {
  const navigate = useNavigate();
  const { patientId, id } = useParams();
  const resolvedPatientId = patientId || id;
  const [isLoading, setIsLoading] = useState(false);
  const [patient, setPatient] = useState(null);
  const [medications, setMedications] = useState([{ medication: '', dosage: '', amount: '', frequency: '', endDate: '' }]);
  const [focusedField, setFocusedField] = useState(null);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm({
    defaultValues: {
      patientName: '',
      patientId: resolvedPatientId || ''
    }
  });

  useEffect(() => {
    if (resolvedPatientId) {
      fetchPatientData();
      setValue('patientId', resolvedPatientId);
    }
    // Set default hospital info
    setValue('hospitalInfo.name', 'City General Hospital');
    setValue('hospitalInfo.address.street', '123 Main Street');
    setValue('hospitalInfo.address.city', 'Hamilton');
    setValue('hospitalInfo.address.state', 'OH');
    setValue('hospitalInfo.address.zipCode', '44416');
    setValue('hospitalInfo.phone', '(555) 123-4567');
    setValue('hospitalInfo.fax', '(555) 123-4568');
    setValue('hospitalInfo.email', 'info@citygeneralhospital.com');
    setValue('hospitalInfo.web', 'www.citygeneralhospital.com');
  }, [resolvedPatientId, setValue]);

  useEffect(() => {
    if (!patient) return;
    setValue('patientName', `${patient.firstName} ${patient.lastName}`);
  }, [patient, setValue]);

  const fetchPatientData = async () => {
    try {
      const response = await API.get(`/patients/${resolvedPatientId}`);
      const patientData = response.data;
      setPatient(patientData);

      const addressValue = typeof patientData.address === 'string'
        ? patientData.address
        : [
            patientData.address?.street,
            patientData.address?.city,
            patientData.address?.state,
            patientData.address?.zipCode
          ].filter(Boolean).join(', ');

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      reset((currentValues) => ({
        ...currentValues,
        patientName: `${patientData.firstName} ${patientData.lastName}`,
        patientId: patientData._id,
        patientContactInfo: {
          ...(currentValues.patientContactInfo || {}),
          address: addressValue,
          phone: patientData.phone,
          email: patientData.email
        },
        physicianApproval: currentUser?.name || currentValues.physicianApproval,
        signature: currentUser?.name || currentValues.signature
      }));
    } catch (error) {
      toast.error('Failed to fetch patient data');
    }
  };

  const addMedication = () => {
    setMedications([...medications, { medication: '', dosage: '', amount: '', frequency: '', endDate: '' }]);
  };

  const removeMedication = (index) => {
    const newMedications = medications.filter((_, i) => i !== index);
    setMedications(newMedications);
  };

  const updateMedication = (index, field, value) => {
    const newMedications = [...medications];
    newMedications[index][field] = value;
    setMedications(newMedications);
  };

  const handleAIData = (data) => {
    if (data.admission_reason) {
      setValue('reasonForAdmission', data.admission_reason);
    }
    if (data.final_diagnosis) {
      setValue('diagnosisAtDischarge', data.final_diagnosis);
    }
    if (data.treatment_summary) {
      setValue('treatmentSummary', data.treatment_summary);
    }
    const followUpText = [
      data.discharge_medications && `Medications: ${data.discharge_medications}`,
      data.follow_up_instructions && `Follow-up: ${data.follow_up_instructions}`
    ].filter(Boolean).join('\n');
    if (followUpText) {
      setValue('furtherTreatmentPlan', followUpText);
    }
    toast.success('AI data populated to form fields');
  };

  const handleTranscriptUpdate = (text) => {
    if (!focusedField) return;
    if (focusedField.type === 'medication') {
      updateMedication(focusedField.index, focusedField.field, text);
      return;
    }
    setValue(focusedField.name, text, { shouldDirty: true });
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const addressValue = typeof patient?.address === 'string'
        ? patient.address
        : [
            patient?.address?.street,
            patient?.address?.city,
            patient?.address?.state,
            patient?.address?.zipCode
          ].filter(Boolean).join(', ');
      const resolvedPatientName = patient
        ? `${patient.firstName} ${patient.lastName}`
        : data.patientName;
      const contactInfo = {
        address: data.patientContactInfo?.address || addressValue || 'Not provided',
        phone: data.patientContactInfo?.phone || patient?.phone || '',
        email: data.patientContactInfo?.email || patient?.email || ''
      };
      const cleanedMedications = medications.filter((med) =>
        [med.medication, med.dosage, med.amount, med.frequency, med.endDate].some(
          (value) => value && String(value).trim()
        )
      );
      const formData = {
        ...data,
        patientId: resolvedPatientId,
        patientName: resolvedPatientName,
        patientContactInfo: contactInfo,
        physicianApproval: data.physicianApproval || JSON.parse(localStorage.getItem('user') || '{}').name,
        signature: data.signature || JSON.parse(localStorage.getItem('user') || '{}').name,
        medications: cleanedMedications,
        dateOfSignature: new Date(),
        doctorId: JSON.parse(localStorage.getItem('user')).id
      };

      await API.post('/discharge-forms', formData);
      toast.success('Patient discharge form saved successfully!');
      navigate(`/patients/${resolvedPatientId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save discharge form');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Patient Discharge Form</h1>
          <p className="text-gray-600 mt-2">Complete the discharge form for the patient</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Form Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">PATIENT DISCHARGE FORM</h2>
              <div className="flex justify-center items-center space-x-2">
                <Building className="h-8 w-8 text-blue-600" />
                <span className="text-lg font-semibold text-gray-700">YOUR LOGO</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Hospital Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Hospital Information</h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
                  <input
                    {...register('hospitalInfo.name', { required: 'Hospital name is required' })}
                    onFocus={() => setFocusedField({ type: 'form', name: 'hospitalInfo.name' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    {...register('hospitalInfo.address.street')}
                    onFocus={() => setFocusedField({ type: 'form', name: 'hospitalInfo.address.street' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      {...register('hospitalInfo.address.city')}
                      onFocus={() => setFocusedField({ type: 'form', name: 'hospitalInfo.address.city' })}
                      placeholder="City"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      {...register('hospitalInfo.address.state')}
                      onFocus={() => setFocusedField({ type: 'form', name: 'hospitalInfo.address.state' })}
                      placeholder="State"
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      {...register('hospitalInfo.phone')}
                      onFocus={() => setFocusedField({ type: 'form', name: 'hospitalInfo.phone' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fax</label>
                    <input
                      {...register('hospitalInfo.fax')}
                      onFocus={() => setFocusedField({ type: 'form', name: 'hospitalInfo.fax' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      {...register('hospitalInfo.email')}
                      onFocus={() => setFocusedField({ type: 'form', name: 'hospitalInfo.email' })}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Web</label>
                    <input
                      {...register('hospitalInfo.web')}
                      onFocus={() => setFocusedField({ type: 'form', name: 'hospitalInfo.web' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Patient and Discharge Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 mb-4">Patient & Discharge Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                    <input
                      {...register('patientName', { required: 'Patient name is required' })}
                      onFocus={() => setFocusedField({ type: 'form', name: 'patientName' })}
                      value={patient ? `${patient.firstName} ${patient.lastName}` : ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                    <input
                      {...register('patientId', { required: 'Patient ID is required' })}
                      onFocus={() => setFocusedField({ type: 'form', name: 'patientId' })}
                      value={patient ? patient._id : resolvedPatientId || ''}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date Admitted</label>
                  <input
                    {...register('dateAdmitted', { required: 'Date admitted is required' })}
                    onFocus={() => setFocusedField({ type: 'form', name: 'dateAdmitted' })}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Discharge</label>
                  <input
                    {...register('dateOfDischarge', { required: 'Date of discharge is required' })}
                    onFocus={() => setFocusedField({ type: 'form', name: 'dateOfDischarge' })}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Physician Approval</label>
                  <input
                    {...register('physicianApproval', { required: 'Physician approval is required' })}
                    onFocus={() => setFocusedField({ type: 'form', name: 'physicianApproval' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Next Checkup</label>
                  <input
                    {...register('dateOfNextCheckup')}
                    onFocus={() => setFocusedField({ type: 'form', name: 'dateOfNextCheckup' })}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admission and Treatment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="font-semibold text-gray-900 mb-6">Admission and Treatment Details</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Admission</label>
                <div className="relative">
                  <textarea
                    {...register('reasonForAdmission', { required: 'Reason for admission is required' })}
                    onFocus={() => setFocusedField({ type: 'form', name: 'reasonForAdmission' })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <div className="absolute top-2 right-2">
                    <AIVoiceToText
                      mode="raw"
                      onTranscript={(text) => setValue('reasonForAdmission', text)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis at Admission</label>
                <div className="relative">
                  <textarea
                    {...register('diagnosisAtAdmission', { required: 'Diagnosis at admission is required' })}
                    onFocus={() => setFocusedField({ type: 'form', name: 'diagnosisAtAdmission' })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <div className="absolute top-2 right-2">
                    <AIVoiceToText
                      mode="raw"
                      onTranscript={(text) => setValue('diagnosisAtAdmission', text)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Summary</label>
                <div className="relative">
                  <textarea
                    {...register('treatmentSummary', { required: 'Treatment summary is required' })}
                    onFocus={() => setFocusedField({ type: 'form', name: 'treatmentSummary' })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <div className="absolute top-2 right-2">
                    <AIVoiceToText
                      mode="raw"
                      onTranscript={(text) => setValue('treatmentSummary', text)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Discharge</label>
                <div className="relative">
                  <textarea
                    {...register('reasonForDischarge', { required: 'Reason for discharge is required' })}
                    onFocus={() => setFocusedField({ type: 'form', name: 'reasonForDischarge' })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <div className="absolute top-2 right-2">
                    <AIVoiceToText
                      mode="raw"
                      onTranscript={(text) => setValue('reasonForDischarge', text)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis at Discharge</label>
                <div className="relative">
                  <textarea
                    {...register('diagnosisAtDischarge', { required: 'Diagnosis at discharge is required' })}
                    onFocus={() => setFocusedField({ type: 'form', name: 'diagnosisAtDischarge' })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <div className="absolute top-2 right-2">
                    <AIVoiceToText
                      mode="raw"
                      onTranscript={(text) => setValue('diagnosisAtDischarge', text)}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Further Treatment Plan</label>
                <div className="relative">
                  <textarea
                    {...register('furtherTreatmentPlan')}
                    onFocus={() => setFocusedField({ type: 'form', name: 'furtherTreatmentPlan' })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                  <div className="absolute top-2 right-2">
                    <AIVoiceToText
                      mode="raw"
                      onTranscript={(text) => setValue('furtherTreatmentPlan', text)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Contact Information & Medication */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="font-semibold text-gray-900 mb-6">Patient Contact Information & Medication</h3>
            
            {/* Contact Information */}
            <div className="mb-8">
              <h4 className="font-medium text-gray-800 mb-4">Contact Information</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <div className="relative">
                  <textarea
                    {...register('patientContactInfo.address', { required: 'Address is required' })}
                    onFocus={() => setFocusedField({ type: 'form', name: 'patientContactInfo.address' })}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                  />
                    <div className="absolute top-2 right-2">
                      <AIVoiceToText
                        mode="raw"
                        onTranscript={(text) => setValue('patientContactInfo.address', text)}
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      {...register('patientContactInfo.phone', { required: 'Phone is required' })}
                      onFocus={() => setFocusedField({ type: 'form', name: 'patientContactInfo.phone' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      {...register('patientContactInfo.email', { required: 'Email is required' })}
                      onFocus={() => setFocusedField({ type: 'form', name: 'patientContactInfo.email' })}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Medication Table */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-medium text-gray-800">Medication</h4>
                <button
                  type="button"
                  onClick={addMedication}
                  className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Medication
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Medication</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Dosage</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Amount</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">Frequency</th>
                      <th className="border border-gray-300 px-4 py-2 text-left text-sm font-medium text-gray-700">End Date</th>
                      <th className="border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map((med, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={med.medication}
                            onChange={(e) => updateMedication(index, 'medication', e.target.value)}
                            onFocus={() => setFocusedField({ type: 'medication', index, field: 'medication' })}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Medication name"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                            onFocus={() => setFocusedField({ type: 'medication', index, field: 'dosage' })}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Dosage"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={med.amount}
                            onChange={(e) => updateMedication(index, 'amount', e.target.value)}
                            onFocus={() => setFocusedField({ type: 'medication', index, field: 'amount' })}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Amount"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                            onFocus={() => setFocusedField({ type: 'medication', index, field: 'frequency' })}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Frequency"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="date"
                            value={med.endDate}
                            onChange={(e) => updateMedication(index, 'endDate', e.target.value)}
                            onFocus={() => setFocusedField({ type: 'medication', index, field: 'endDate' })}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => removeMedication(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Signature and Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <h3 className="font-semibold text-gray-900 mb-6">Signature and Notes</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signature</label>
                  <input
                    {...register('signature', { required: 'Signature is required' })}
                    onFocus={() => setFocusedField({ type: 'form', name: 'signature' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Doctor's Signature"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Signature</label>
                  <input
                    {...register('dateOfSignature', { required: 'Date of signature is required' })}
                    onFocus={() => setFocusedField({ type: 'form', name: 'dateOfSignature' })}
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <div className="relative">
                  <textarea
                    {...register('notes')}
                    onFocus={() => setFocusedField({ type: 'form', name: 'notes' })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                    placeholder="Additional notes..."
                  />
                  <div className="absolute top-2 right-2">
                    <AIVoiceToText
                      mode="raw"
                      onTranscript={(text) => setValue('notes', text)}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient Status</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      {...register('patientStatus')}
                      type="radio"
                      value="Discharged"
                      defaultChecked
                      className="mr-2"
                    />
                    <span className="text-sm">Discharged</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      {...register('patientStatus')}
                      type="radio"
                      value="Transferred"
                      className="mr-2"
                    />
                    <span className="text-sm">Transferred</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      {...register('patientStatus')}
                      type="radio"
                      value="Terminated"
                      className="mr-2"
                    />
                    <span className="text-sm">Terminated</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      {...register('patientStatus')}
                      type="radio"
                      value="Deceased"
                      className="mr-2"
                    />
                    <span className="text-sm">Deceased</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Discharge Form
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientDischargeForm;
