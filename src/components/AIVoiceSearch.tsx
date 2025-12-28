'use client';

import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, X, Loader2 } from 'lucide-react';
import { Product } from '@/types';
import { aiService } from '@/services/aiService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface AIVoiceSearchProps {
  businessId: string;
  onProductSelect?: (product: Product) => void;
  onSearchComplete?: (products: Product[]) => void;
  onClose?: () => void;
}

export default function AIVoiceSearch({ 
  businessId, 
  onProductSelect, 
  onSearchComplete,
  onClose 
}: AIVoiceSearchProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Get SpeechRecognition API
  const SpeechRecognition = typeof window !== 'undefined' 
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

  // Check if browser supports Web Speech API or MediaRecorder
  const isSupported = typeof window !== 'undefined' && (
    (SpeechRecognition !== null) ||
    (typeof MediaRecorder !== 'undefined' && navigator.mediaDevices?.getUserMedia)
  );

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    if (!isSupported) {
      toast.error('Voice search is not supported in your browser. Please use Chrome, Firefox, or Edge.');
      return;
    }

    try {
      setError(null);
      setTranscript('');
      setProducts([]);
      audioChunksRef.current = [];

      // Prefer Web Speech API if available (Chrome, Edge)
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
          setIsRecording(true);
          toast.success('Listening... Speak your search query', { duration: 2000 });
        };

        recognition.onresult = async (event: any) => {
          const transcriptText = event.results[0][0].transcript;
          setTranscript(transcriptText);
          setIsRecording(false);
          
          // Search products using transcribed text
          await searchWithQuery(transcriptText);
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
          setError(`Speech recognition error: ${event.error}`);
          toast.error('Failed to recognize speech. Please try again.');
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } else {
        // Fallback to MediaRecorder for browsers without Web Speech API
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported('audio/webm') 
            ? 'audio/webm' 
            : MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/webm;codecs=opus'
        });

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach(track => track.stop());
          streamRef.current = null;

          if (audioChunksRef.current.length > 0) {
            await processAudio();
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
        toast.success('Recording started. Speak your search query...', { duration: 2000 });
      }
    } catch (err: any) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check your permissions.');
      toast.error('Microphone access denied. Please enable microphone permissions.');
    }
  };

  const stopRecording = () => {
    // Stop Web Speech API recognition
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    // Stop MediaRecorder
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const searchWithQuery = async (queryText: string) => {
    if (!queryText.trim()) {
      toast.error('No speech detected. Please try again.');
      return;
    }

    try {
      setIsProcessing(true);
      
      // Use semantic search with the transcribed text
      const results = await aiService.semanticSearch({
        query: queryText.trim(),
        businessId,
        limit: 20,
      });

      if (results && results.length > 0) {
        setProducts(results);
        onSearchComplete?.(results);
        toast.success(`Found ${results.length} product(s)`);
      } else {
        setProducts([]);
        toast.error('No products found. Please try a different search.');
      }
    } catch (err: any) {
      console.error('Error searching products:', err);
      setError('Failed to search products. Please try again.');
      toast.error(err.response?.data?.message || 'Search failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAudio = async () => {
    try {
      setIsProcessing(true);
      
      // Combine audio chunks
      const audioBlob = new Blob(audioChunksRef.current, { 
        type: mediaRecorderRef.current?.mimeType || 'audio/webm' 
      });

      // Check if audio is too short
      if (audioBlob.size < 1000) {
        toast.error('Recording too short. Please try again.');
        setIsProcessing(false);
        return;
      }

      // Send to AI service
      const results = await aiService.voiceSearch(audioBlob, businessId);
      
      if (results && results.length > 0) {
        setProducts(results);
        setTranscript('Voice search completed');
        onSearchComplete?.(results);
        toast.success(`Found ${results.length} product(s)`);
      } else {
        setProducts([]);
        setTranscript('No products found');
        toast.error('No products found. Please try a different search.');
      }
    } catch (err: any) {
      console.error('Error processing audio:', err);
      setError('Failed to process voice search. Please try again.');
      toast.error(err.response?.data?.message || 'Voice search failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleClose = () => {
    stopRecording();
    onClose?.();
  };

  if (!isSupported) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Voice Search</h3>
          {onClose && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Voice search is not supported in your browser. Please use Chrome, Firefox, or Edge.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Voice Search</h3>
        </div>
        {onClose && (
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* Recording Button */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleToggleRecording}
            disabled={isProcessing}
            className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50'
                : 'bg-primary-600 hover:bg-primary-700 shadow-lg'
            } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
          >
            {isProcessing ? (
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-10 h-10 text-white" />
            ) : (
              <Mic className="w-10 h-10 text-white" />
            )}
          </button>

          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {isRecording 
              ? 'Recording... Click to stop' 
              : isProcessing 
              ? 'Processing your voice...' 
              : 'Click to start voice search'}
          </p>
        </div>

        {/* Transcript */}
        {transcript && (
          <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 border border-primary-200 dark:border-primary-800">
            <p className="text-sm text-primary-800 dark:text-primary-300">
              <span className="font-semibold">Query:</span> {transcript}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Results */}
        {products.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Search Results ({products.length})
            </h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {products.map((product) => (
                <button
                  key={product.productId}
                  onClick={() => {
                    onProductSelect?.(product);
                    handleClose();
                  }}
                  className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors flex items-center gap-3"
                >
                  {product.imageUrl && (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      ₹{product.price.toFixed(2)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            <span className="font-semibold">Tip:</span> Speak clearly and describe what you're looking for. 
            For example: "Show me pizza" or "I want vegetarian options"
          </p>
        </div>
      </div>
    </motion.div>
  );
}

