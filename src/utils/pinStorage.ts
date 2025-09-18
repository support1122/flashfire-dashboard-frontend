/**
 * Utility functions for managing PIN storage in localStorage
 */

const PIN_STORAGE_KEY = 'flashfire_unlock_pin';
const PIN_EXPIRY_KEY = 'flashfire_unlock_pin_expiry';
const PIN_EXPIRY_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Store the PIN in localStorage with expiry
 * @param pin - The PIN to store
 */
export const storePin = (pin: string): void => {
    try {
        const expiryTime = Date.now() + PIN_EXPIRY_DURATION;
        localStorage.setItem(PIN_STORAGE_KEY, pin);
        localStorage.setItem(PIN_EXPIRY_KEY, expiryTime.toString());
    } catch (error) {
        console.error('Failed to store PIN:', error);
    }
};

/**
 * Retrieve the stored PIN if it exists and hasn't expired
 * @returns The stored PIN or null if not found/expired
 */
export const getStoredPin = (): string | null => {
    try {
        const storedPin = localStorage.getItem(PIN_STORAGE_KEY);
        const expiryTime = localStorage.getItem(PIN_EXPIRY_KEY);
        
        if (!storedPin || !expiryTime) {
            return null;
        }
        
        const now = Date.now();
        const expiry = parseInt(expiryTime, 10);
        
        if (now > expiry) {
            // PIN has expired, remove it
            clearStoredPin();
            return null;
        }
        
        return storedPin;
    } catch (error) {
        console.error('Failed to retrieve stored PIN:', error);
        return null;
    }
};

/**
 * Clear the stored PIN from localStorage
 */
export const clearStoredPin = (): void => {
    try {
        localStorage.removeItem(PIN_STORAGE_KEY);
        localStorage.removeItem(PIN_EXPIRY_KEY);
    } catch (error) {
        console.error('Failed to clear stored PIN:', error);
    }
};

/**
 * Check if a PIN is currently stored and valid
 * @returns true if PIN is stored and not expired
 */
export const hasValidStoredPin = (): boolean => {
    return getStoredPin() !== null;
};

/**
 * Get the time remaining until PIN expires (in milliseconds)
 * @returns Time remaining in milliseconds, or 0 if expired/not found
 */
export const getPinTimeRemaining = (): number => {
    try {
        const expiryTime = localStorage.getItem(PIN_EXPIRY_KEY);
        if (!expiryTime) {
            return 0;
        }
        
        const now = Date.now();
        const expiry = parseInt(expiryTime, 10);
        const remaining = expiry - now;
        
        return Math.max(0, remaining);
    } catch (error) {
        console.error('Failed to get PIN time remaining:', error);
        return 0;
    }
};

/**
 * Get a human-readable string of time remaining until PIN expires
 * @returns Formatted time string or null if expired/not found
 */
export const getPinTimeRemainingString = (): string | null => {
    const remaining = getPinTimeRemaining();
    if (remaining === 0) {
        return null;
    }
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else {
        return `${minutes}m`;
    }
};
