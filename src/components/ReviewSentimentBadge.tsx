'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Sparkles, Loader2 } from 'lucide-react';
import { aiService } from '@/services/aiService';
import { motion } from 'framer-motion';

interface ReviewSentimentBadgeProps {
  reviewText: string;
  showDetails?: boolean;
}

export default function ReviewSentimentBadge({ reviewText, showDetails = false }: ReviewSentimentBadgeProps) {
  const [sentiment, setSentiment] = useState<'positive' | 'negative' | 'neutral' | null>(null);
  const [score, setScore] = useState<number>(0.5);
  const [summary, setSummary] = useState<string>('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (reviewText && reviewText.length > 10) {
      analyzeSentiment();
    }
  }, [reviewText]);

  const analyzeSentiment = async () => {
    setLoading(true);
    try {
      const result = await aiService.analyzeReviewSentiment(reviewText);
      setSentiment(result.sentiment);
      setScore(result.score);
      setSummary(result.summary);
      setKeywords(result.keywords);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-full text-xs">
        <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
        <span className="text-gray-600 dark:text-gray-400">Analyzing...</span>
      </div>
    );
  }

  if (!sentiment) return null;

  const getSentimentColor = () => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'negative':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700';
    }
  };

  const getSentimentIcon = () => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="w-3.5 h-3.5" />;
      case 'negative':
        return <TrendingDown className="w-3.5 h-3.5" />;
      default:
        return <Minus className="w-3.5 h-3.5" />;
    }
  };

  const getScoreColor = () => {
    if (score >= 0.7) return 'bg-green-500';
    if (score <= 0.3) return 'bg-red-500';
    return 'bg-gray-500';
  };

  return (
    <div className="inline-flex flex-col gap-2">
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => showDetails && setExpanded(!expanded)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${getSentimentColor()} ${
          showDetails ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" />
        {getSentimentIcon()}
        <span className="capitalize">{sentiment}</span>
        {showDetails && (
          <span className="text-xs opacity-75">
            {Math.round(score * 100)}%
          </span>
        )}
      </motion.button>

      {showDetails && expanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700 text-sm space-y-3 max-w-xs"
        >
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Sentiment Score</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreColor()} transition-all duration-300`}
                  style={{ width: `${score * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {Math.round(score * 100)}%
              </span>
            </div>
          </div>

          {summary && (
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Summary</p>
              <p className="text-xs text-gray-800 dark:text-gray-200">{summary}</p>
            </div>
          )}

          {keywords.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Key Terms</p>
              <div className="flex flex-wrap gap-1">
                {keywords.slice(0, 5).map((keyword, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

