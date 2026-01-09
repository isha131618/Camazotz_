import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const AIVoiceToText = ({ formType, onTranscript, placeholder, mode = 'ai' }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const manuallyStoppedRef = useRef(false);
  const countdownTimerRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      toast.error('Speech recognition not supported');
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      console.log('Recognition started event fired');
      setIsListening(true);
      finalTranscriptRef.current = '';
    };

    recognition.onresult = (event) => {
      console.log('Recognition result event:', event);
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const text = event.results[i][0].transcript;
        console.log('Processing result:', text, 'isFinal:', event.results[i].isFinal);
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += text + ' ';
          console.log('Final transcript so far:', finalTranscriptRef.current);
        } else {
          interim += text;
        }
      }

      if (mode === 'raw' && typeof onTranscript === 'function') {
        const liveText = `${finalTranscriptRef.current}${interim}`.trim();
        if (liveText) {
          onTranscript(liveText);
        }
      }
    };

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      setIsListening(false);
      
      // Handle specific errors
      switch (e.error) {
        case 'not-allowed':
          toast.error('Microphone permission denied. Please allow microphone access.');
          break;
        case 'network':
          toast.error('Network error. Please check your connection.');
          break;
        case 'no-speech':
          toast.error('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          toast.error('Microphone not available or is being used by another application.');
          break;
        case 'aborted':
          toast.error('Speech recognition was aborted.');
          break;
        default:
          toast.error(`Speech recognition error: ${e.error}`);
      }
    };

    recognition.onend = async () => {
      console.log('Recognition ended event fired');
      setIsListening(false);

      if (!manuallyStoppedRef.current) {
        console.log('Recognition ended automatically (not manually stopped)');
        return;
      }

    const finalText = finalTranscriptRef.current.trim();
    console.log('Final text for AI processing:', finalText);
    if (finalText) {
      if (mode === 'raw') {
        onTranscript(finalText);
      } else {
        await sendToAI(finalText);
      }
    }
  };

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.onstart = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onend = null;
        } catch (error) {
          console.error('Error cleaning up recognition:', error);
        }
      }
    };
  }, [formType]);

  const sendToAI = async (text) => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/medical-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, formType }),
      });

      const data = await res.json();
      onTranscript(data);
      toast.success('Form auto-filled');
    } catch {
      toast.error('AI processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const startListening = () => {
    console.log('Start listening called', { isListening, isProcessing, hasRecognition: !!recognitionRef.current });
    
    if (isListening || isProcessing || countdown > 0 || !recognitionRef.current) {
      console.log('Cannot start: already listening or processing');
      return;
    }
    
    manuallyStoppedRef.current = false;
    try {
      console.log('Starting speech recognition countdown...');
      setCountdown(3);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            countdownTimerRef.current = null;
            try {
              recognitionRef.current.start();
              toast.success('Voice recognition started - Speak now');
            } catch (error) {
              console.error('Speech recognition start error:', error);
              toast.error('Failed to start voice recognition');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('Speech recognition start error:', error);
      // If recognition is already running, stop it first and restart
      if (error.name === 'InvalidStateError') {
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            recognitionRef.current.start();
          } catch (retryError) {
            console.error('Speech recognition retry failed:', retryError);
            toast.error('Failed to start voice recognition');
          }
        }, 100);
      } else if (error.name === 'NotAllowedError') {
        toast.error('Microphone permission denied. Please allow microphone access and try again.');
      } else {
        toast.error(`Failed to start voice recognition: ${error.message}`);
      }
    }
  };

  const stopListening = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
      setCountdown(0);
    }
    if (!isListening || !recognitionRef.current) return;
    
    manuallyStoppedRef.current = true;
    try {
      recognitionRef.current.stop();
    } catch (error) {
      console.error('Speech recognition stop error:', error);
    }
  };

  const buttonLabel = countdown > 0 ? countdown : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className={`p-2 rounded-full ${
          isListening ? 'bg-red-500' : countdown > 0 ? 'bg-amber-500' : 'bg-blue-500'
        } text-white`}
      >
        {isProcessing ? (
          <Loader2 className="animate-spin w-4 h-4" />
        ) : countdown > 0 ? (
          <span className="text-xs font-semibold">{buttonLabel}</span>
        ) : isListening ? (
          <MicOff />
        ) : (
          <Mic />
        )}
      </button>

    </div>
  );
};

export default AIVoiceToText;
