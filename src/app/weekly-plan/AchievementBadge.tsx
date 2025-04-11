// src/components/weekly-plan/AchievementBadge.tsx
'use client';

import { useState, useEffect } from 'react';
import { Award, AlertTriangle, CheckCircle, X } from 'lucide-react';

interface AchievementBadgeProps {
  title: string;
  message: string;
  type: 'success' | 'milestone' | 'warning';
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
}

export default function AchievementBadge({ 
  title,
  message,
  type = 'success',
  onClose,
  autoClose = true,
  autoCloseTime = 5000
}: AchievementBadgeProps) {
  const [visible, setVisible] = useState(true);
  const [animation, setAnimation] = useState('animate-fadeIn');
  
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setAnimation('animate-fadeOut');
        
        // Start exit animation then close
        setTimeout(() => {
          setVisible(false);
          if (onClose) onClose();
        }, 300);
      }, autoCloseTime);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseTime, onClose]);
  
  const handleClose = () => {
    setAnimation('animate-fadeOut');
    
    // Start exit animation then close
    setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
    }, 300);
  };
  
  if (!visible) return null;
  
  // Determine badge styling based on type
  const badgeColors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle className="h-5 w-5 text-green-500" />
    },
    milestone: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-800',
      icon: <Award className="h-5 w-5 text-purple-500" />
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      icon: <AlertTriangle className="h-5 w-5 text-amber-500" />
    }
  };
  
  const colors = badgeColors[type];
  
  return (
    <div 
      className={`fixed bottom-4 right-4 shadow-md rounded-lg border ${colors.border} ${colors.bg} ${animation} max-w-sm z-50`}
    >
      <div className="flex p-4">
        <div className="flex-shrink-0 mr-3">
          {colors.icon}
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-medium ${colors.text}`}>{title}</h3>
          <div className={`mt-1 text-sm ${colors.text}`}>
            {message}
          </div>
        </div>
        <button
          onClick={handleClose}
          className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}