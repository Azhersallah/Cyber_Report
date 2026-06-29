/**
 * Local Notification Dismissal System
 * Handles update notification dismissal locally only (no server sync)
 */

const DISMISSED_NOTIFICATIONS_KEY = 'dismissed_notifications_local';

// Get locally dismissed notifications
export const getLocalDismissedNotifications = (): string[] => {
  try {
    const dismissed = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
    return dismissed ? JSON.parse(dismissed) : [];
  } catch {
    return [];
  }
};

// Check if notification was dismissed locally
export const isNotificationDismissedLocally = (latestVersion: string): boolean => {
  return getLocalDismissedNotifications().includes(latestVersion);
};

// Store dismissed notification locally
export const storeDismissedNotificationLocally = (latestVersion: string): void => {
  try {
    const dismissed = getLocalDismissedNotifications();
    if (!dismissed.includes(latestVersion)) {
      dismissed.push(latestVersion);
      localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(dismissed));
    }
  } catch (err) {
    console.error('Failed to store dismissed notification:', err);
  }
};

// Callback for when notification should be shown
let onNotificationCallback: ((data: { message: string; latestVersion: string }) => void) | null = null;

export const setNotificationCallback = (
  callback: ((data: { message: string; latestVersion: string }) => void) | null
): void => {
  onNotificationCallback = callback;
};

// Initialize - no server sync needed
export const initOfflineSync = (machineId?: string): (() => void) => {
  // Return empty cleanup function
  return () => {};
};

// Dismiss notification - local only, no server sync
export const dismissNotificationOffline = async (latestVersion: string, machineId?: string): Promise<boolean> => {
  // Store locally only - no server communication
  storeDismissedNotificationLocally(latestVersion);
  return true;
};

// Check if notification was dismissed
export const isNotificationDismissed = (latestVersion: string): boolean => {
  return isNotificationDismissedLocally(latestVersion);
};
