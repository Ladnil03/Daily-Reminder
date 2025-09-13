// Background Notification Scheduler
class BackgroundScheduler {
    constructor() {
        this.init();
    }

    init() {
        this.requestNotificationPermission();
        this.scheduleBackgroundNotifications();
    }

    async requestNotificationPermission() {
        // Skip if already handled by PWA Enhanced
        if (window.pwaEnhanced) return;
        
        if ('Notification' in window && 'serviceWorker' in navigator) {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
        }
    }

    scheduleBackgroundNotifications() {
        if (!window.reminderManager) return;

        const reminders = window.reminderManager.reminders.filter(r => 
            !r.completed && r.isActive && new Date(r.datetime) > new Date()
        );

        reminders.forEach(reminder => {
            this.scheduleNotification(reminder);
        });
    }

    scheduleNotification(reminder) {
        const now = Date.now();
        const reminderTime = new Date(reminder.datetime).getTime();
        const delay = reminderTime - now;

        if (delay > 0) {
            // Store in service worker for background execution
            this.storeBackgroundReminder(reminder, reminderTime);
            
            // Also set timeout for when app is active
            setTimeout(() => {
                if (document.visibilityState === 'visible') {
                    this.showActiveNotification(reminder);
                }
            }, delay);
        }
    }

    storeBackgroundReminder(reminder, triggerTime) {
        const backgroundReminders = JSON.parse(localStorage.getItem('backgroundReminders') || '[]');
        
        backgroundReminders.push({
            id: reminder.id,
            title: reminder.title,
            description: reminder.description,
            triggerTime: triggerTime,
            userId: reminder.userId
        });

        localStorage.setItem('backgroundReminders', JSON.stringify(backgroundReminders));
        
        // Send to service worker
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SCHEDULE_NOTIFICATION',
                reminder: reminder,
                triggerTime: triggerTime
            });
        }
    }

    showActiveNotification(reminder) {
        // Show notification when app is active
        if (window.reminderManager) {
            window.reminderManager.triggerReminder(reminder);
        }
    }

    cleanupExpiredReminders() {
        const backgroundReminders = JSON.parse(localStorage.getItem('backgroundReminders') || '[]');
        const now = Date.now();
        
        const activeReminders = backgroundReminders.filter(r => r.triggerTime > now);
        localStorage.setItem('backgroundReminders', JSON.stringify(activeReminders));
    }
}

// Initialize background scheduler
document.addEventListener('DOMContentLoaded', () => {
    if (window.authManager && window.authManager.isLoggedIn()) {
        window.backgroundScheduler = new BackgroundScheduler();
    }
});