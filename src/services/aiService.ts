import apiClient from './api/client';
import { endpoints } from './api/config';
import { Product } from '@/types';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatResponse {
  message: string;
  suggestions?: string[];
}

interface SemanticSearchRequest {
  query: string;
  businessId: string;
  limit?: number;
}

interface ImageSearchRequest {
  imageFile: File;
  businessId: string;
  limit?: number;
}

interface ReviewSentiment {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  summary: string;
  keywords: string[];
}

// Mistral AI Configuration
// Using Mistral AI's open-source models via API (free tier available)
// Or self-hosted using Ollama with Mistral models
const MISTRAL_API_URL = process.env.NEXT_PUBLIC_MISTRAL_API_URL || 'https://api.mistral.ai/v1';
const MISTRAL_API_KEY = process.env.NEXT_PUBLIC_MISTRAL_API_KEY || ''; // Optional - can use self-hosted
const USE_SELF_HOSTED = process.env.NEXT_PUBLIC_USE_SELF_HOSTED_AI === 'true';
const SELF_HOSTED_API_URL = process.env.NEXT_PUBLIC_SELF_HOSTED_AI_URL || 'http://localhost:11434'; // Ollama default

export const aiService = {
  /**
   * AI Chatbot - Get intelligent responses using Mistral AI (open-source)
   * Supports both Mistral API and self-hosted Ollama with Mistral models
   */
  async chat(
    messages: ChatMessage[],
    context?: {
      businessId?: string;
      businessName?: string;
      products?: Product[];
      userOrders?: any[];
    }
  ): Promise<ChatResponse> {
    try {
      // Build system prompt with context
      const systemPrompt = `You are a helpful assistant for ${context?.businessName || 'FlowCart'}, an e-commerce platform. 
      Help customers with their questions about products, orders, and services. 
      ${context?.products ? `Available products: ${context.products.slice(0, 10).map(p => p.name).join(', ')}` : ''}
      Be friendly, concise, and helpful.`;

      const chatMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...messages,
      ];

      if (USE_SELF_HOSTED) {
        // Use self-hosted Ollama with Mistral model
        return await this.chatWithOllama(chatMessages);
      } else if (MISTRAL_API_KEY) {
        // Use Mistral AI API
        return await this.chatWithMistralAPI(chatMessages);
      } else {
        // Fallback to backend API (which can use Mistral)
        const response = await apiClient.post<ChatResponse>(
          endpoints.ai?.chat || '/api/ai/chat',
          {
            messages: chatMessages,
            context,
            model: 'mistral', // Specify Mistral model
          }
        );
        return response.data;
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      // Fallback to basic response
      return {
        message: 'I apologize, but I\'m having trouble processing your request right now. Please try again later or contact support.',
        suggestions: [
          'How do I place an order?',
          'What payment methods do you accept?',
          'How do I track my order?'
        ]
      };
    }
  },

  /**
   * Chat with Mistral AI API (free tier available)
   */
  async chatWithMistralAPI(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      const response = await fetch(`${MISTRAL_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MISTRAL_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistral-tiny', // Free tier model, or 'mistral-small', 'mistral-medium'
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mistral API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        message: data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.',
        suggestions: this.extractSuggestions(data.choices[0]?.message?.content || ''),
      };
    } catch (error) {
      console.error('Mistral API error:', error);
      throw error;
    }
  },

  /**
   * Chat with self-hosted Ollama (Mistral models)
   * Install Ollama: https://ollama.ai
   * Run: ollama pull mistral (or mistral:7b, mixtral:8x7b)
   */
  async chatWithOllama(messages: ChatMessage[]): Promise<ChatResponse> {
    try {
      const response = await fetch(`${SELF_HOSTED_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistral', // or 'mistral:7b', 'mixtral:8x7b'
          messages: messages.map(m => ({ role: m.role, content: m.content })),
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        message: data.message?.content || 'I apologize, but I couldn\'t generate a response.',
        suggestions: this.extractSuggestions(data.message?.content || ''),
      };
    } catch (error) {
      console.error('Ollama API error:', error);
      throw error;
    }
  },

  /**
   * Extract suggestions from AI response
   */
  extractSuggestions(text: string): string[] {
    // Simple extraction - can be enhanced
    const suggestions: string[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      if (line.includes('?') && line.length < 100) {
        suggestions.push(line.trim());
      }
    });

    return suggestions.slice(0, 3);
  },

  /**
   * AI Semantic Search - Find products using natural language
   */
  async semanticSearch(request: SemanticSearchRequest): Promise<Product[]> {
    try {
      const response = await apiClient.post<{ products: Product[] }>(
        endpoints.ai?.semanticSearch ? endpoints.ai.semanticSearch(request.businessId) : `/api/ai/search/${request.businessId}`,
        {
          query: request.query,
          limit: request.limit || 10,
        }
      );
      return response.data?.products || [];
    } catch (error) {
      console.error('AI Semantic Search error:', error);
      return [];
    }
  },

  /**
   * AI Image Search - Find products by uploading an image
   */
  async imageSearch(request: ImageSearchRequest): Promise<Product[]> {
    try {
      const formData = new FormData();
      formData.append('image', request.imageFile);
      formData.append('businessId', request.businessId);
      formData.append('limit', String(request.limit || 10));

      const response = await apiClient.post<{ products: Product[] }>(
        endpoints.ai?.imageSearch ? endpoints.ai.imageSearch(request.businessId) : `/api/ai/image-search/${request.businessId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data?.products || [];
    } catch (error) {
      console.error('AI Image Search error:', error);
      return [];
    }
  },

  /**
   * AI Review Sentiment Analysis
   */
  async analyzeReviewSentiment(reviewText: string): Promise<ReviewSentiment> {
    try {
      const response = await apiClient.post<ReviewSentiment>(
        endpoints.ai?.sentimentAnalysis || '/api/ai/sentiment',
        {
          text: reviewText,
        }
      );
      return response.data;
    } catch (error) {
      console.error('AI Sentiment Analysis error:', error);
      // Fallback analysis
      const lowerText = reviewText.toLowerCase();
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'perfect', 'wonderful', 'fantastic'];
      const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'disappointed', 'poor', 'horrible'];
      
      const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
      const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
      
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      let score = 0.5;
      
      if (positiveCount > negativeCount) {
        sentiment = 'positive';
        score = 0.7 + (positiveCount * 0.1);
      } else if (negativeCount > positiveCount) {
        sentiment = 'negative';
        score = 0.3 - (negativeCount * 0.1);
      }
      
      return {
        sentiment,
        score: Math.max(0, Math.min(1, score)),
        summary: sentiment === 'positive' ? 'Overall positive feedback' : sentiment === 'negative' ? 'Overall negative feedback' : 'Neutral feedback',
        keywords: [...positiveWords.filter(w => lowerText.includes(w)), ...negativeWords.filter(w => lowerText.includes(w))],
      };
    }
  },

  /**
   * AI Product Description Generator
   */
  async generateProductDescription(product: Partial<Product>): Promise<string> {
    try {
      const response = await apiClient.post<{ description: string }>(
        endpoints.ai?.generateDescription || '/api/ai/generate-description',
        {
          productName: product.name,
          category: product.categoryName,
          price: product.price,
          existingDescription: product.description,
        }
      );
      return response.data?.description || '';
    } catch (error) {
      console.error('AI Description Generation error:', error);
      return '';
    }
  },

  /**
   * AI Voice Search - Convert speech to text and search
   */
  async voiceSearch(audioBlob: Blob, businessId: string): Promise<Product[]> {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('businessId', businessId);

      const response = await apiClient.post<{ query: string; products: Product[] }>(
        endpoints.ai?.voiceSearch ? endpoints.ai.voiceSearch(businessId) : `/api/ai/voice-search/${businessId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data?.products || [];
    } catch (error) {
      console.error('AI Voice Search error:', error);
      return [];
    }
  },
};

