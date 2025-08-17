import axios from 'axios';
import { API_BASE_URL } from '../constants';

export interface QuantityUpdateResponse {
  success: boolean;
  product_id: number;
  old_quantity: number;
  new_quantity: number;
  availability_status: string;
  message?: string;
}

export interface ProductAvailabilityCheck {
  product_id: number;
  is_available: boolean;
  availability_status: string;
  quantity_available: number;
  admin_approval_status: string;
  reasons: string[];
}

export interface QuantitySyncResult {
  success: boolean;
  synced_products: number;
  details: Array<{
    product_id: number;
    title: string;
    old_quantity_available: number;
    new_quantity_available: number;
    active_rentals: number;
  }>;
}

class QuantityService {
  /**
   * ตรวจสอบความพร้อมของสินค้า
   */
  async checkProductAvailability(productId: number): Promise<ProductAvailabilityCheck> {
    try {
      const response = await axios.get(`${API_BASE_URL}/products/${productId}/availability`);
      return response.data.data;
    } catch (error) {
      console.error('Error checking product availability:', error);
      throw error;
    }
  }

  /**
   * ซิงค์ quantity ของสินค้าทั้งหมด (Admin only)
   */
  async syncAllProductQuantities(): Promise<QuantitySyncResult> {
    try {
      const response = await axios.post(`${API_BASE_URL}/products/sync-quantities`);
      return response.data.data;
    } catch (error) {
      console.error('Error syncing all product quantities:', error);
      throw error;
    }
  }

  /**
   * ซิงค์ quantity ของสินค้าเฉพาะ ID
   */
  async syncSingleProductQuantity(productId: number): Promise<QuantitySyncResult> {
    try {
      const response = await axios.post(`${API_BASE_URL}/products/${productId}/sync-quantity`);
      return response.data.data;
    } catch (error) {
      console.error(`Error syncing product ${productId} quantity:`, error);
      throw error;
    }
  }

  /**
   * ตรวจสอบสถานะสินค้าหลายรายการพร้อมกัน
   */
  async checkMultipleProductsAvailability(productIds: number[]): Promise<ProductAvailabilityCheck[]> {
    try {
      const promises = productIds.map(id => this.checkProductAvailability(id));
      const results = await Promise.allSettled(promises);
      
      return results
        .filter((result): result is PromiseFulfilledResult<ProductAvailabilityCheck> => 
          result.status === 'fulfilled')
        .map(result => result.value);
    } catch (error) {
      console.error('Error checking multiple products availability:', error);
      throw error;
    }
  }

  /**
   * สร้าง notification เมื่อสินค้าหมดหรือกลับมามี
   */
  async notifyQuantityChange(productId: number, oldQuantity: number, newQuantity: number): Promise<void> {
    try {
      // ตรวจสอบการเปลี่ยนแปลงสถานะ
      const wasOutOfStock = oldQuantity === 0;
      const isNowOutOfStock = newQuantity === 0;
      const isBackInStock = wasOutOfStock && newQuantity > 0;

      if (isNowOutOfStock) {
        console.log(`Product ${productId} is now out of stock`);
        // ส่ง notification ไปยัง users ที่สนใจ
        await this.sendOutOfStockNotification(productId);
      } else if (isBackInStock) {
        console.log(`Product ${productId} is back in stock`);
        // ส่ง notification ไปยัง users ที่รอ
        await this.sendBackInStockNotification(productId);
      }
    } catch (error) {
      console.error('Error sending quantity change notification:', error);
      // ไม่ throw error เพราะ notification ไม่ควรทำให้ main operation ล้มเหลว
    }
  }

  /**
   * ส่งการแจ้งเตือนเมื่อสินค้าหมด
   */
  private async sendOutOfStockNotification(productId: number): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/notifications/out-of-stock`, {
        product_id: productId,
        type: 'product_out_of_stock'
      });
    } catch (error) {
      console.error('Error sending out of stock notification:', error);
    }
  }

  /**
   * ส่งการแจ้งเตือนเมื่อสินค้ากลับมามี
   */
  private async sendBackInStockNotification(productId: number): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/notifications/back-in-stock`, {
        product_id: productId,
        type: 'product_back_in_stock'
      });
    } catch (error) {
      console.error('Error sending back in stock notification:', error);
    }
  }

  /**
   * สมัครรับการแจ้งเตือนเมื่อสินค้ากลับมามี
   */
  async subscribeToBackInStockNotification(productId: number): Promise<void> {
    try {
      await axios.post(`${API_BASE_URL}/notifications/subscribe-back-in-stock`, {
        product_id: productId
      });
    } catch (error) {
      console.error('Error subscribing to back in stock notification:', error);
      throw error;
    }
  }

  /**
   * ยกเลิกการสมัครรับการแจ้งเตือน
   */
  async unsubscribeFromBackInStockNotification(productId: number): Promise<void> {
    try {
      await axios.delete(`${API_BASE_URL}/notifications/subscribe-back-in-stock/${productId}`);
    } catch (error) {
      console.error('Error unsubscribing from back in stock notification:', error);
      throw error;
    }
  }

  /**
   * ตรวจสอบว่าผู้ใช้สมัครรับการแจ้งเตือนสินค้านี้หรือไม่
   */
  async checkBackInStockSubscription(productId: number): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL}/notifications/subscribe-back-in-stock/${productId}`);
      return response.data.data.is_subscribed;
    } catch (error) {
      console.error('Error checking back in stock subscription:', error);
      return false;
    }
  }
}

export const quantityService = new QuantityService();
export default quantityService;