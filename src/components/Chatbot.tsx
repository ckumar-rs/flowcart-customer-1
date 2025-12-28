'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Minimize2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '@/services/aiService';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { productService } from '@/services/productService';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface QuickQuestion {
  question: string;
  answer: string;
}

const quickQuestions: QuickQuestion[] = [
  {
    question: 'How do I place an order?',
    answer: 'Simply browse our catalog, add items to your cart, and proceed to checkout. You can order as a guest or create an account for faster checkout!'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept Cash on Delivery (COD), credit/debit cards, Razorpay, Stripe, and other digital payment methods. Payment options may vary by restaurant.'
  },
  {
    question: 'Can I cancel my order?',
    answer: 'Yes! You can cancel orders that are still pending. Once confirmed by the restaurant, cancellation policies may vary. Check your order details for cancellation options.'
  },
  {
    question: 'How do I track my order?',
    answer: 'After placing an order, you can view its status in the "My Orders" section. You\'ll receive real-time updates on your order status.'
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No, you can order as a guest! However, creating an account allows you to track orders, save addresses, and access exclusive offers.'
  },
  {
    question: 'What are your delivery times?',
    answer: 'Delivery times vary by restaurant and location. Typically, orders are delivered within 30-60 minutes. You\'ll see estimated delivery time during checkout.'
  },
  {
    question: 'How do I add items to my wishlist?',
    answer: 'Click the heart icon on any product to add it to your wishlist. You can view all wishlisted items in the "Wishlist" section from the menu.'
  },
  {
    question: 'What if I have dietary restrictions?',
    answer: 'Please check product descriptions for ingredient information. You can also add special instructions when placing your order to inform the restaurant.'
  }
];

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! 👋 I\'m your FlowCart AI assistant powered by Mistral AI. How can I help you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isAIEnabled, setIsAIEnabled] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { businessId, items: cartItems } = useCartStore();
  const { user } = useAuthStore();

  // Load products for AI context
  useEffect(() => {
    if (businessId && products.length === 0) {
      productService.getByBusiness(businessId, 1, 20)
        .then(result => setProducts(result.products || []))
        .catch(() => {});
    }
  }, [businessId]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const findAnswer = (question: string): string => {
    const lowerQuestion = question.toLowerCase();
    
    // Try exact match first
    for (const qa of quickQuestions) {
      const qaLower = qa.question.toLowerCase();
      if (lowerQuestion.includes(qaLower) || qaLower.includes(lowerQuestion)) {
        return qa.answer;
      }
    }
    
    // Try keyword matching
    for (const qa of quickQuestions) {
      const qaKeywords = qa.question.toLowerCase().split(' ').filter(w => w.length > 3);
      const questionKeywords = lowerQuestion.split(' ').filter(w => w.length > 3);
      const matchCount = qaKeywords.filter(k => questionKeywords.some(qk => qk.includes(k) || k.includes(qk))).length;
      if (matchCount >= 2) {
        return qa.answer;
      }
    }

    // Keyword matching
    if (lowerQuestion.includes('order') || lowerQuestion.includes('place')) {
      return quickQuestions[0].answer;
    }
    if (lowerQuestion.includes('payment') || lowerQuestion.includes('pay')) {
      return quickQuestions[1].answer;
    }
    if (lowerQuestion.includes('cancel')) {
      return quickQuestions[2].answer;
    }
    if (lowerQuestion.includes('track') || lowerQuestion.includes('status')) {
      return quickQuestions[3].answer;
    }
    if (lowerQuestion.includes('account') || lowerQuestion.includes('register')) {
      return quickQuestions[4].answer;
    }
    if (lowerQuestion.includes('delivery') || lowerQuestion.includes('time')) {
      return quickQuestions[5].answer;
    }
    if (lowerQuestion.includes('wishlist') || lowerQuestion.includes('favorite')) {
      return quickQuestions[6].answer;
    }
    if (lowerQuestion.includes('diet') || lowerQuestion.includes('allerg')) {
      return quickQuestions[7].answer;
    }

    // Default response
    return 'I\'m here to help! You can ask me about:\n• Placing orders\n• Payment methods\n• Order tracking\n• Account management\n• Delivery times\n• And more!\n\nTry asking: "How do I place an order?" or click on a quick question below.';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isThinking) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const question = inputValue;
    setInputValue('');
    setIsThinking(true);

    try {
      let botAnswer: string;

      if (isAIEnabled) {
        // Use Mistral AI
        const chatMessages = [
          ...messages.map(m => ({
            role: m.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: m.text,
          })),
          { role: 'user' as const, content: question },
        ];

        const response = await aiService.chat(chatMessages, {
          businessId: businessId || undefined,
          products: products.slice(0, 10),
        });

        botAnswer = response.message;
      } else {
        // Fallback to static Q&A
        botAnswer = findAnswer(question);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botAnswer,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      // Fallback to static answer
      const botAnswer = findAnswer(question);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botAnswer,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleQuickQuestion = (question: string, answer: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: question,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: answer,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-full shadow-lg flex items-center justify-center text-white z-50 hover:shadow-xl transition-shadow"
        aria-label="Open chatbot"
      >
        <Bot className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100vw-2rem)] sm:w-96 max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 flex flex-col ${
          isMinimized ? 'h-16' : 'h-[calc(100vh-8rem)] sm:h-[600px] max-h-[600px]'
        } transition-all duration-300`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">FlowCart AI Assistant</h3>
                {isAIEnabled && (
                  <Sparkles className="w-4 h-4 text-yellow-300" aria-label="AI Powered by Mistral" />
                )}
              </div>
              <p className="text-xs text-green-100">
                {isAIEnabled ? 'Powered by Mistral AI' : 'Basic mode'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label={isMinimized ? 'Maximize' : 'Minimize'}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsMinimized(false);
              }}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2 justify-start"
                >
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-white text-gray-800 shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.sender === 'bot' && (
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      message.sender === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-800 shadow-sm'
                    }`}
                  >
                    {isThinking && message.sender === 'bot' && message.id === 'thinking' ? (
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm whitespace-pre-line">{message.text}</p>
                        <p className={`text-xs mt-1 ${
                          message.sender === 'user' ? 'text-primary-100' : 'text-gray-400'
                        }`}>
                          {message.timestamp.toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </>
                    )}
                  </div>
                  {message.sender === 'user' && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions */}
            {messages.length === 1 && (
              <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2 font-medium">Quick questions:</p>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {quickQuestions.slice(0, 4).map((qa, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(qa.question, qa.answer)}
                      className="w-full text-left text-xs text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-lg transition-colors"
                    >
                      {qa.question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={isAIEnabled ? "Ask me anything..." : "Type your message..."}
                  disabled={isThinking}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm disabled:opacity-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isThinking}
                  className="w-10 h-10 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  aria-label="Send message"
                >
                  {isThinking ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <button
                  onClick={() => setIsAIEnabled(!isAIEnabled)}
                  className="text-gray-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <Sparkles className={`w-3 h-3 ${isAIEnabled ? 'text-yellow-500' : ''}`} />
                  {isAIEnabled ? 'AI Enabled' : 'Basic Mode'}
                </button>
                <span className="text-gray-400">Powered by Mistral AI</span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

