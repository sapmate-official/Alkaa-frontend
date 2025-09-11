import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { APIDictionary } from '@/api/v2/APIdict'

// Types
export interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REMINDER'
  category: 'SYSTEM' | 'TASK' | 'LEAVE' | 'PAYROLL' | 'ATTENDANCE' | 'GENERAL'
  recipientId: string
  senderId?: string
  organizationId: string
  isRead: boolean
  readAt?: string
  scheduledAt?: string
  expiresAt?: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  actionUrl?: string
  actionText?: string
  metadata?: Record<string, any>
  createdAt: string
  updatedAt: string
  sender?: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  recipient: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export interface NotificationTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'
  category: 'SYSTEM' | 'TASK' | 'LEAVE' | 'PAYROLL' | 'ATTENDANCE' | 'GENERAL'
  variables: string[]
  isActive: boolean
  organizationId?: string
  createdAt: string
  updatedAt: string
}

export interface NotificationPreferences {
  id: string
  userId: string
  emailNotifications: boolean
  smsNotifications: boolean
  pushNotifications: boolean
  inAppNotifications: boolean
  categories: {
    SYSTEM: boolean
    TASK: boolean
    LEAVE: boolean
    PAYROLL: boolean
    ATTENDANCE: boolean
    GENERAL: boolean
  }
  quietHours: {
    enabled: boolean
    startTime: string
    endTime: string
  }
  frequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY' | 'WEEKLY'
  updatedAt: string
}

export interface NotificationStats {
  total: number
  unread: number
  read: number
  byCategory: Record<string, number>
  byType: Record<string, number>
  recentActivity: {
    today: number
    thisWeek: number
    thisMonth: number
  }
}

export interface CreateNotificationRequest {
  title: string
  message: string
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REMINDER'
  category?: 'SYSTEM' | 'TASK' | 'LEAVE' | 'PAYROLL' | 'ATTENDANCE' | 'GENERAL'
  recipientIds: string[]
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  actionUrl?: string
  actionText?: string
  scheduledAt?: string
  expiresAt?: string
  metadata?: Record<string, any>
}

export interface UpdateNotificationRequest {
  title?: string
  message?: string
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REMINDER'
  category?: 'SYSTEM' | 'TASK' | 'LEAVE' | 'PAYROLL' | 'ATTENDANCE' | 'GENERAL'
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  actionUrl?: string
  actionText?: string
  scheduledAt?: string
  expiresAt?: string
  metadata?: Record<string, any>
}

export interface CreateNotificationTemplateRequest {
  name: string
  subject: string
  body: string
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'
  category: 'SYSTEM' | 'TASK' | 'LEAVE' | 'PAYROLL' | 'ATTENDANCE' | 'GENERAL'
  variables?: string[]
}

export interface UpdateNotificationTemplateRequest {
  name?: string
  subject?: string
  body?: string
  type?: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP'
  category?: 'SYSTEM' | 'TASK' | 'LEAVE' | 'PAYROLL' | 'ATTENDANCE' | 'GENERAL'
  variables?: string[]
  isActive?: boolean
}

export interface BulkMarkRequest {
  notificationIds: string[]
  isRead: boolean
}

export interface SendBulkNotificationRequest {
  templateId?: string
  title: string
  message: string
  type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'REMINDER'
  category?: 'SYSTEM' | 'TASK' | 'LEAVE' | 'PAYROLL' | 'ATTENDANCE' | 'GENERAL'
  recipientIds: string[]
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  scheduledAt?: string
  variables?: Record<string, any>
}

// Query Keys
export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...notificationKeys.lists(), { filters }] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
  userNotifications: (userId: string) => [...notificationKeys.all, 'user', userId] as const,
  unread: (userId: string) => [...notificationKeys.userNotifications(userId), 'unread'] as const,
  stats: (userId?: string) => [...notificationKeys.all, 'stats', userId || 'all'] as const,
  preferences: (userId: string) => [...notificationKeys.all, 'preferences', userId] as const,
  templates: () => [...notificationKeys.all, 'templates'] as const,
  template: (id: string) => [...notificationKeys.templates(), id] as const,
}

// API Functions
const notificationsApi = {
  // Notifications CRUD
  async getAllNotifications(filters?: Record<string, any>): Promise<Notification[]> {
    const params = new URLSearchParams(filters)
    const response = await axios.get(`${APIDictionary.notification}?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getNotificationById(id: string): Promise<Notification> {
    const response = await axios.get(`${APIDictionary.notification}/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getUserNotifications(userId: string, filters?: Record<string, any>): Promise<Notification[]> {
    const params = new URLSearchParams(filters)
    const response = await axios.get(`${APIDictionary.notification}/user/${userId}?${params}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const response = await axios.get(`${APIDictionary.notification}/user/${userId}/unread`, { withCredentials: true })
    return response.data.data || response.data
  },

  async createNotification(data: CreateNotificationRequest): Promise<Notification> {
    const response = await axios.post(APIDictionary.notification, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateNotification(id: string, data: UpdateNotificationRequest): Promise<Notification> {
    const response = await axios.put(`${APIDictionary.notification}/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deleteNotification(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.notification}/${id}`, { withCredentials: true })
  },

  // Read/Unread operations
  async markAsRead(id: string): Promise<Notification> {
    const response = await axios.patch(`${APIDictionary.notification}/${id}/read`, {}, { withCredentials: true })
    return response.data.data || response.data
  },

  async markAsUnread(id: string): Promise<Notification> {
    const response = await axios.patch(`${APIDictionary.notification}/${id}/unread`, {}, { withCredentials: true })
    return response.data.data || response.data
  },

  async bulkMarkAsRead(data: BulkMarkRequest): Promise<void> {
    await axios.patch(`${APIDictionary.notification}/bulk-mark`, data, { withCredentials: true })
  },

  async markAllAsRead(userId: string): Promise<void> {
    await axios.patch(`${APIDictionary.notification}/user/${userId}/mark-all-read`, {}, { withCredentials: true })
  },

  // Stats
  async getNotificationStats(userId?: string): Promise<NotificationStats> {
    const endpoint = userId 
      ? `${APIDictionary.notification}/stats?userId=${userId}`
      : `${APIDictionary.notification}/stats`
    const response = await axios.get(endpoint, { withCredentials: true })
    return response.data.data || response.data
  },

  // Preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    const response = await axios.get(`${APIDictionary.notification}/user/${userId}/preferences`, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await axios.put(`${APIDictionary.notification}/user/${userId}/preferences`, preferences, { withCredentials: true })
    return response.data.data || response.data
  },

  // Templates
  async getNotificationTemplates(): Promise<NotificationTemplate[]> {
    const response = await axios.get(`${APIDictionary.notification}/templates`, { withCredentials: true })
    return response.data.data || response.data
  },

  async getNotificationTemplate(id: string): Promise<NotificationTemplate> {
    const response = await axios.get(`${APIDictionary.notification}/templates/${id}`, { withCredentials: true })
    return response.data.data || response.data
  },

  async createNotificationTemplate(data: CreateNotificationTemplateRequest): Promise<NotificationTemplate> {
    const response = await axios.post(`${APIDictionary.notification}/templates`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async updateNotificationTemplate(id: string, data: UpdateNotificationTemplateRequest): Promise<NotificationTemplate> {
    const response = await axios.put(`${APIDictionary.notification}/templates/${id}`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deleteNotificationTemplate(id: string): Promise<void> {
    await axios.delete(`${APIDictionary.notification}/templates/${id}`, { withCredentials: true })
  },

  // Bulk operations
  async sendBulkNotification(data: SendBulkNotificationRequest): Promise<Notification[]> {
    const response = await axios.post(`${APIDictionary.notification}/bulk-send`, data, { withCredentials: true })
    return response.data.data || response.data
  },

  async deleteMultipleNotifications(notificationIds: string[]): Promise<void> {
    await axios.delete(`${APIDictionary.notification}/bulk-delete`, {
      data: { notificationIds },
      withCredentials: true
    })
  },

  // WhatsApp notifications (if integrated)
  async sendWhatsAppNotification(data: { phoneNumber: string; message: string; templateName?: string }): Promise<any> {
    const response = await axios.post(APIDictionary.whatsappNotification, data, { withCredentials: true })
    return response.data.data || response.data
  }
}

// Query Hooks
export function useNotifications(filters?: Record<string, any>) {
  return useQuery<Notification[]>({
    queryKey: notificationKeys.list(filters || {}),
    queryFn: () => notificationsApi.getAllNotifications(filters),
    staleTime: 30 * 1000, // 30 seconds - notifications change frequently
  })
}

export function useNotification(id: string) {
  return useQuery<Notification>({
    queryKey: notificationKeys.detail(id),
    queryFn: () => notificationsApi.getNotificationById(id),
    enabled: !!id,
    staleTime: 1 * 60 * 1000,
  })
}

export function useUserNotifications(userId: string, filters?: Record<string, any>) {
  return useQuery<Notification[]>({
    queryKey: notificationKeys.userNotifications(userId),
    queryFn: () => notificationsApi.getUserNotifications(userId, filters),
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}

export function useUnreadNotifications(userId: string) {
  return useQuery<Notification[]>({
    queryKey: notificationKeys.unread(userId),
    queryFn: () => notificationsApi.getUnreadNotifications(userId),
    enabled: !!userId,
    staleTime: 15 * 1000, // 15 seconds - unread notifications are very dynamic
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  })
}

export function useNotificationStats(userId?: string) {
  return useQuery<NotificationStats>({
    queryKey: notificationKeys.stats(userId),
    queryFn: () => notificationsApi.getNotificationStats(userId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useNotificationPreferences(userId: string) {
  return useQuery<NotificationPreferences>({
    queryKey: notificationKeys.preferences(userId),
    queryFn: () => notificationsApi.getNotificationPreferences(userId),
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes - preferences change rarely
  })
}

export function useNotificationTemplates() {
  return useQuery<NotificationTemplate[]>({
    queryKey: notificationKeys.templates(),
    queryFn: notificationsApi.getNotificationTemplates,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useNotificationTemplate(id: string) {
  return useQuery<NotificationTemplate>({
    queryKey: notificationKeys.template(id),
    queryFn: () => notificationsApi.getNotificationTemplate(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  })
}

// Mutation Hooks
export function useCreateNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.createNotification,
    onSuccess: (newNotification) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.userNotifications(newNotification.recipientId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread(newNotification.recipientId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() })
    },
  })
}

export function useUpdateNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNotificationRequest }) =>
      notificationsApi.updateNotification(id, data),
    onSuccess: (updatedNotification, { id }) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.userNotifications(updatedNotification.recipientId) })
    },
  })
}

export function useDeleteNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.deleteNotification,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: notificationKeys.detail(deletedId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() })
    },
  })
}

export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: (updatedNotification) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(updatedNotification.id) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.userNotifications(updatedNotification.recipientId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread(updatedNotification.recipientId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats(updatedNotification.recipientId) })
    },
  })
}

export function useMarkAsUnread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.markAsUnread,
    onSuccess: (updatedNotification) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.detail(updatedNotification.id) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.userNotifications(updatedNotification.recipientId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread(updatedNotification.recipientId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats(updatedNotification.recipientId) })
    },
  })
}

export function useBulkMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.bulkMarkAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.userNotifications(userId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unread(userId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats(userId) })
    },
  })
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, preferences }: { userId: string; preferences: Partial<NotificationPreferences> }) =>
      notificationsApi.updateNotificationPreferences(userId, preferences),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences(userId) })
    },
  })
}

export function useCreateNotificationTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.createNotificationTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.templates() })
    },
  })
}

export function useUpdateNotificationTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateNotificationTemplateRequest }) =>
      notificationsApi.updateNotificationTemplate(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.template(id) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.templates() })
    },
  })
}

export function useDeleteNotificationTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.deleteNotificationTemplate,
    onSuccess: (_, deletedId) => {
      queryClient.removeQueries({ queryKey: notificationKeys.template(deletedId) })
      queryClient.invalidateQueries({ queryKey: notificationKeys.templates() })
    },
  })
}

export function useSendBulkNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.sendBulkNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() })
    },
  })
}

export function useDeleteMultipleNotifications() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: notificationsApi.deleteMultipleNotifications,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificationKeys.stats() })
    },
  })
}

export function useSendWhatsAppNotification() {
  return useMutation({
    mutationFn: notificationsApi.sendWhatsAppNotification,
  })
}
