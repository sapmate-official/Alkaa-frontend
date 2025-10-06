import axios from 'axios';
import { APIDictionary } from '../v2/APIdict';

export interface Toggle2FARequest {
  enabled: boolean;
}

export interface Toggle2FAResponse {
  message: string;
  twoFactorEnabled: boolean;
}

export interface VerifyCredentialsRequest {
  email: string;
  password: string;
  orgId?: string;
}

export interface VerifyCredentialsResponse {
  requiresOrgSelection?: boolean;
  organizations?: Array<{
    orgId: string;
    orgName: string;
    userId: string;
    userStatus: string;
  }>;
  requiresOTP?: boolean;
  sessionToken?: string;
  userId?: string;
  email?: string;
  firstName?: string;
  organizationName?: string;
  message: string;
}

export interface RequestOtpRequest {
  sessionToken: string;
}

export interface RequestOtpResponse {
  message: string;
  expiresIn: number;
}

export interface VerifyOtpRequest {
  sessionToken: string;
  otp: string;
}

export interface VerifyOtpResponse {
  message: string;
  userData: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    orgId: string;
    orgName: string;
    roles: string[];
    twoFactorEnabled: boolean;
  };
  accessToken: string;
  refreshToken: string;
  organization: {
    id: string;
    name: string;
  };
}

export const authService = {
  /**
   * Enhanced Multi-tenant Credential Verification with 2FA Integration
   * Step 1: Verify email/password with multi-tenant support
   */
  async verifyCredentials(credentials: VerifyCredentialsRequest): Promise<VerifyCredentialsResponse> {
    try {
      const response = await axios.post(
        APIDictionary.verifyCredentials,
        credentials,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Request OTP for verified session
   * Step 2: Generate and send OTP
   */
  async requestOtp(request: RequestOtpRequest): Promise<RequestOtpResponse> {
    try {
      const response = await axios.post(
        APIDictionary.requestOtp,
        request,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Verify OTP and complete login
   * Step 3: Complete authentication flow
   */
  async verifyLoginOtp(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    try {
      const response = await axios.post(
        APIDictionary.verifyLoginOtp,
        request,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Resend OTP for current session
   */
  async resendOtp(request: RequestOtpRequest): Promise<RequestOtpResponse> {
    try {
      const response = await axios.post(
        APIDictionary.resendOtp,
        request,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Toggle 2FA for the current user
   */
  async toggle2FA(enabled: boolean): Promise<Toggle2FAResponse> {
    try {
      const response = await axios.post(
        APIDictionary.toggle2FA,
        { enabled },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
