'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  placeholder?: string;
  id?: string;
  error?: boolean; // For react-hook-form error state
  disabled?: boolean;
}

export default function CustomSelect({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  id,
  error = false,
  disabled = false,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectOption = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef} id={id}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full h-[42px] flex items-center justify-between rounded-md border bg-white px-3 py-2 text-left shadow-sm focus:outline-none focus:ring-1 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-purple-500 focus:ring-purple-500'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed text-gray-500' : 'cursor-pointer'}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`block truncate ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && !disabled && (
        <div
          className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-auto focus:outline-none"
          role="listbox"
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelectOption(option.value)}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-purple-50 text-gray-900 flex justify-between items-center"
              role="option"
              aria-selected={value === option.value}
            >
              <span className="block truncate">{option.label}</span>
              {value === option.value && (
                <Check className="h-5 w-5 text-purple-600" />
              )}
            </div>
          ))}
          {options.length === 0 && (
             <div className="cursor-default select-none relative py-2 px-3 text-gray-500">
               No options available
             </div>
          )}
        </div>
      )}
    </div>
  );
} 