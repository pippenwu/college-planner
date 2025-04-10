import axios from 'axios';

// API base URL - can be updated based on environment
const API_BASE_URL = import.meta.env.DEV 
  ? 'http://localhost:3001/api' 
  : 'https://college-planner-production.up.railway.app/api';

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
  verifyBetaCode: async (betaCode: string, reportId?: string) => {
    try {
      const response = await apiClient.post('/auth/verify-beta', { betaCode, reportId });
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
  
  // Verify coupon code
  verifyCouponCode: async (couponCode: string) => {
    try {
      const response = await apiClient.post('/auth/verify-coupon', { couponCode });
      return response.data;
    } catch (error) {
      console.error('Coupon code verification error:', error);
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
  },

  // Verify payment status using JWT token
  verifyPaymentStatus: async () => {
    try {
      // Get the current report ID
      const currentReportId = localStorage.getItem('current_report_id');
      
      // Add current report ID as query parameter
      const response = await apiClient.get(`/payment/verify-status?reportId=${currentReportId || ''}`);
      return response.data;
    } catch (error) {
      console.error('Payment verification status error:', error);
      // Return a default response if the verification fails
      return {
        success: false,
        isPaid: false,
        currentReportId: localStorage.getItem('current_report_id') || null,
        tokenReportId: null
      };
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
      // First check if we have a token, as this is required
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required. Please unlock the full report first.');
      }
      
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
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      return true;
    } catch (error: any) {
      console.error('PDF download error:', error);
      
      // Handle specific error types
      if (error.response) {
        // The request was made and the server responded with a status code
        if (error.response.status === 403) {
          throw new Error('Access denied. Please make sure you\'ve unlocked the full report and try again.');
        } else if (error.response.status === 404) {
          throw new Error('Report not found. Please regenerate your report.');
        }
      }
      
      throw error;
    }
  }
};

// Lemon Squeezy API
export const lemonSqueezyApi = {
  // Create checkout
  createCheckout: async (email: string, name: string, customData: any) => {
    try {
      const response = await apiClient.post('/create-checkout', {
        email,
        name,
        customData
      });
      return response.data;
    } catch (error) {
      console.error('Checkout creation error:', error);
      throw error;
    }
  }
};

export default {
  auth: authApi,
  payment: paymentApi,
  report: reportApi,
  lemonSqueezy: lemonSqueezyApi
}; 