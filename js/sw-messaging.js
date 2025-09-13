// Service Worker messaging for background notifications
class ServiceWorkerMessaging {
    constructor() {
        this.init();
    }

    init() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleMessage(event.data);
            });
        }
    }

    handleMessage(data) {
        switch (data.type) {
            case 'PLAY_NOTIFICATION_SOUND':
                this.playNotificationSound();
                break;
            case 'COMPLETE_REMINDER':
                this.completeReminder(data.reminderId);
                break;
            case 'SNOOZE_REMINDER':
                this.snoozeReminder(data.reminderId, data.snoozeMinutes);
                break;
        }
    }

    playNotificationSound() {
        // Use PWA Enhanced sound if available, otherwise fallback
        if (window.pwaEnhanced) {
            window.pwaEnhanced.playNotificationSound();
        } else if (window.reminderManager) {
            window.reminderManager.playDefaultBeep();
        }
    }

    completeReminder(reminderId) {
        if (window.reminderManager) {
            const reminder = window.reminderManager.reminders.find(r => r.id === reminderId);
            if (reminder) {
                reminder.completed = true;
                window.reminderManager.storeReminders();
                window.reminderManager.updateStats();
                if (window.dashboardManager) {
                    window.dashboardManager.refreshCurrentView();
                }
            }
        }
    }

    snoozeReminder(reminderId, snoozeMinutes) {
        if (window.reminderManager) {
            const reminder = window.reminderManager.reminders.find(r => r.id === reminderId);
            if (reminder) {
                const newTime = new Date(Date.now() + (snoozeMinutes * 60 * 1000));
                reminder.datetime = newTime.toISOString().slice(0, 16);
                reminder.isActive = true;
                window.reminderManager.storeReminders();
                window.reminderManager.scheduleBackgroundNotification(reminder);
                if (window.dashboardManager) {
                    window.dashboardManager.refreshCurrentView();
                }
            }
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.swMessaging = new ServiceWorkerMessaging();
});