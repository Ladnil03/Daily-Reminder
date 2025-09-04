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
                } else {
                    this.showPermissionDenied();
                }
            }
        } else {
            console.log('Notifications not supported in this browser');
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
                const notification = new Notification('🔔 Daily Reminder', {
                    body: reminder.title + (reminder.description ? '\n' + reminder.description : ''),
                    tag: reminder.id,
                    requireInteraction: true,
                    silent: false // Allow sound
                });

                notification.onclick = () => {
                    window.focus();
                    notification.close();
                };

                // Auto close after 10 seconds
                setTimeout(() => {
                    notification.close();
                }, 10000);
                
                console.log('Browser notification shown successfully');
            } catch (e) {
                console.log('Failed to show browser notification:', e);
            }
        } else {
            console.log('Browser notifications not available or not permitted');
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

    // Service Worker notification (for when app is in background)
    showServiceWorkerNotification(reminder) {
        if ('serviceWorker' in navigator && 'Notification' in window) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification('Daily Reminder', {
                    body: reminder.title + (reminder.description ? '\n' + reminder.description : ''),
                    tag: reminder.id,
                    requireInteraction: true,
                    actions: [
                        {
                            action: 'view',
                            title: 'View'
                        },
                        {
                            action: 'dismiss',
                            title: 'Dismiss'
                        }
                    ]
                });
            });
        }
    }
}

// Initialize notification manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.notificationManager = new NotificationManager();
});