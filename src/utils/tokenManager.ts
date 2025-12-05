// import { jwtDecode } from "jwt-decode";
import {jwtDecode} from 'jwt-decode'
interface DecodedToken {
  email: string;
  name?: string;
  exp: number;
  iat: number;
}

export class TokenManager {
  private static readonly TOKEN_REFRESH_THRESHOLD = 60 * 60 * 1000; // 1 hour before expiry

  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  static isTokenExpiringSoon(token: string): boolean {
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      const currentTime = Date.now();
      const expiryTime = decoded.exp * 1000;
      return (expiryTime - currentTime) < this.TOKEN_REFRESH_THRESHOLD;
    } catch (error) {
      console.error('Error checking token expiry:', error);
      return true;
    }
  }

  static async refreshToken(email: string): Promise<{ token: string; userDetails: any } | null> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const response = await fetch(`${API_BASE_URL}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      return {
        token: data.token,
        userDetails: data.userDetails,
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return null;
    }
  }

  static getStoredToken(): string | null {
    try {
      const userAuth = localStorage.getItem('userAuth');
      if (!userAuth) return null;
      
      const parsed = JSON.parse(userAuth);
      return parsed.token || null;
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  static getStoredUserDetails(): any {
    try {
      const userAuth = localStorage.getItem('userAuth');
      if (!userAuth) return null;
      
      const parsed = JSON.parse(userAuth);
      return parsed.userDetails || null;
    } catch (error) {
      console.error('Error getting stored user details:', error);
      return null;
    }
  }

  static updateStoredToken(token: string, userDetails: any): void {
    try {
      const userAuth = localStorage.getItem('userAuth');
      const existing = userAuth ? JSON.parse(userAuth) : {};
      
      const updated = {
        ...existing,
        token,
        userDetails,
      };
      
      localStorage.setItem('userAuth', JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating stored token:', error);
    }
  }

  static clearStoredToken(): void {
    try {
      localStorage.removeItem('userAuth');
    } catch (error) {
      console.error('Error clearing stored token:', error);
    }
  }
}
