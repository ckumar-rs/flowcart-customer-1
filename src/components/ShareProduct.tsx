'use client';

import { Share2, Facebook, Twitter, MessageCircle, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface ShareProductProps {
  productName: string;
  productId: string;
  productUrl?: string;
}

export default function ShareProduct({ productName, productId, productUrl }: ShareProductProps) {
  const [copied, setCopied] = useState(false);
  const url = productUrl || (typeof window !== 'undefined' ? window.location.href : '');

  const handleShare = async (platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy') => {
    const shareText = `Check out ${productName} on FlowCart!`;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(shareText);

    switch (platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
        break;
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodedText}%20${encodedUrl}`, '_blank');
        break;
      case 'copy':
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          toast.success('Link copied to clipboard!');
          setTimeout(() => setCopied(false), 2000);
        } else {
          toast.error('Clipboard not available');
        }
        break;
    }
  };

  // Use native Web Share API if available (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productName,
          text: `Check out ${productName} on FlowCart!`,
          url: url,
        });
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback: show share options
      handleShare('copy');
    }
  };

  return (
    <div className="flex items-center gap-2">
      {typeof navigator !== 'undefined' && 'share' in navigator && typeof navigator.share === 'function' ? (
        <button
          onClick={handleNativeShare}
          className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors text-sm font-medium"
          aria-label="Share product"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleShare('facebook')}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Share on Facebook"
          >
            <Facebook className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleShare('twitter')}
            className="p-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
            aria-label="Share on Twitter"
          >
            <Twitter className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleShare('whatsapp')}
            className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            aria-label="Share on WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleShare('copy')}
            className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Copy link"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}

