import { prisma } from "./prisma";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  icon?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Create a notification for a user
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
  icon,
  metadata,
}: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link,
        icon,
        metadata,
      },
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
}

/**
 * Create notifications for multiple users at once
 */
export async function createBulkNotifications(
  userIds: string[],
  params: Omit<CreateNotificationParams, "userId">
) {
  try {
    const notifications = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        icon: params.icon,
        metadata: params.metadata,
      })),
    });
    return notifications;
  } catch (error) {
    console.error("Error creating bulk notifications:", error);
    throw error;
  }
}

/**
 * Helper function to create a PM notification
 */
export async function createPMNotification(
  recipientId: string,
  senderName: string,
  messageId: string,
  subject: string
) {
  return createNotification({
    userId: recipientId,
    type: "PRIVATE_MESSAGE",
    title: "💬 New Private Message",
    message: `${senderName} sent you a message: "${subject}"`,
    link: `/forum/messages/${messageId}`,
    icon: "💬",
    metadata: {
      messageId,
      senderName,
    },
  });
}

/**
 * Helper function to create a topic reply notification
 */
export async function createTopicReplyNotification(
  userId: string,
  replierName: string,
  topicTitle: string,
  topicSlug: string
) {
  return createNotification({
    userId,
    type: "TOPIC_REPLY",
    title: "💬 New Reply in Topic",
    message: `${replierName} replied to "${topicTitle}"`,
    link: `/forum/topic/${topicSlug}`,
    icon: "💬",
    metadata: {
      replierName,
      topicSlug,
    },
  });
}

/**
 * Helper function to notify about giveaway win
 */
export async function createGiveawayWinNotification(
  userId: string,
  giveawayTitle: string,
  giveawayId: string,
  slot: number
) {
  return createNotification({
    userId,
    type: "GIVEAWAY_WIN",
    title: "🎉 You Won!",
    message: `You won slot ${slot} in "${giveawayTitle}"!`,
    link: `/giveaways/${giveawayId}`,
    icon: "🎉",
    metadata: {
      giveawayId,
      slot,
    },
  });
}

/**
 * Helper function to notify about order update
 */
export async function createOrderNotification(
  userId: string,
  orderId: string,
  status: string
) {
  const statusMessages: Record<string, string> = {
    PAID: "Your order has been confirmed!",
    PROCESSING: "Your order is being processed.",
    SHIPPED: "Your order has been shipped!",
    DELIVERED: "Your order has been delivered.",
    CANCELLED: "Your order has been cancelled.",
    REFUNDED: "Your order has been refunded.",
  };

  return createNotification({
    userId,
    type: "ORDER_UPDATE",
    title: "📦 Order Update",
    message: statusMessages[status] || `Order status: ${status}`,
    link: `/profile`, // or order details page
    icon: "📦",
    metadata: {
      orderId,
      status,
    },
  });
}
