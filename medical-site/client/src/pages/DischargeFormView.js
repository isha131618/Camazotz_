import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Edit, Trash2, Printer, Download } from 'lucide-react';
import API from '../utils/axios';

const DischargeFormView = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDischargeForm();
  }, [formId]);

  const fetchDischargeForm = async () => {
    try {
      const response = await API.get(`/discharge-forms/${formId}`);
      setForm(response.data);
    } catch (error) {
      toast.error('Failed to fetch discharge form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this discharge form?')) {
      try {
        await API.delete(`/discharge-forms/${formId}`);
        toast.success('Discharge form deleted successfully');
        navigate(`/patients/${form.patientId}`);
      } catch (error) {
        toast.error('Failed to delete discharge form');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Discharge form not found</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-800"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Patient Discharge Form</h1>
            <p className="text-gray-600 mt-2">View and manage discharge information</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/discharge-forms/${formId}/edit`)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Form Header */}
          <div className="text-center mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">PATIENT DISCHARGE FORM</h2>
            <div className="flex justify-center items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">H</span>
              </div>
              <span className="text-lg font-semibold text-gray-700">{form.hospitalInfo?.name}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Hospital Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Hospital Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Address:</strong> {form.hospitalInfo?.address?.street}, {form.hospitalInfo?.address?.city}, {form.hospitalInfo?.address?.state} {form.hospitalInfo?.address?.zipCode}</p>
                <p><strong>Phone:</strong> {form.hospitalInfo?.phone}</p>
                <p><strong>Fax:</strong> {form.hospitalInfo?.fax}</p>
                <p><strong>Email:</strong> {form.hospitalInfo?.email}</p>
                <p><strong>Web:</strong> {form.hospitalInfo?.web}</p>
              </div>
            </div>

            {/* Patient and Discharge Information */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Patient & Discharge Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Patient Name:</strong> {form.patientName}</p>
                <p><strong>Patient ID:</strong> {form.patientId}</p>
                <p><strong>Date Admitted:</strong> {formatDate(form.dateAdmitted)}</p>
                <p><strong>Date of Discharge:</strong> {formatDate(form.dateOfDischarge)}</p>
                <p><strong>Physician Approval:</strong> {form.physicianApproval}</p>
                <p><strong>Next Checkup:</strong> {form.dateOfNextCheckup ? formatDate(form.dateOfNextCheckup) : 'Not scheduled'}</p>
              </div>
            </div>
          </div>

          {/* Medical Details */}
          <div className="space-y-6 mb-8">
            <h3 className="font-semibold text-gray-900">Medical Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Reason for Admission</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{form.reasonForAdmission}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Diagnosis at Admission</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{form.diagnosisAtAdmission}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Treatment Summary</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{form.treatmentSummary}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Reason for Discharge</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{form.reasonForDischarge}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Diagnosis at Discharge</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{form.diagnosisAtDischarge}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Further Treatment Plan</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{form.furtherTreatmentPlan || 'None specified'}</p>
              </div>
            </div>
          </div>

          {/* Contact Information and Medication */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Patient Contact Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Address:</strong> {form.patientContactInfo?.address}</p>
                <p><strong>Phone:</strong> {form.patientContactInfo?.phone}</p>
                <p><strong>Email:</strong> {form.patientContactInfo?.email}</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Medication</h3>
              {form.medications && form.medications.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-2 py-1 text-left">Medication</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Dosage</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Frequency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.medications.map((med, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-2 py-1">{med.medication}</td>
                          <td className="border border-gray-300 px-2 py-1">{med.dosage}</td>
                          <td className="border border-gray-300 px-2 py-1">{med.frequency}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-600">No medications prescribed</p>
              )}
            </div>
          </div>

          {/* Signature and Status */}
          <div className="border-t border-gray-200 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Signature</h4>
                <p className="text-sm text-gray-600">{form.signature}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Date of Signature</h4>
                <p className="text-sm text-gray-600">{formatDate(form.dateOfSignature)}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Patient Status</h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  form.patientStatus === 'Discharged' ? 'bg-green-100 text-green-800' :
                  form.patientStatus === 'Transferred' ? 'bg-yellow-100 text-yellow-800' :
                  form.patientStatus === 'Deceased' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {form.patientStatus}
                </span>
              </div>
            </div>
            
            {form.notes && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-800 mb-2">Notes</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{form.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DischargeFormView;
