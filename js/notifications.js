// Notification management
class NotificationManager {
    constructor() {
        this.init();
    }

    init() {
        this.requestPermission();
    }

    async requestPermission() {
        if ('Notification' in window) {
            console.log('Current notification permission:', Notification.permission);
            
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                console.log('Notification permission result:', permission);
                
                if (permission === 'granted') {
                    this.showPermissionSuccess();
                    this.setupBackgroundNotifications();
                } else {
                    this.showPermissionDenied();
                }
            } else if (Notification.permission === 'granted') {
                this.setupBackgroundNotifications();
            }
        } else {
            console.log('Notifications not supported in this browser');
        }
    }
    
    setupBackgroundNotifications() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                console.log('Setting up background notifications');
                
                // Enable background sync for notifications
                if ('sync' in window.ServiceWorkerRegistration.prototype) {
                    registration.sync.register('background-sync');
                }
            });
        }
    }
    
    showPermissionSuccess() {
        console.log('Notifications enabled successfully');
    }
    
    showPermissionDenied() {
        console.log('Notification permission denied');
        // Show fallback message
        alert('Notifications are disabled. You will only hear sounds but not see browser notifications.');
    }

    showNotification(reminder) {
        // Browser notification
        this.showBrowserNotification(reminder);
        
        // In-app notification
        this.showInAppNotification(reminder);
    }

    showBrowserNotification(reminder) {
        console.log('Attempting to show browser notification');
        
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const options = {
                    body: reminder.title + (reminder.description ? '\n' + reminder.description : ''),
                    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" fill="%236366f1" rx="42"/%3E%3Ctext x="96" y="125" font-size="84" text-anchor="middle" fill="white"%3E🔔%3C/text%3E%3C/svg%3E',
                    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" fill="%236366f1" rx="20"/%3E%3Ctext x="48" y="65" font-size="42" text-anchor="middle" fill="white"%3E🔔%3C/text%3E%3C/svg%3E',
                    tag: 'daily-reminder-' + reminder.id,
                    requireInteraction: true,
                    silent: false,
                    vibrate: [200, 100, 200],
                    timestamp: Date.now(),
                    data: {
                        reminderId: reminder.id,
                        url: './dashboard.html'
                    },
                    actions: [
                        {
                            action: 'complete',
                            title: '✓ Complete'
                        },
                        {
                            action: 'snooze',
                            title: '⏰ Snooze'
                        }
                    ]
                };
                
                // Use service worker for persistent notifications
                if ('serviceWorker' in navigator) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification('🔔 Daily Reminder', options);
                    });
                } else {
                    // Fallback to regular notification
                    const notification = new Notification('🔔 Daily Reminder', options);
                    
                    notification.onclick = () => {
                        window.focus();
                        notification.close();
                        if (window.location.pathname !== '/dashboard.html') {
                            window.location.href = './dashboard.html';
                        }
                    };
                }
                
                // Play sound
                this.playNotificationSound(reminder);
                
                console.log('Browser notification shown successfully');
            } catch (e) {
                console.log('Failed to show browser notification:', e);
                this.showInAppNotification(reminder);
            }
        } else {
            console.log('Browser notifications not available, showing in-app notification');
            this.showInAppNotification(reminder);
        }
    }
    
    playNotificationSound(reminder) {
        try {
            // Try to play custom sound first
            if (reminder.soundFile) {
                const audio = new Audio(reminder.soundFile);
                audio.volume = 0.7;
                audio.play().catch(() => this.playDefaultSound());
            } else {
                this.playDefaultSound();
            }
        } catch (e) {
            console.log('Could not play notification sound:', e);
        }
    }
    
    playDefaultSound() {
        try {
            // Try default audio file first
            const audio = new Audio('./assets/default.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {
                // Fallback to generated beep
                this.generateBeepSound();
            });
        } catch (e) {
            this.generateBeepSound();
        }
    }
    
    generateBeepSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            console.log('Could not generate beep sound:', e);
        }
    }

    showInAppNotification(reminder) {
        // Create in-app notification element
        const notification = document.createElement('div');
        notification.className = 'in-app-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <h4>🔔 Reminder</h4>
                <p><strong>${reminder.title}</strong></p>
                ${reminder.description ? `<p>${reminder.description}</p>` : ''}
                <button class="notification-close">×</button>
            </div>
        `;

        // Add styles if not already added
        this.addNotificationStyles();

        // Add to page
        document.body.appendChild(notification);

        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });

        // Auto remove after 10 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 10000);

        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
    }

    removeNotification(notification) {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .in-app-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: var(--card-bg, #f8f9fa);
                border: 1px solid var(--border-color, #e0e0e0);
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                z-index: 10000;
                max-width: 350px;
                transform: translateX(400px);
                transition: transform 0.3s ease;
            }

            .in-app-notification.show {
                transform: translateX(0);
            }

            .notification-content {
                padding: 1rem;
                position: relative;
            }

            .notification-content h4 {
                margin: 0 0 0.5rem 0;
                color: var(--primary-color, #2196F3);
                font-size: 1.1rem;
            }

            .notification-content p {
                margin: 0.25rem 0;
                color: var(--text-color, #333);
                font-size: 0.9rem;
            }

            .notification-close {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--text-color, #333);
                opacity: 0.7;
                transition: opacity 0.3s;
            }

            .notification-close:hover {
                opacity: 1;
            }

            @media (max-width: 480px) {
                .in-app-notification {
                    right: 10px;
                    left: 10px;
                    max-width: none;
                    transform: translateY(-100px);
                }

                .in-app-notification.show {
                    transform: translateY(0);
                }
            }
        `;
        document.head.appendChild(styles);
    }

    // Schedule notification through service worker for background delivery
    scheduleBackgroundNotification(reminder, triggerTime) {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.active.postMessage({
                    type: 'SCHEDULE_NOTIFICATION',
                    reminder: reminder,
                    triggerTime: triggerTime
                });
                console.log('Background notification scheduled for:', new Date(triggerTime));
            });
        }
    }
    
    // Service Worker notification (for when app is in background)
    showServiceWorkerNotification(reminder) {
        if ('serviceWorker' in navigator && 'Notification' in window) {
            navigator.serviceWorker.ready.then(registration => {
                const options = {
                    body: reminder.title + (reminder.description ? '\n' + reminder.description : ''),
                    icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" fill="%236366f1" rx="42"/%3E%3Ctext x="96" y="125" font-size="84" text-anchor="middle" fill="white"%3E🔔%3C/text%3E%3C/svg%3E',
                    badge: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"%3E%3Crect width="96" height="96" fill="%236366f1" rx="20"/%3E%3Ctext x="48" y="65" font-size="42" text-anchor="middle" fill="white"%3E🔔%3C/text%3E%3C/svg%3E',
                    tag: 'daily-reminder-' + reminder.id,
                    requireInteraction: true,
                    silent: false,
                    vibrate: [500, 200, 500],
                    timestamp: Date.now(),
                    data: {
                        reminderId: reminder.id,
                        url: './dashboard.html'
                    },
                    actions: [
                        {
                            action: 'complete',
                            title: '✓ Complete'
                        },
                        {
                            action: 'snooze',
                            title: '⏰ Snooze 10min'
                        }
                    ]
                };
                
                registration.showNotification('🔔 Daily Reminder', options);
            });
        }
    }
}

// Initialize notification manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});