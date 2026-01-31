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
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Convert display format (dd/MM/yyyy) to ISO (YYYY-MM-DD)
  const parseDisplayDate = (displayDate: string): string => {
    if (!displayDate) return "";
    try {
      // Try to parse dd/MM/yyyy format
      const date = parse(displayDate, "dd/MM/yyyy", new Date());
      return format(date, "yyyy-MM-dd");
    } catch {
      // If parsing fails, try to parse as ISO format
      try {
        const date = parse(displayDate, "yyyy-MM-dd", new Date());
        return format(date, "yyyy-MM-dd");
      } catch {
        return "";
      }
    }
  };

  useEffect(() => {
    setDisplayValue(formatDisplayDate(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoDate = e.target.value; // HTML5 date input returns YYYY-MM-DD
    onChange(isoDate);
    setDisplayValue(formatDisplayDate(isoDate));
    setIsOpen(false);
  };

  const handleDisplayInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    // Try to parse and convert to ISO format
    const isoDate = parseDisplayDate(inputValue);
    if (isoDate) {
      onChange(isoDate);
    }
  };

  const handleDisplayInputBlur = () => {
    // Validate and reformat on blur
    const isoDate = parseDisplayDate(displayValue);
    if (isoDate) {
      setDisplayValue(formatDisplayDate(isoDate));
      onChange(isoDate);
    } else if (displayValue) {
      // If invalid, revert to current value
      setDisplayValue(formatDisplayDate(value));
    }
  };

  const openDatePicker = () => {
    setIsOpen(true);
    // Focus the hidden input to open the calendar
    setTimeout(() => {
      inputRef.current?.showPicker?.();
    }, 0);
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          value={displayValue}
          onChange={handleDisplayInputChange}
          onBlur={handleDisplayInputBlur}
          placeholder={placeholder}
          className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            hasError
              ? "border-red-500 focus:ring-red-500"
              : "border-gray-300"
          }`}
        />
        <button
          type="button"
          onClick={openDatePicker}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          tabIndex={-1}
        >
          <Calendar size={18} />
        </button>
        {/* Hidden HTML5 date input for calendar dropdown */}
        <input
          ref={inputRef}
          type="date"
          value={value || ""}
          onChange={handleDateChange}
          min={minDate}
          max={maxDate}
          className="absolute opacity-0 pointer-events-none w-0 h-0"
          style={{ position: "absolute", left: "-9999px" }}
        />
      </div>
    </div>
  );
};
