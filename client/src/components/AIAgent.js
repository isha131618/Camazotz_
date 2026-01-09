import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Volume2, Bot, FileText, Activity, Zap } from 'lucide-react';
import API from '../utils/axios';

const AIAgent = ({
  onFormData,
  onTranscriptUpdate,
  onTranscriptFinal,
  currentFormType,
  availableForms = []
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentStatus, setAgentStatus] = useState('idle'); // idle, listening, processing, completed
  const [conversation, setConversation] = useState([]);
  const recognitionRef = useRef(null);
  const isRecognitionActiveRef = useRef(false);
  const transcriptRef = useRef('');

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();

      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        isRecognitionActiveRef.current = true;
        setIsListening(true);
        setAgentStatus('listening');
      };

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = transcript + finalTranscript;
        transcriptRef.current = fullTranscript;
        setTranscript(fullTranscript);
        if (onTranscriptUpdate) {
          onTranscriptUpdate(fullTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        isRecognitionActiveRef.current = false;
        setIsListening(false);
        setAgentStatus('idle');
      };

      recognitionRef.current.onend = () => {
        isRecognitionActiveRef.current = false;
        setIsListening(false);
        const finalText = transcriptRef.current.trim();
        if (finalText) {
          processVoiceCommand(finalText);
          if (onTranscriptFinal) {
            onTranscriptFinal(finalText);
          }
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Process voice commands with AI
  const processVoiceCommand = useCallback(async (voiceText) => {
    setIsProcessing(true);
    setAgentStatus('processing');

    try {
      // Add user message to conversation
      const userMessage = {
        role: 'user',
        content: voiceText,
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, userMessage]);

      // Determine the appropriate form type and processing
      const detectedFormType = await detectFormType(voiceText);
      const processedData = await processWithAI(voiceText, detectedFormType);

      // Add AI response to conversation
      const aiMessage = {
        role: 'assistant',
        content: `Processed medical information for ${detectedFormType} form`,
        data: processedData,
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, aiMessage]);

      // Auto-fill the form
      if (onFormData && processedData) {
        onFormData(processedData, detectedFormType);
      }

      setAgentStatus('completed');

    } catch (error) {
      console.error('AI processing error:', error);
      setAgentStatus('error');

      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      setTranscript('');
      transcriptRef.current = '';
    }
  }, [onFormData]);

  // Detect which form type the voice command is for
  const detectFormType = async (voiceText) => {
    const formKeywords = {
      'patient-registration': ['register', 'new patient', 'admit', 'patient name', 'age', 'gender', 'address'],
      'medical-history': ['history', 'complaint', 'symptoms', 'past', 'allergies', 'medications', 'chronic'],
      'clinical-examination': ['exam', 'vitals', 'blood pressure', 'heart rate', 'temperature', 'lungs', 'cardiac'],
      'diagnosis-treatment': ['diagnosis', 'treatment', 'prescribe', 'medication', 'therapy', 'plan'],
      'discharge-form': ['discharge', 'summary', 'follow up', 'instructions', 'outcome']
    };

    const lowerText = voiceText.toLowerCase();

    for (const [formType, keywords] of Object.entries(formKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return formType;
      }
    }

    // Default to current form type or medical-history
    return currentFormType || 'medical-history';
  };

  // Process voice text with AI
  const processWithAI = async (voiceText, formType) => {
    try {
    const response = await API.post('/medical-ai', {
      transcript: voiceText,
      formType: formType
    });

      return response.data;
    } catch (error) {
      console.error('AI API error:', error);
      throw new Error('Failed to process with AI');
    }
  };

  // Enhanced voice commands with tool calling
  const handleToolCall = useCallback(async (toolName, parameters) => {
    switch (toolName) {
      case 'search_medication':
        return await searchMedication(parameters.drugName);
      case 'check_drug_interactions':
        return await checkDrugInteractions(parameters.drugs);
      case 'get_patient_history':
        return await getPatientHistory(parameters.patientId);
      case 'schedule_followup':
        return await scheduleFollowup(parameters);
      default:
        return { error: 'Unknown tool' };
    }
  }, []);

  // Tool implementations
  const searchMedication = async (drugName) => {
    // This would integrate with a drug database API
    return {
      drugName: drugName,
      indications: ['Sample indications'],
      dosage: 'Sample dosage',
      sideEffects: ['Sample side effects']
    };
  };

  const checkDrugInteractions = async (drugs) => {
    // This would check for drug interactions
    return {
      interactions: [],
      severity: 'none',
      recommendations: ['No significant interactions detected']
    };
  };

  const getPatientHistory = async (patientId) => {
    // This would fetch patient history from database
    return {
      previousVisits: [],
      chronicConditions: [],
      allergies: []
    };
  };

  const scheduleFollowup = async (params) => {
    // This would schedule a follow-up appointment
    return {
      appointmentId: 'generated-id',
      date: params.date,
      type: params.type,
      status: 'scheduled'
    };
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening || isRecognitionActiveRef.current) {
      recognitionRef.current.abort();
      setIsListening(false);
      setAgentStatus('idle');
      isRecognitionActiveRef.current = false;
    } else {
      setTranscript('');
      transcriptRef.current = '';
      if (isRecognitionActiveRef.current) {
        return;
      }
      setIsListening(true);
      setAgentStatus('listening');
      isRecognitionActiveRef.current = true;
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Speech recognition start failed:', error);
        isRecognitionActiveRef.current = false;
        setIsListening(false);
        setAgentStatus('idle');
      }
    }
  };

  const clearConversation = () => {
    setConversation([]);
    setTranscript('');
    setAgentStatus('idle');
  };

  const getStatusColor = () => {
    switch (agentStatus) {
      case 'listening': return 'text-blue-500';
      case 'processing': return 'text-yellow-500';
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (agentStatus) {
      case 'listening': return <Mic className="w-4 h-4" />;
      case 'processing': return <Activity className="w-4 h-4 animate-spin" />;
      case 'completed': return <Zap className="w-4 h-4" />;
      case 'error': return <Volume2 className="w-4 h-4" />;
      default: return <Bot className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Bot className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">AI Medical Assistant</h3>
          <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
            {getStatusIcon()}
            <span className="text-sm capitalize">{agentStatus}</span>
          </div>
        </div>
        <button
          onClick={clearConversation}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>

      {/* Voice Control */}
      <div className="flex items-center justify-center mb-4">
        <button
          onClick={toggleListening}
          disabled={isProcessing}
          className={`p-4 rounded-full transition-all duration-200 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600'
          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? (
            <MicOff className="w-6 h-6 text-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {/* Current Transcript */}
      {transcript && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-1">Listening:</p>
          <p className="text-gray-900">{transcript}</p>
        </div>
      )}

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div className="mb-4 max-h-64 overflow-y-auto">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Conversation:</h4>
          <div className="space-y-2">
            {conversation.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-50 ml-8'
                    : 'bg-gray-50 mr-8'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-xs font-medium ${
                    msg.role === 'user' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {msg.role === 'user' ? 'Doctor' : 'AI Assistant'}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-900">{msg.content}</p>
                {msg.data && (
                  <div className="mt-2 p-2 bg-white rounded border text-xs">
                    <FileText className="w-3 h-3 inline mr-1" />
                    Form data extracted and applied
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
        <p className="font-medium mb-1">Voice Commands Examples:</p>
        <ul className="space-y-1">
          <li>• "Patient has fever for 3 days, took paracetamol, no allergies"</li>
          <li>• "Blood pressure 120/80, heart rate 72, patient alert"</li>
          <li>• "Diagnosed pneumonia, prescribe amoxicillin 500mg"</li>
          <li>• "Schedule follow-up appointment in 1 week"</li>
        </ul>
      </div>
    </div>
  );
};

export default AIAgent;
