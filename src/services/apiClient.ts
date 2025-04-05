import axios from 'axios';

// API base URL - can be updated based on environment
const API_BASE_URL = 'http://localhost:3001/api';

// Create an axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from localStorage
    const token = localStorage.getItem('auth_token');
    
    // If token exists, add it to the request headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  // Verify beta code
  verifyBetaCode: async (betaCode: string) => {
    try {
      const response = await apiClient.post('/auth/verify-beta', { betaCode });
      // If successful, store the token in localStorage
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Beta code verification error:', error);
      throw error;
    }
  },
  
  // Validate token
  validateToken: async () => {
    try {
      const response = await apiClient.get('/auth/validate-token');
      return response.data;
    } catch (error) {
      console.error('Token validation error:', error);
      throw error;
    }
  },
  
  // Logout (clear token)
  logout: () => {
    localStorage.removeItem('auth_token');
  }
};

// Payment API
export const paymentApi = {
  // Initialize payment
  initializePayment: async (amount: string, currency: string, reportId: string) => {
    try {
      const response = await apiClient.post('/payment/initialize', {
        amount,
        currency,
        reportId
      });
      return response.data;
    } catch (error) {
      console.error('Payment initialization error:', error);
      throw error;
    }
  },
  
  // Verify payment
  verifyPayment: async (paymentId: string, txHash: string) => {
    try {
      const response = await apiClient.post('/payment/verify', {
        paymentId,
        txHash
      });
      
      // If successful, store the token in localStorage
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Payment verification error:', error);
      throw error;
    }
  },
  
  // Get payment status
  getPaymentStatus: async (paymentId: string) => {
    try {
      const response = await apiClient.get(`/payment/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Payment status error:', error);
      throw error;
    }
  }
};

// Report API
export const reportApi = {
  // Generate report
  generateReport: async (studentData: any) => {
    try {
      const response = await apiClient.post('/report/generate', { studentData });
      return response.data;
    } catch (error) {
      console.error('Report generation error:', error);
      throw error;
    }
  },
  
  // Get report
  getReport: async (reportId: string) => {
    try {
      const response = await apiClient.get(`/report/${reportId}`);
      return response.data;
    } catch (error) {
      console.error('Get report error:', error);
      throw error;
    }
  },
  
  // Download report PDF
  downloadReportPdf: async (reportId: string) => {
    try {
      const response = await apiClient.get(`/report/${reportId}/pdf`, {
        responseType: 'blob'
      });
      
      // Create a download link and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `college-plan-${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('PDF download error:', error);
      throw error;
    }
  }
};

export default {
  auth: authApi,
  payment: paymentApi,
  report: reportApi
}; 