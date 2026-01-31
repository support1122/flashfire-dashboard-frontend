import React, { useState, useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { format, parse } from "date-fns";

interface DatePickerProps {
  value: string; // ISO format (YYYY-MM-DD) or empty string
  onChange: (value: string) => void;
  placeholder?: string;
  hasError?: boolean;
  label?: string;
  required?: boolean;
  minDate?: string; // ISO format
  maxDate?: string; // ISO format
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  hasError = false,
  label,
  required = false,
  minDate,
  maxDate,
}) => {
  const [displayValue, setDisplayValue] = useState("");
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Convert ISO date (YYYY-MM-DD) to display format (dd/MM/yyyy)
  const formatDisplayDate = (isoDate: string): string => {
    if (!isoDate) return "";
    try {
      const date = parse(isoDate, "yyyy-MM-dd", new Date());
      return format(date, "dd/MM/yyyy");
    } catch {
      return isoDate;
    }
  };

  useEffect(() => {
    setDisplayValue(formatDisplayDate(value));
  }, [value]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value; // HTML5 date input returns YYYY-MM-DD
    onChange(isoDate);
  };

  const openDatePicker = () => {
    if (dateInputRef.current) {
      // Try showPicker() first (modern browsers)
      if (typeof dateInputRef.current.showPicker === 'function') {
        try {
          const pickerPromise = dateInputRef.current.showPicker();
          // Check if showPicker returns a promise
          if (pickerPromise && typeof pickerPromise.catch === 'function') {
            pickerPromise.catch(() => {
              // Fallback if showPicker fails or is not allowed
              dateInputRef.current?.focus();
              setTimeout(() => {
                dateInputRef.current?.click();
              }, 10);
            });
          } else {
            // If showPicker doesn't return a promise, use fallback
            dateInputRef.current.focus();
            setTimeout(() => {
              dateInputRef.current?.click();
            }, 10);
          }
        } catch (error) {
          // If showPicker throws an error, use fallback
          dateInputRef.current.focus();
          setTimeout(() => {
            dateInputRef.current?.click();
          }, 10);
        }
      } else {
        // Fallback for older browsers - focus then click
        dateInputRef.current.focus();
        setTimeout(() => {
          dateInputRef.current?.click();
        }, 10);
      }
    }
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {/* Display input showing dd/mm/yyyy format */}
        <input
          type="text"
          value={displayValue}
          placeholder={placeholder}
          readOnly
          className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer ${
            hasError
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300"
          }`}
          onClick={openDatePicker}
        />
        {/* Native date input - positioned to be clickable but invisible, covers entire area except button */}
        <input
          ref={dateInputRef}
          type="date"
          value={value || ""}
          onChange={handleDateChange}
          min={minDate}
          max={maxDate}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
          style={{ 
            width: 'calc(100% - 40px)', // Leave space for calendar button
            height: '100%',
            cursor: 'pointer'
          }}
        />
        {/* Calendar icon button - positioned above date input */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openDatePicker();
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer z-20"
          tabIndex={-1}
        >
          <Calendar size={18} />
        </button>
      </div>
    </div>
  );
};
