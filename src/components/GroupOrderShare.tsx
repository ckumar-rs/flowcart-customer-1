'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Share2, X } from 'lucide-react';
import { GroupOrderDto } from '@/types';
import toast from 'react-hot-toast';

interface GroupOrderShareProps {
  groupOrder: GroupOrderDto;
  onClose?: () => void;
}

export default function GroupOrderShare({ groupOrder, onClose }: GroupOrderShareProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/group-order/${groupOrder.groupCode}`
    : '';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Group code copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join my group order: ${groupOrder.name}`,
          text: `Join my group order "${groupOrder.name}" using code: ${groupOrder.groupCode}`,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-700 dark:from-primary-700 dark:to-primary-800 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>
      )}
      
      <div className="relative z-10">
        <h3 className="text-xl font-bold mb-2">Share Group Order</h3>
        <p className="text-primary-100 text-sm mb-6">{groupOrder.name}</p>

        {/* Group Code */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4 border border-white/20">
          <p className="text-xs text-primary-200 mb-2">Group Code</p>
          <div className="flex items-center gap-3">
            <code className="text-3xl font-black tracking-wider flex-1">{groupOrder.groupCode}</code>
            <button
              onClick={handleCopy}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-300" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl py-3 font-semibold transition-colors border border-white/30"
          >
            <Share2 className="w-5 h-5" />
            Share Link
          </button>
          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl py-3 font-semibold transition-colors border border-white/30"
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                Copy Code
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-primary-200 mt-4 text-center">
          Share this code with friends to let them join your group order
        </p>
      </div>
    </div>
  );
}

