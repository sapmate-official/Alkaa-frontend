import { APIDictionary } from "@/api/v2/APIdict";

// Rename your interface to avoid conflict with browser's PushSubscription
interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class NotificationService {
  private vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.error('This browser does not support notifications');
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  async registerPushSubscription(userId: string): Promise<boolean> {
    try {
      const permission = await this.requestPermission();
      if (!permission) return false;
      
      const serviceWorkerReg = await navigator.serviceWorker.ready;
      
      // Convert VAPID key to the format the browser needs
      const applicationServerKey = this.urlBase64ToUint8Array(this.vapidPublicKey);
      
      // Subscribe the user
      const subscription = await serviceWorkerReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      
      // Convert browser's PushSubscription to our payload format
      const subscriptionJSON = subscription.toJSON();
      const subscriptionPayload: PushSubscriptionPayload = {
        endpoint: subscriptionJSON.endpoint!,
        expirationTime: subscriptionJSON.expirationTime || null,
        keys: {
          p256dh: subscriptionJSON.keys!.p256dh,
          auth: subscriptionJSON.keys!.auth
        }
      };
      
      // Send subscription to server
      await this.saveSubscription(userId, subscriptionPayload);
      return true;
    } catch (error) {
      console.error('Failed to register push subscription:', error);
      return false;
    }
  }
  
  private async saveSubscription(userId: string, subscription: PushSubscriptionPayload): Promise<void> {
    try {
      // Get token from localStorage
      const token = localStorage.getItem("accessToken");
      
      await fetch(`${APIDictionary.notification}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Add token from localStorage
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          userId,
          subscription
        })
      });
    } catch (error) {
      console.error('Failed to save subscription:', error);
    }
  }
  
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

export const notificationService = new NotificationService();