// Mobile-specific fixes for notifications and persistence
class MobileFixes {
    constructor() {
        this.init();
    }

    init() {
        this.fixMobileNotifications();
        this.fixSessionPersistence();
        this.addVisibilityHandlers();
    }

    fixMobileNotifications() {
        // Request persistent notification permission
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
                if (permission === 'granted') {
                    this.testNotificationSound();
                }
            });
        }

        // Enable wake lock to prevent app sleep
        this.enableWakeLock();
    }

    async enableWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                const wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake lock enabled');
            }
        } catch (err) {
            console.log('Wake lock failed:', err);
        }
    }

    testNotificationSound() {
        // Test notification with sound
        setTimeout(() => {
            if (Notification.permission === 'granted') {
                const notification = new Notification('🔔 Daily Reminder Test', {
                    body: 'Testing notification sound',
                    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" fill="%236366f1"/%3E%3Ctext x="96" y="120" font-size="120" text-anchor="middle" fill="white"%3E🔔%3C/text%3E%3C/svg%3E',
                    vibrate: [200, 100, 200],
                    silent: false,
                    requireInteraction: true
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                setTimeout(() => notification.close(), 5000);
            }
        }, 2000);
    }

    fixSessionPersistence() {
        // Force session persistence
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = function(key, value) {
            try {
                originalSetItem.call(this, key, value);
                // Double-check storage
                if (this.getItem(key) !== value) {
                    console.warn('localStorage failed, retrying...');
                    originalSetItem.call(this, key, value);
                }
            } catch (e) {
                console.error('localStorage error:', e);
            }
        };

        // Backup to sessionStorage
        this.syncStorages();
    }

    syncStorages() {
        const keys = ['currentUser', 'isLoggedIn', 'users', 'reminders'];
        
        keys.forEach(key => {
            const localValue = localStorage.getItem(key);
            if (localValue) {
                sessionStorage.setItem(key, localValue);
            } else {
                const sessionValue = sessionStorage.getItem(key);
                if (sessionValue) {
                    localStorage.setItem(key, sessionValue);
                }
            }
        });
    }

    addVisibilityHandlers() {
        // Handle app visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                console.log('App became visible');
                this.syncStorages();
                this.checkPendingNotifications();
            } else {
                console.log('App became hidden');
                this.saveCurrentState();
            }
        });

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            this.saveCurrentState();
        });
    }

    saveCurrentState() {
        // Force save current state
        if (window.authManager && window.authManager.currentUser) {
            const userData = {
                user: window.authManager.currentUser,
                timestamp: Date.now(),
                expires: Date.now() + (30 * 24 * 60 * 60 * 1000)
            };
            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('currentUser', JSON.stringify(userData));
            sessionStorage.setItem('isLoggedIn', 'true');
        }
    }

    checkPendingNotifications() {
        // Check for missed notifications
        const backgroundReminders = JSON.parse(localStorage.getItem('backgroundReminders') || '[]');
        const now = Date.now();
        
        backgroundReminders.forEach(reminder => {
            if (reminder.triggerTime <= now && reminder.triggerTime > (now - 300000)) { // 5 min window
                this.showMissedNotification(reminder);
            }
        });
    }

    showMissedNotification(reminder) {
        if (Notification.permission === 'granted') {
            const notification = new Notification('⏰ Missed Reminder', {
                body: `You missed: ${reminder.title}`,
                icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" fill="%23f59e0b"/%3E%3Ctext x="96" y="120" font-size="120" text-anchor="middle" fill="white"%3E⏰%3C/text%3E%3C/svg%3E',
                vibrate: [300, 100, 300],
                silent: false
            });

            setTimeout(() => notification.close(), 8000);
        }
    }
}

// Initialize mobile fixes
document.addEventListener('DOMContentLoaded', () => {
    window.mobileFixes = new MobileFixes();
});