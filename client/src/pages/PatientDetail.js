import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Filter,
  Search
} from 'lucide-react';
import axios from 'axios';

const PatientDetail = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [dischargeForms, setDischargeForms] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPatientData();
    fetchDischargeForms();
  }, [patientId]);

  useEffect(() => {
    filterDischargeForms();
  }, [dischargeForms, searchTerm, filterYear, filterMonth]);

  const fetchPatientData = async () => {
    try {
      const response = await axios.get(`/api/patients/${patientId}`);
      setPatient(response.data);
    } catch (error) {
      toast.error('Failed to fetch patient data');
    }
  };

  const fetchDischargeForms = async () => {
    try {
      const response = await axios.get(`/api/discharge-forms/patient/${patientId}`);
      setDischargeForms(response.data);
    } catch (error) {
      toast.error('Failed to fetch discharge forms');
    } finally {
      setIsLoading(false);
    }
  };

  const filterDischargeForms = () => {
    let filtered = dischargeForms;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(form =>
        form.reasonForAdmission.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.diagnosisAtAdmission.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.diagnosisAtDischarge.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply year filter
    if (filterYear !== 'all') {
      filtered = filtered.filter(form => {
        const formYear = new Date(form.dateOfDischarge).getFullYear();
        return formYear.toString() === filterYear;
      });
    }

    // Apply month filter
    if (filterMonth !== 'all') {
      filtered = filtered.filter(form => {
        const formMonth = new Date(form.dateOfDischarge).getMonth();
        return formMonth.toString() === filterMonth;
      });
    }

    setFilteredForms(filtered);
  };

  const handleDeleteForm = async (formId) => {
    if (window.confirm('Are you sure you want to delete this discharge form?')) {
      try {
        await axios.delete(`/api/discharge-forms/${formId}`);
        toast.success('Discharge form deleted successfully');
        fetchDischargeForms();
      } catch (error) {
        toast.error('Failed to delete discharge form');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getPatientAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getUniqueYears = () => {
    const years = [...new Set(dischargeForms.map(form => 
      new Date(form.dateOfDischarge).getFullYear()
    ))];
    return years.sort((a, b) => b - a);
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Patient not found</h2>
          <button
            onClick={() => navigate('/patients')}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/patients')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Patients
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <p className="text-gray-600 mt-2">Patient Details and Medical History</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/patients/${patientId}/discharge-form`)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Discharge Form
              </button>
              <button
                onClick={() => navigate(`/patients/${patientId}/edit`)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Patient
              </button>
            </div>
          </div>
        </div>

        {/* Patient Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Patient Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-900">
                  {patient.firstName} {patient.lastName}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{patient.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Phone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{patient.phone}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Calendar className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-medium text-gray-900">
                  {getPatientAge(patient.dateOfBirth)} years
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Gender</p>
                <p className="font-medium text-gray-900">{patient.gender}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <MapPin className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium text-gray-900">
                  {patient.address.city}, {patient.address.state}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Medical History - Discharge Forms */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Medical History</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <FileText className="h-4 w-4" />
              <span>{dischargeForms.length} discharge form(s)</span>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search discharge forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex space-x-2">
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Years</option>
                  {getUniqueYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Months</option>
                  {months.map((month, index) => (
                    <option key={index} value={index}>{month}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Discharge Forms List */}
          {filteredForms.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No discharge forms found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || filterYear !== 'all' || filterMonth !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No medical history records available for this patient'}
              </p>
              {!searchTerm && filterYear === 'all' && filterMonth === 'all' && (
                <button
                  onClick={() => navigate(`/patients/${patientId}/discharge-form`)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Discharge Form
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredForms.map((form) => (
                <div key={form._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Discharge Form - {formatDate(form.dateOfDischarge)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Admitted: {formatDate(form.dateAdmitted)} | 
                        Discharged: {formatDate(form.dateOfDischarge)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      form.patientStatus === 'Discharged' ? 'bg-green-100 text-green-800' :
                      form.patientStatus === 'Transferred' ? 'bg-yellow-100 text-yellow-800' :
                      form.patientStatus === 'Deceased' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {form.patientStatus}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Reason for Admission:</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{form.reasonForAdmission}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Diagnosis at Discharge:</p>
                      <p className="text-sm text-gray-600 line-clamp-2">{form.diagnosisAtDischarge}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-gray-500">
                      Physician: {form.physicianApproval} | 
                      Next Checkup: {form.dateOfNextCheckup ? formatDate(form.dateOfNextCheckup) : 'Not scheduled'}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/discharge-forms/${form._id}`)}
                        className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </button>
                      <button
                        onClick={() => navigate(`/discharge-forms/${form._id}/edit`)}
                        className="flex items-center px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteForm(form._id)}
                        className="flex items-center px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
