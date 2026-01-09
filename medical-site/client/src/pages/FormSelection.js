import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  User, 
  Activity,
  Stethoscope,
  Brain,
  FileCheck
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../utils/axios';

const FormSelection = () => {
  const { id: patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [currentVisit, setCurrentVisit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [creatingVisit, setCreatingVisit] = useState(false);

  // Define available forms with their metadata
  const availableForms = [
    {
      id: 'medical-history',
      title: 'Medical History',
      description: 'Patient\'s past medical history, medications, allergies, and family history',
      icon: FileText,
      color: 'blue',
      path: `/patients/${patientId}/forms/medical-history`,
      order: 1
    },
    {
      id: 'clinical-examination',
      title: 'Clinical Examination',
      description: 'Comprehensive physical examination findings and vital signs',
      icon: Stethoscope,
      color: 'green',
      path: `/patients/${patientId}/forms/clinical-examination`,
      order: 2
    },
    {
      id: 'diagnosis-treatment',
      title: 'Diagnosis and Treatment Plan',
      description: 'Primary diagnosis, differential diagnoses, and treatment recommendations',
      icon: Brain,
      color: 'purple',
      path: `/patients/${patientId}/forms/diagnosis-treatment`,
      order: 3
    },
    {
      id: 'discharge-form',
      title: 'Discharge Form',
      description: 'Patient discharge summary, instructions, and follow-up care',
      icon: FileCheck,
      color: 'orange',
      path: `/patients/${patientId}/forms/discharge`,
      order: 4
    }
  ];

  useEffect(() => {
    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      // Get patient details
      const patientResponse = await API.get(`/patients/${patientId}`);
      setPatient(patientResponse.data);

      // Check for active visits
      try {
        const visitResponse = await API.get(`/visits/patient/${patientId}`);
        const visits = visitResponse.data || [];
        const activeVisits = visits.filter(visit => visit.status === 'Active');
        
        // Set the most recent active visit as current, or fallback to latest visit
        const currentActiveVisit = activeVisits.length > 0 ? activeVisits[activeVisits.length - 1] : null;
        const latestVisit = visits.length > 0 ? visits[visits.length - 1] : null;
        setCurrentVisit(currentActiveVisit || latestVisit);
      } catch (error) {
        // No visits found or other error
        setCurrentVisit(null);
      }
    } catch (error) {
      toast.error('Failed to fetch patient data');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewVisit = async () => {
    setCreatingVisit(true);
    try {
      const response = await API.post(`/visits/create/${patientId}`, {
        chiefComplaint: 'New visit'
      });
      setCurrentVisit(response.data);
      toast.success('New visit created successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create new visit');
    } finally {
      setCreatingVisit(false);
    }
  };

  const getFormStatus = (formId) => {
    if (!currentVisit?.forms) return 'not-started';
    
    // Check if this form has data in the current visit
    const currentForm = currentVisit?.forms?.[formId];
    if (!currentForm || !currentForm.data) return 'not-started';
    
    // Check if form has meaningful data
    const hasData = Object.keys(currentForm.data).some(key => {
      const value = currentForm.data[key];
      return value && (
        typeof value === 'string' && value.trim() !== '' ||
        typeof value === 'object' && Object.keys(value).length > 0
      );
    });

    if (!hasData) return 'not-started';
    if (currentForm.completed) return 'completed';
    return 'in-progress';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Not Started';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getFormColorClasses = (color) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 hover:border-blue-300',
      green: 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100 hover:border-green-300',
      purple: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 hover:border-purple-300',
      orange: 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:border-orange-300'
    };
    return colorMap[color] || colorMap.blue;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/patients/${patientId}`)}
                className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Medical Forms</h1>
                <p className="text-sm text-gray-600 mt-1">Select a form to fill for this patient</p>
              </div>
            </div>
            
            {patient && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg">
                  <User className="w-4 h-4 text-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div className="text-blue-700">ID: {patient.medicalId}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Visit Status */}
        {currentVisit && (
          <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-medium text-gray-900">Active Visit</h3>
                  <p className="text-sm text-gray-600">
                    Started on {new Date(currentVisit.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-700">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Active
              </div>
            </div>
          </div>
        )}

        {/* Forms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableForms.map((form) => {
            const status = getFormStatus(form.id);
            const Icon = form.icon;
            
            return (
              <div
                key={form.id}
                className={`
                  bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden
                  transition-all duration-200
                  hover:shadow-md hover:border-gray-300
                `}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg border ${getFormColorClasses(form.color)}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getStatusColor(status)}`}>
                        {getStatusText(status)}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{form.title}</h3>
                  <p className="text-sm text-gray-600 mb-6 line-clamp-2">{form.description}</p>
                  
                  <button
                    onClick={() => {
                      navigate(form.path);
                    }}
                    className={`
                      w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium
                      transition-colors duration-200
                      bg-blue-600 text-white hover:bg-blue-700
                    `}
                  >
                    <FileText className="w-4 h-4" />
                    {status === 'completed' ? 'View Form' : 'Fill Form'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Summary */}
        {currentVisit && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Progress</h3>
            <div className="space-y-3">
              {availableForms.map((form) => {
                const status = getFormStatus(form.id);
                const Icon = form.icon;
                
                return (
                  <div key={form.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">{form.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(status)}
                      <span className="text-sm text-gray-600">{getStatusText(status)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormSelection;
