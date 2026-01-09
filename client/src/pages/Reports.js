import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import API from '../utils/axios';

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [openPatientIds, setOpenPatientIds] = useState(new Set());
  const [openFormKeys, setOpenFormKeys] = useState(new Set());

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const patientsRes = await API.get('/patients');
        const patients = patientsRes.data || [];

        const visitsByPatient = await Promise.all(
          patients.map(async (patient) => {
            try {
              const visitsRes = await API.get(`/visits/patient/${patient._id}`);
              return { patient, visits: visitsRes.data || [] };
            } catch (error) {
              return { patient, visits: [] };
            }
          })
        );

        const rows = visitsByPatient.map(({ patient, visits }) => ({
          patient,
          visits
        }));

        setReports(rows);
      } catch (error) {
        toast.error('Failed to load reports');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading reports...</div>
        </div>
      </div>
    );
  }

  const togglePatient = (patientId) => {
    setOpenPatientIds((prev) => {
      const next = new Set(prev);
      if (next.has(patientId)) {
        next.delete(patientId);
      } else {
        next.add(patientId);
      }
      return next;
    });
  };

  const formatDateTime = (value) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString();
  };

  const toggleForm = (key) => {
    setOpenFormKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400">N/A</span>;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-gray-400">N/A</span>;
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, index) => (
            <li key={index}>{renderValue(item)}</li>
          ))}
        </ul>
      );
    }
    if (typeof value === 'object') {
      return (
        <div className="space-y-2">
          {Object.entries(value).map(([key, nested]) => (
            <div key={key}>
              <div className="text-xs font-medium text-gray-700">{formatKey(key)}</div>
              <div className="text-sm text-gray-900">{renderValue(nested)}</div>
            </div>
          ))}
        </div>
      );
    }
    return <span>{String(value)}</span>;
  };

  const formatKey = (key) => key.replace(/([A-Z])/g, ' $1').trim();

  const renderFormDetails = (data) => {
    return (
      <div className="mt-3 bg-gray-50 border border-gray-200 rounded-md p-3">
        <div className="space-y-3 text-sm text-gray-900">
          {Object.entries(data).map(([key, value]) => (
            <div key={key}>
              <div className="text-xs font-medium text-gray-700">{formatKey(key)}</div>
              <div>{renderValue(value)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFormRow = (label, form, key) => {
    if (!form || !form.data) return null;
    const isOpen = openFormKeys.has(key);
    return (
      <div className="py-2 border-b border-gray-100 last:border-b-0">
        <button
          onClick={() => toggleForm(key)}
          className="w-full flex items-start justify-between gap-4 text-left"
        >
          <div>
            <div className="text-sm font-medium text-gray-900">{label}</div>
            <div className="text-xs text-gray-500">
              Last updated: {formatDateTime(form.lastUpdated)}
            </div>
          </div>
          <div className="text-xs text-blue-600">
            {isOpen ? 'Hide details' : 'View full form'}
          </div>
        </button>
        {isOpen && renderFormDetails(form.data)}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-600 mt-2">Patient folders with saved forms</p>
      </div>

      <div className="space-y-4">
        {reports.map(({ patient, visits }) => {
          const isOpen = openPatientIds.has(patient._id);
          return (
            <div key={patient._id} className="bg-white rounded-lg shadow-md border border-gray-200">
              <button
                onClick={() => togglePatient(patient._id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
              >
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {patient.firstName} {patient.lastName}
                  </div>
                  <div className="text-xs text-gray-500">
                    Medical ID: {patient.medicalId || 'N/A'} • {patient.email}
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {isOpen ? 'Hide forms' : 'View forms'}
                </div>
              </button>

              {isOpen && (
                <div className="px-6 pb-6">
                  {visits.length === 0 && (
                    <div className="text-sm text-gray-500">No visits found.</div>
                  )}
                  {visits.map((visit) => (
                    <div key={visit._id} className="mt-4 border border-gray-200 rounded-lg">
                      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600">
                        Visit #{visit.visitNumber || 'N/A'} • {formatDateTime(visit.createdAt)}
                      </div>
                      <div className="px-4 py-2">
                        {renderFormRow('Medical History', visit.forms?.medicalHistory, `${visit._id}-medicalHistory`)}
                        {renderFormRow('Clinical Examination', visit.forms?.clinicalExamination, `${visit._id}-clinicalExamination`)}
                        {renderFormRow('Diagnosis & Treatment', visit.forms?.diagnosisTreatment, `${visit._id}-diagnosisTreatment`)}
                        {renderFormRow('Discharge Form', visit.forms?.dischargeForm, `${visit._id}-dischargeForm`)}
                        {!visit.forms?.medicalHistory?.data &&
                          !visit.forms?.clinicalExamination?.data &&
                          !visit.forms?.diagnosisTreatment?.data &&
                          !visit.forms?.dischargeForm?.data && (
                            <div className="text-sm text-gray-500 py-2">
                              No forms saved for this visit.
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {reports.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-10 text-center text-gray-500">
            No reports found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
