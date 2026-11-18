import axios from 'axios';
import { backendDomain } from '@/constants/Domain';

export interface DemoRequestPayload {
  name: string;
  company: string;
  phoneNumber: string;
  email: string;
}

export interface DemoRequestResponse {
  message: string;
  success: boolean;
}

export const submitDemoRequest = async (payload: DemoRequestPayload): Promise<DemoRequestResponse> => {
  const response = await axios.post<DemoRequestResponse>(
    `${backendDomain}/api/v1/public/demo-request`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data;
};
