import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { 
  MessageSquare, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Reply,
  Eye
} from 'lucide-react';
import API from '../utils/axios';
import AIVoiceToText from '../components/AIVoiceToText';

const Queries = () => {
  const [queries, setQueries] = useState([]);
  const [filteredQueries, setFilteredQueries] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewQueryForm, setShowNewQueryForm] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = queries.filter(query =>
      query.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.patientId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.patientId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredQueries(filtered);
  }, [searchTerm, queries]);

  const fetchData = async () => {
    try {
      const [queriesRes, patientsRes, doctorsRes] = await Promise.all([
        API.get('/queries'),
        API.get('/patients'),
        API.get('/doctors')
      ]);
      setQueries(queriesRes.data);
      setFilteredQueries(queriesRes.data);
      setPatients(patientsRes.data);
      setDoctors(doctorsRes.data);
    } catch (error) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitQuery = async (data) => {
    setIsSubmitting(true);
    try {
      await API.post('/queries', data);
      toast.success('Query submitted successfully');
      reset();
      setShowNewQueryForm(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit query');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRespond = async (queryId, response) => {
    try {
      await API.put(`/queries/${queryId}/respond`, {
        response: {
          message: response,
          doctorId: doctors[0]?._id // Use first doctor as default
        }
      });
      toast.success('Response sent successfully');
      fetchData();
      setSelectedQuery(null);
    } catch (error) {
      toast.error('Failed to send response');
    }
  };

  const updateQueryStatus = async (queryId, status) => {
    try {
      await API.patch(`/queries/${queryId}/status`, { status });
      toast.success('Query status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      case 'Answered': return 'bg-green-100 text-green-800';
      case 'Closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'bg-gray-100 text-gray-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading queries...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Patient Queries</h1>
            <p className="text-gray-600 mt-2">Manage and respond to patient inquiries</p>
          </div>
          <button
            onClick={() => setShowNewQueryForm(true)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Query
          </button>
        </div>
      </div>

      {/* New Query Form Modal */}
      {showNewQueryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit New Query</h2>
            <form onSubmit={handleSubmit(onSubmitQuery)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Patient *
                  </label>
                  <select
                    {...register('patientId', { required: 'Patient is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </select>
                  {errors.patientId && (
                    <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Category</option>
                    <option value="General">General</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Test Results">Test Results</option>
                    <option value="Appointment">Appointment</option>
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority *
                  </label>
                  <select
                    {...register('priority', { required: 'Priority is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Priority</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                  {errors.priority && (
                    <p className="text-red-500 text-sm mt-1">{errors.priority.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    {...register('subject', { required: 'Subject is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Query subject"
                  />
                  {errors.subject && (
                    <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <div className="relative">
                  <textarea
                    {...register('description', { required: 'Description is required' })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 pr-12"
                    placeholder="Describe your query in detail..."
                  />
                  <div className="absolute top-2 right-2">
                    <AIVoiceToText
                      mode="raw"
                      onTranscript={(text) => setValue('description', text)}
                    />
                  </div>
                </div>
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowNewQueryForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Query'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search queries by subject, description, or patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </button>
        </div>
      </div>

      {/* Queries List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Query
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQueries.length > 0 ? (
                filteredQueries.map((query) => (
                  <tr key={query._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{query.subject}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {query.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {query.patientId?.firstName} {query.patientId?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{query.patientId?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                        {query.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(query.priority)}`}>
                        {query.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(query.status)}`}>
                        {query.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(query.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setSelectedQuery(query)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {query.status !== 'Answered' && (
                          <button className="text-green-600 hover:text-green-900">
                            <Reply className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      {searchTerm ? 'No queries found matching your search.' : 'No queries yet.'}
                    </div>
                    {!searchTerm && (
                      <button
                        onClick={() => setShowNewQueryForm(true)}
                        className="mt-4 inline-flex items-center text-primary-600 hover:text-primary-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create your first query
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Query Detail Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">{selectedQuery.subject}</h2>
              <button
                onClick={() => setSelectedQuery(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Patient</p>
                  <p className="text-sm text-gray-900">
                    {selectedQuery.patientId?.firstName} {selectedQuery.patientId?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{selectedQuery.patientId?.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Category</p>
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                    {selectedQuery.category}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Priority</p>
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(selectedQuery.priority)}`}>
                    {selectedQuery.priority}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-2">Description</p>
                <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {selectedQuery.description}
                </p>
              </div>

              {selectedQuery.response && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-2">Response</p>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-900">{selectedQuery.response.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Responded on {formatDate(selectedQuery.response.respondedAt)}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <select
                    value={selectedQuery.status}
                    onChange={(e) => updateQueryStatus(selectedQuery._id, e.target.value)}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Answered">Answered</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
                {selectedQuery.status !== 'Answered' && (
                  <button
                    onClick={() => {
                      const response = prompt('Enter your response:');
                      if (response) {
                        handleRespond(selectedQuery._id, response);
                      }
                    }}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                  >
                    <Reply className="h-4 w-4 mr-2" />
                    Respond
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Queries;
