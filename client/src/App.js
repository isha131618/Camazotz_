import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import PatientRegistration from './pages/PatientRegistration';
import PatientDetail from './pages/PatientDetail';
import FormSelection from './pages/FormSelection';
import MedicalHistoryForm from './pages/MedicalHistoryForm';
import ClinicalExaminationForm from './pages/ClinicalExaminationForm';
import PatientDischargeForm from './pages/PatientDischargeForm';
import DiagnosisTreatmentForm from './pages/DiagnosisTreatmentForm';
import DischargeFormView from './pages/DischargeFormView';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Queries from './pages/Queries';
import Login from './pages/Login';
import Reports from './pages/Reports';
import Landing from './pages/Landing';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const AuthenticatedLayout = () => {
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 ml-64 mt-16">
            <div className="p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    );
  };

  const LoginRoute = () => {
    if (isAuthenticated) {
      return <Navigate to="/dashboard" />;
    }
    return <Login />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route element={<AuthenticatedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/register" element={<PatientRegistration />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/patients/:id/forms" element={<FormSelection />} />
          <Route path="/patients/:id/forms/medical-history" element={<MedicalHistoryForm />} />
          <Route path="/patients/:id/forms/clinical-examination" element={<ClinicalExaminationForm />} />
          <Route path="/patients/:id/forms/diagnosis-treatment" element={<DiagnosisTreatmentForm />} />
          <Route path="/patients/:id/forms/discharge" element={<PatientDischargeForm />} />
          <Route path="/patients/:id/edit" element={<PatientRegistration />} />
          <Route path="/patients/:patientId/discharge-form" element={<PatientDischargeForm />} />
          <Route path="/discharge-forms/:formId" element={<DischargeFormView />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/queries" element={<Queries />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<div>Settings Page</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </Router>
  );
}

export default App;
