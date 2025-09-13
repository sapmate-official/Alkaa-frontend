import { APIDictionary } from "@/services/api/v2/APIdict";

/**
 * Send an immediate notification to a user
 * @param userId - The recipient user ID
 * @param templateId - The notification template ID
 * @param variables - Variables to populate the template
 * @param metadata - Additional metadata for the notification
 */
export const sendNotification = async (
  userId: string,
  templateId: string,
  variables: Record<string, any> = {},
  metadata: Record<string, any> = {}
): Promise<any> => {
  try {
    const token = localStorage.getItem("accessToken");
    
    const response = await fetch(`${APIDictionary.notification}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        templateId,
        content: "", // Will be populated by the server based on template
        metadata: {
          ...metadata,
          variables
        }
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Schedule a notification to be sent at a specific time
 * @param userId - The recipient user ID
 * @param templateId - The notification template ID
 * @param scheduledTime - When to send the notification
 * @param variables - Variables to populate the template
 * @param metadata - Additional metadata for the notification
 */
export const scheduleNotification = async (
  userId: string,
  templateId: string,
  scheduledTime: Date,
  variables: Record<string, any> = {},
  metadata: Record<string, any> = {}
): Promise<any> => {
  try {
    const token = localStorage.getItem("accessToken");
    
    const response = await fetch(`${APIDictionary.notification}/schedule`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        userId,
        templateId,
        scheduledTime: scheduledTime.toISOString(),
        variables,
        metadata
      })
    });

    if (!response.ok) {
      throw new Error('Failed to schedule notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};