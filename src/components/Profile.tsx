import React, { useMemo, useState, useContext, useEffect } from "react";
import { Pencil, Save, X, ArrowLeft, Copy, Check } from "lucide-react";
import { useUserProfile, UserProfile } from "../state_management/ProfileContext";
import { UserContext } from "../state_management/UserContext";
import { Link } from "react-router-dom";
import { toastUtils, toastMessages } from "../utils/toast";
import SecretKeyModal from "./SecretKeyModal";
import { useOperationsStore } from "../state_management/Operations";
import { DatePicker } from "./DatePicker";
import { format, parse, isValid } from "date-fns";

// Helper function to format date string (removes time component)
const formatDateOnly = (dateString: string | undefined): string => {
  if (!dateString) return "";
  
  try {
    // If it's an ISO string with time, extract just the date part
    let datePart = dateString;
    if (dateString.includes('T')) {
      datePart = dateString.split('T')[0]; // Get YYYY-MM-DD part
    }
    
    // Parse and format
    const date = parse(datePart, "yyyy-MM-dd", new Date());
    if (isValid(date)) {
      return format(date, "dd/MM/yyyy");
    }
    
    // Try parsing as ISO date string directly
    const isoDate = new Date(dateString);
    if (isValid(isoDate)) {
      return format(isoDate, "dd/MM/yyyy");
    }
    
    return dateString; // Return as-is if parsing fails
  } catch {
    return dateString; // Return as-is if any error
  }
};

// Helper function to extract date part from ISO datetime string for date inputs
const extractDatePart = (dateString: string | undefined): string => {
  if (!dateString) return "";
  
  try {
    // If it's an ISO string with time, extract just the date part
    if (dateString.includes('T')) {
      return dateString.split('T')[0]; // Get YYYY-MM-DD part
    }
    
    // If it's already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return dateString;
    }
    
    // Try to parse and extract date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return format(date, "yyyy-MM-dd");
    }
    
    return dateString; // Return as-is if parsing fails
  } catch {
    return dateString; // Return as-is if any error
  }
};

const validateUrl = (value: string) => {
    if (!value.trim()) return false;
    try {
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
            return false;
        }
        new URL(value);
        return true;
    } catch {
        return false;
    }
};

function RowTitle({ title, required = false }: { title: string; required?: boolean }) {
    return (
        <>
            {title}
            {required && <span className="ml-1 text-red-500">*</span>}
        </>
    );
}

/* ---------------- Helper Components ----------------- */
function Placeholder({ label }: { label?: string }) {
    return <span className="text-gray-400 italic">{label || "Not provided"}</span>;
}

function CopyButton({ value, title }: { value: string; title: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(value);
