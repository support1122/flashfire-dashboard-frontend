// API Base URL - Update this for production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export const apiService = {
  // Register - sends OTP
  async register(userData: { email: string; name: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return response.json();
  },

  // Verify OTP
  async verifyOTP(otpData: { email: string; otp: string; name: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(otpData),
    });
    return response.json();
  },

  // Resend OTP
  async resendOTP(emailData: { email: string; name: string }) {
    const response = await fetch(`${API_BASE_URL}/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    });
    return response.json();
  },

  // Login
  async login(loginData: { email: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loginData),
    });
    return response.json();
  },
};

export default apiService;
