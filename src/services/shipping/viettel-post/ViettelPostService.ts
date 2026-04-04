// Viettel Post API service implementation
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  ViettelPostPriceRequest,
  ViettelPostPriceResponse,
  ViettelPostCreateOrderRequest,
  ViettelPostCreateOrderResponse,
  ViettelPostCancelOrderRequest,
  ViettelPostCancelOrderResponse,
  ViettelPostOrderStatusRequest,
  ViettelPostOrderStatusResponse,
  ViettelPostPrintRequest,
  ViettelPostPrintResponse,
  VIETTEL_POST_CONSTANTS,
} from './types';

export class ViettelPostService {
  private client: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(
    private apiUrl: string,
    private username: string,
    private password: string
  ) {
    this.client = axios.create({
      baseURL: apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('Viettel Post API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Login to Viettel Post API and get authentication token
   */
  private async login(): Promise<string> {
    try {
      const response = await this.client.post('/user/Login', {
        USERNAME: this.username,
        PASSWORD: this.password,
      });

      if (response.data && response.data.data && response.data.data.token) {
        this.token = response.data.data.token;
        // Token typically expires in 24 hours
        this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        return this.token;
      }

      throw new Error('Failed to get authentication token from Viettel Post');
    } catch (error) {
      console.error('Viettel Post login error:', error);
      throw new Error('Viettel Post authentication failed');
    }
  }

  /**
   * Get valid authentication token (login if needed)
   */
  private async getToken(): Promise<string> {
    // Check if we have a valid token
    if (
      this.token &&
      this.tokenExpiry &&
      this.tokenExpiry > new Date()
    ) {
      return this.token;
    }

    // Login to get new token
    return await this.login();
  }

  /**
   * Estimate shipping price
   */
  async estimatePrice(
    request: ViettelPostPriceRequest
  ): Promise<ViettelPostPriceResponse> {
    try {
      const token = await this.getToken();
      const response = await this.client.post<ViettelPostPriceResponse>(
        '/getPriceAll',
        {
          ...request,
          PRODUCT_TYPE: request.PRODUCT_TYPE || VIETTEL_POST_CONSTANTS.PRODUCT_TYPE.GOODS,
          TYPE: request.TYPE || 1,
        },
        {
          headers: {
            Token: token,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Viettel Post estimate price error:', error);
      throw error;
    }
  }

  /**
   * Create shipping order
   */
  async createOrder(
    request: ViettelPostCreateOrderRequest
  ): Promise<ViettelPostCreateOrderResponse> {
    try {
      const token = await this.getToken();
      const response = await this.client.post<ViettelPostCreateOrderResponse>(
        '/order/createOrder',
        {
          ...request,
          PRODUCT_TYPE: request.PRODUCT_TYPE || VIETTEL_POST_CONSTANTS.PRODUCT_TYPE.GOODS,
          ORDER_PAYMENT: request.ORDER_PAYMENT || VIETTEL_POST_CONSTANTS.ORDER_PAYMENT.SENDER_PAY,
          ORDER_SERVICE: request.ORDER_SERVICE || VIETTEL_POST_CONSTANTS.ORDER_SERVICE.VCN,
        },
        {
          headers: {
            Token: token,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Viettel Post create order error:', error);
      throw error;
    }
  }

  /**
   * Cancel shipping order
   */
  async cancelOrder(
    orderNumber: string,
    type: number = 2
  ): Promise<ViettelPostCancelOrderResponse> {
    try {
      const token = await this.getToken();
      const response = await this.client.post<ViettelPostCancelOrderResponse>(
        '/order/cancelOrder',
        {
          ORDER_NUMBER: orderNumber,
          TYPE: type,
        },
        {
          headers: {
            Token: token,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Viettel Post cancel order error:', error);
      throw error;
    }
  }

  /**
   * Get order status/tracking info
   */
  async getOrderStatus(
    request: ViettelPostOrderStatusRequest
  ): Promise<ViettelPostOrderStatusResponse> {
    try {
      const token = await this.getToken();
      const response = await this.client.post<ViettelPostOrderStatusResponse>(
        '/order/getListOrderStatus',
        request,
        {
          headers: {
            Token: token,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Viettel Post get order status error:', error);
      throw error;
    }
  }

  /**
   * Get shipping label as PDF (base64)
   */
  async getShippingLabel(
    orderNumbers: string[],
    type: number = VIETTEL_POST_CONSTANTS.PRINT_TYPE.LABEL
  ): Promise<ViettelPostPrintResponse> {
    try {
      const token = await this.getToken();
      const response = await this.client.post<ViettelPostPrintResponse>(
        '/order/getPrintOrder',
        {
          TYPE: type,
          ORDER_ARRAY: orderNumbers,
        },
        {
          headers: {
            Token: token,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Viettel Post get shipping label error:', error);
      throw error;
    }
  }

  /**
   * Get order information by order number
   */
  async getOrderInfo(orderNumber: string): Promise<ViettelPostOrderStatusResponse> {
    return this.getOrderStatus({
      ORDER_NUMBER: orderNumber,
      TYPE: VIETTEL_POST_CONSTANTS.TRACKING_TYPE.ALL,
    });
  }
}

// Singleton instance
let viettelPostService: ViettelPostService | null = null;

export function getViettelPostService(): ViettelPostService {
  if (!viettelPostService) {
    const apiUrl = process.env.VIETTEL_POST_API_URL || 'https://partner.viettelpost.vn/v2';
    const username = process.env.VIETTEL_POST_USERNAME || '';
    const password = process.env.VIETTEL_POST_PASSWORD || '';

    if (!username || !password) {
      throw new Error('Viettel Post credentials not configured');
    }

    viettelPostService = new ViettelPostService(apiUrl, username, password);
  }

  return viettelPostService;
}
