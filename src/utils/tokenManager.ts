// import { jwtDecode } from "jwt-decode";
import {jwtDecode} from 'jwt-decode'
interface DecodedToken {
  email: string;
  name?: string;
  exp: number;
  iat: number;
}

// The auth payload the backend returns. Known fields are typed; the index
// signature covers the plan/resume extras that vary between the client and
// operations login responses.
export interface StoredUserDetails {
  name?: string;
  email?: string;
  role?: string;
  planType?: string;
  userType?: string;
  [key: string]: unknown;
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

  // The backend now renews only a token the caller already holds - it will not
  // mint one from a bare email - so the current token has to be presented here.
  static async refreshToken(email: string): Promise<{ token: string; userDetails: StoredUserDetails } | null> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const currentToken = this.getStoredToken();

      if (!currentToken) {
        return null;
      }

      const response = await fetch(`${API_BASE_URL}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ email, token: currentToken }),
      });

      if (!response.ok) {
        // 401/403 means the session is genuinely over; drop it so the app
        // sends the user back to login instead of retrying a dead token.
        if (response.status === 401 || response.status === 403) {
          this.clearStoredToken();
        }
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

  static getStoredUserDetails(): StoredUserDetails | null {
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

  static updateStoredToken(token: string, userDetails: StoredUserDetails): void {
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
