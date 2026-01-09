import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <header className="px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-900">MediCare Pro</div>
              <div className="text-xs text-gray-500">Clinical Management</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="text-sm font-medium text-blue-700 hover:text-blue-900"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      <main className="px-6 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-xs font-semibold">
              Built for doctors
            </div>
            <h1 className="mt-5 text-4xl md:text-5xl font-semibold text-gray-900 leading-tight">
              Clinical documentation, simplified for every visit.
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-xl">
              Record patient history, examinations, and treatment plans in one clean flow.
              Designed to keep doctors in control and patient records consistent.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Get Started
              </button>
              <a
                href="#features"
                className="px-6 py-3 rounded-lg border border-blue-200 text-blue-700 text-sm font-medium hover:border-blue-300"
              >
                Learn More
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-6 -right-6 h-28 w-28 rounded-3xl bg-blue-200 blur-2xl opacity-60" />
            <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-blue-300 blur-2xl opacity-50" />
            <div className="relative bg-white/90 border border-blue-100 rounded-2xl shadow-xl p-6">
              <img
                src="/medical-infographic.png"
                alt="Doctor consultation illustration"
                className="w-full rounded-xl"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
