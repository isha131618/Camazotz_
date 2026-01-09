import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const VoiceTest = () => {
  const [browserSupport, setBrowserSupport] = useState('');
  const [micPermission, setMicPermission] = useState('');

  useEffect(() => {
    const checkSupport = async () => {
      // Check browser support
      const hasSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
      
      if (hasSupport) {
        setBrowserSupport('✅ Speech Recognition Supported');
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        // Check microphone permission
        if (navigator.permissions && navigator.permissions.query) {
          navigator.permissions.query({ name: 'microphone' })
            .then((result) => {
              console.log('Microphone permission:', result.state);
              setMicPermission(`🎤 Permission: ${result.state}`);
            })
            .catch((err) => {
              console.log('Permission check failed:', err);
              setMicPermission('🎤 Permission: Unknown');
            });
        } else {
          setMicPermission('🎤 Permission: Not checkable in this browser');
        }
        
        // Test recognition
        recognition.onstart = () => console.log('Test recognition started');
        recognition.onerror = (e) => console.log('Test recognition error:', e);
        recognition.onend = () => console.log('Test recognition ended');
        
        try {
          recognition.start();
          setTimeout(() => {
            recognition.stop();
            console.log('Test recognition completed');
          }, 1000);
        } catch (error) {
          console.error('Test recognition failed:', error);
          toast.error(`Recognition test failed: ${error.message || error}`);
        }
      } else {
        setBrowserSupport('❌ Speech Recognition Not Supported');
        toast.error('Speech recognition not supported in this browser');
      }
    };

    checkSupport();
  }, []);

  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone access granted:', stream);
      toast.success('Microphone access granted!');
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error('Microphone access denied:', error);
      toast.error(`Microphone access denied: ${error.message}`);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Voice Recognition Test</h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Browser Support</h3>
          <p className="text-sm">{browserSupport}</p>
        </div>
        
        <div className="p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Microphone Permission</h3>
          <p className="text-sm">{micPermission}</p>
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={requestMicrophoneAccess}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Microphone Access
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reload Page
          </button>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold mb-2">Debug Instructions</h3>
        <ol className="text-sm list-decimal list-inside space-y-1">
          <li>Open browser console (F12)</li>
          <li>Click "Test Microphone Access" button</li>
          <li>Allow microphone permission when prompted</li>
          <li>Check console logs for details</li>
          <li>Try using Chrome/Edge for best compatibility</li>
        </ol>
      </div>
    </div>
  );
};

export default VoiceTest;
