import React from 'react';
import { ArrowLeft, Save, FileText, User, Calendar } from 'lucide-react';

const MedicalFormLayout = ({ 
  title, 
  subtitle, 
  children, 
  onSave, 
  onBack, 
  patient, 
  isLoading = false,
  saveButtonText = "Save Form"
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                {subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {patient && (
                <div className="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-lg">
                  <User className="w-4 h-4 text-blue-600" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900">
                      {patient.firstName} {patient.lastName}
                    </div>
                    <div className="text-blue-700">ID: {patient.medicalId}</div>
                  </div>
                </div>
              )}
              
              {onSave && (
                <button
                  onClick={onSave}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? "Saving..." : saveButtonText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
};

export const MedicalFormSection = ({ title, icon: Icon, children, className = "" }) => {
  return (
    <div className={`border-b border-gray-200 last:border-b-0 ${className}`}>
      <div className="px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          {Icon && <Icon className="w-5 h-5 text-blue-600" />}
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        </div>
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const MedicalFormField = ({ 
  label, 
  children, 
  required = false, 
  description, 
  error,
  className = ""
}) => {
  return (
    <div className={`grid grid-cols-12 gap-4 ${className}`}>
      <div className="col-span-4">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <div className="col-span-8">
        {children}
        {error && (
          <p className="text-xs text-red-600 mt-1">{error}</p>
        )}
      </div>
    </div>
  );
};

export const MedicalFormGrid = ({ children, columns = 2 }) => {
  const gridClass = columns === 3 ? 'grid-cols-3' : columns === 4 ? 'grid-cols-4' : 'grid-cols-2';
  return (
    <div className={`grid ${gridClass} gap-4`}>
      {children}
    </div>
  );
};

export default MedicalFormLayout;
