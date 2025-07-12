import { createLogger } from '@raz2/shared'
import type { NotificationConfig } from '../types'

interface Notification {
  id: string
  type: 'reminder' | 'follow_up' | 'alert' | 'insight'
  title: string
  message: string
  targetId?: string
  targetType?: 'idea' | 'conversation' | 'contact'
  scheduledFor: Date
  isActive: boolean
  isSent: boolean
  config: NotificationConfig
  createdAt: Date
  sentAt?: Date
}

export class NotificationService {
  private logger = createLogger('notification-service')
  private notifications = new Map<string, Notification>()
  private intervalId?: NodeJS.Timeout

  constructor() {
    this.startNotificationScheduler()
    this.generateMockData()
  }

  async createNotification(
    type: 'reminder' | 'follow_up' | 'alert' | 'insight',
    title: string,
    message: string,
    scheduledFor: Date,
    config: NotificationConfig,
    targetId?: string,
    targetType?: 'idea' | 'conversation' | 'contact'
  ): Promise<Notification> {
    const id = this.generateId()
    
    const notification: Notification = {
      id,
      type,
      title,
      message,
      targetId,
      targetType,
      scheduledFor,
      isActive: true,
      isSent: false,
      config,
      createdAt: new Date()
    }

    this.notifications.set(id, notification)

    this.logger.info('Created notification', {
      id,
      type,
      title,
      scheduledFor: scheduledFor.toISOString(),
      targetType,
      channels: config.channels
    })

    return notification
  }

  async createReminder(
    title: string,
    message: string,
    scheduledFor: Date,
    targetId?: string,
    targetType?: 'idea' | 'conversation' | 'contact',
    channels: Array<'telegram' | 'email' | 'webhook'> = ['telegram']
  ): Promise<Notification> {
    const config: NotificationConfig = {
      type: 'reminder',
      channels
    }

    return this.createNotification(
      'reminder',
      title,
      message,
      scheduledFor,
      config,
      targetId,
      targetType
    )
  }

  async createFollowUp(
    title: string,
    message: string,
    targetId: string,
    targetType: 'idea' | 'conversation' | 'contact',
    daysFromNow = 7,
    channels: Array<'telegram' | 'email' | 'webhook'> = ['telegram']
  ): Promise<Notification> {
    const scheduledFor = new Date()
    scheduledFor.setDate(scheduledFor.getDate() + daysFromNow)

    const config: NotificationConfig = {
      type: 'follow_up',
      channels
    }

    return this.createNotification(
      'follow_up',
      title,
      message,
      scheduledFor,
      config,
      targetId,
      targetType
    )
  }

  async createAlert(
    title: string,
    message: string,
    priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
    channels: Array<'telegram' | 'email' | 'webhook'> = ['telegram']
  ): Promise<Notification> {
    const config: NotificationConfig = {
      type: 'alert',
      channels
    }

    return this.createNotification(
      'alert',
      title,
      message,
      new Date(),
      config
    )
  }

  async createRecurringNotification(
    type: 'reminder' | 'follow_up',
    title: string,
    message: string,
    frequency: 'daily' | 'weekly' | 'monthly',
    time?: string,
    days?: number[],
    channels: Array<'telegram' | 'email' | 'webhook'> = ['telegram']
  ): Promise<Notification> {
    const now = new Date()
    let scheduledFor = new Date()

    switch (frequency) {
      case 'daily':
        scheduledFor.setDate(now.getDate() + 1)
        if (time) {
          const [hours, minutes] = time.split(':').map(Number)
          scheduledFor.setHours(hours, minutes, 0, 0)
        }
        break
      case 'weekly':
        scheduledFor.setDate(now.getDate() + 7)
        if (time) {
          const [hours, minutes] = time.split(':').map(Number)
          scheduledFor.setHours(hours, minutes, 0, 0)
        }
        break
      case 'monthly':
        scheduledFor.setMonth(now.getMonth() + 1)
        if (time) {
          const [hours, minutes] = time.split(':').map(Number)
          scheduledFor.setHours(hours, minutes, 0, 0)
        }
        break
    }

    const config: NotificationConfig = {
      type,
      channels,
      schedule: {
        frequency,
        time,
        days
      }
    }

    return this.createNotification(
      type,
      title,
      message,
      scheduledFor,
      config
    )
  }

  async getDueNotifications(): Promise<Notification[]> {
    const now = new Date()
    return Array.from(this.notifications.values())
      .filter(notification => 
        notification.isActive &&
        !notification.isSent &&
        notification.scheduledFor <= now
      )
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())
  }

  async getNotification(id: string): Promise<Notification | null> {
    return this.notifications.get(id) || null
  }

  async listNotifications(
    filter?: {
      type?: string
      isActive?: boolean
      isSent?: boolean
      targetType?: string
      limit?: number
    }
  ): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values())

    if (filter?.type) {
      notifications = notifications.filter(n => n.type === filter.type)
    }
    if (filter?.isActive !== undefined) {
      notifications = notifications.filter(n => n.isActive === filter.isActive)
    }
    if (filter?.isSent !== undefined) {
      notifications = notifications.filter(n => n.isSent === filter.isSent)
    }
    if (filter?.targetType) {
      notifications = notifications.filter(n => n.targetType === filter.targetType)
    }

    notifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    if (filter?.limit) {
      notifications = notifications.slice(0, filter.limit)
    }

    return notifications
  }

  async markAsSent(id: string): Promise<boolean> {
    const notification = this.notifications.get(id)
    if (!notification) return false

    notification.isSent = true
    notification.sentAt = new Date()

    if (notification.config.schedule?.frequency) {
      await this.scheduleNextRecurrence(notification)
    }

    this.logger.info('Marked notification as sent', {
      id,
      sentAt: notification.sentAt.toISOString(),
      hasRecurrence: !!notification.config.schedule?.frequency
    })

    return true
  }

  async updateNotification(
    id: string,
    updates: Partial<Pick<Notification, 'title' | 'message' | 'scheduledFor' | 'isActive'>>
  ): Promise<Notification | null> {
    const notification = this.notifications.get(id)
    if (!notification) return null

    Object.assign(notification, updates)

    this.logger.info('Updated notification', { id, updates })

    return notification
  }

  async deleteNotification(id: string): Promise<boolean> {
    const deleted = this.notifications.delete(id)
    
    this.logger.info('Deleted notification', { id, success: deleted })
    
    return deleted
  }

  async getNotificationStats(): Promise<{
    total: number
    byType: Record<string, number>
    active: number
    sent: number
    pending: number
    overdue: number
  }> {
    const notifications = Array.from(this.notifications.values())
    const now = new Date()
    
    const byType: Record<string, number> = {}
    let active = 0
    let sent = 0
    let pending = 0
    let overdue = 0

    notifications.forEach(notification => {
      byType[notification.type] = (byType[notification.type] || 0) + 1
      
      if (notification.isActive) active++
      if (notification.isSent) sent++
      
      if (!notification.isSent && notification.isActive) {
        if (notification.scheduledFor <= now) {
          overdue++
        } else {
          pending++
        }
      }
    })

    return {
      total: notifications.length,
      byType,
      active,
      sent,
      pending,
      overdue
    }
  }

  private async scheduleNextRecurrence(notification: Notification): Promise<void> {
    if (!notification.config.schedule?.frequency) return

    const nextScheduled = new Date(notification.scheduledFor)
    
    switch (notification.config.schedule.frequency) {
      case 'daily':
        nextScheduled.setDate(nextScheduled.getDate() + 1)
        break
      case 'weekly':
        nextScheduled.setDate(nextScheduled.getDate() + 7)
        break
      case 'monthly':
        nextScheduled.setMonth(nextScheduled.getMonth() + 1)
        break
    }

    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      scheduledFor: nextScheduled,
      isSent: false,
      createdAt: new Date(),
      sentAt: undefined
    }

    this.notifications.set(newNotification.id, newNotification)

    this.logger.info('Scheduled recurring notification', {
      originalId: notification.id,
      newId: newNotification.id,
      nextScheduled: nextScheduled.toISOString(),
      frequency: notification.config.schedule.frequency
    })
  }

  private startNotificationScheduler(): void {
    this.intervalId = setInterval(async () => {
      try {
        const dueNotifications = await this.getDueNotifications()
        
        if (dueNotifications.length > 0) {
          this.logger.info('Processing due notifications', {
            count: dueNotifications.length
          })

          for (const notification of dueNotifications) {
            await this.processNotification(notification)
          }
        }
      } catch (error) {
        this.logger.error('Error in notification scheduler', {
          error: error instanceof Error ? error : new Error(String(error))
        })
      }
    }, 60000)

    this.logger.info('Started notification scheduler (60s interval)')
  }

  private async processNotification(notification: Notification): Promise<void> {
    try {
      for (const channel of notification.config.channels) {
        await this.sendNotificationToChannel(notification, channel)
      }

      await this.markAsSent(notification.id)
    } catch (error) {
      this.logger.error('Failed to process notification', {
        id: notification.id,
        error: error instanceof Error ? error : new Error(String(error))
      })
    }
  }

  private async sendNotificationToChannel(
    notification: Notification,
    channel: 'telegram' | 'email' | 'webhook'
  ): Promise<void> {
    this.logger.info('Sending notification', {
      id: notification.id,
      channel,
      type: notification.type,
      title: notification.title
    })

    switch (channel) {
      case 'telegram':
        break
      case 'email':
        break
      case 'webhook':
        break
      default:
        this.logger.warn('Unknown notification channel', { channel })
    }
  }

  private generateMockData(): void {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const notifications = [
      {
        id: 'notif-1',
        type: 'follow_up' as const,
        title: 'Follow up with Robert Leshner',
        message: 'Check on Compound integration pilot program progress and gather feedback.',
        targetId: 'contact-2',
        targetType: 'contact' as const,
        scheduledFor: tomorrow,
        isActive: true,
        isSent: false,
        config: {
          type: 'follow_up' as const,
          channels: ['telegram' as const]
        },
        createdAt: new Date('2024-12-11T11:45:00Z')
      },
      {
        id: 'notif-2',
        type: 'reminder' as const,
        title: 'Q4 Strategic Review',
        message: 'Quarterly business review meeting with Guild.xyz leadership team.',
        targetId: 'conv-1',
        targetType: 'conversation' as const,
        scheduledFor: nextWeek,
        isActive: true,
        isSent: false,
        config: {
          type: 'reminder' as const,
          channels: ['telegram' as const, 'email' as const]
        },
        createdAt: new Date('2024-12-10T14:00:00Z')
      },
      {
        id: 'notif-3',
        type: 'alert' as const,
        title: 'Enterprise Dashboard Issues',
        message: 'Multiple customer complaints about dashboard performance. Immediate action required.',
        targetId: 'conv-2',
        targetType: 'conversation' as const,
        scheduledFor: new Date('2024-12-10T15:00:00Z'),
        isActive: true,
        isSent: true,
        config: {
          type: 'alert' as const,
          channels: ['telegram' as const]
        },
        createdAt: new Date('2024-12-10T14:45:00Z'),
        sentAt: new Date('2024-12-10T15:00:00Z')
      },
      {
        id: 'notif-4',
        type: 'insight' as const,
        title: 'Weekly Contact Activity Summary',
        message: 'Weekly summary of contact interactions and follow-up recommendations.',
        scheduledFor: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
        isActive: true,
        isSent: false,
        config: {
          type: 'insight' as const,
          channels: ['telegram' as const],
          schedule: {
            frequency: 'weekly' as const,
            time: '09:00',
            days: [1]
          }
        },
        createdAt: new Date('2024-12-01T09:00:00Z')
      }
    ]

    notifications.forEach(notification => {
      this.notifications.set(notification.id, notification)
    })

    this.logger.info('Generated mock notification data', {
      notificationCount: notifications.length
    })
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
      this.logger.info('Stopped notification scheduler')
    }
  }
} 