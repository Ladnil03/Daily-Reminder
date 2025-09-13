// Enhanced PWA functionality - merged from pwa-enhanced
class PWAEnhanced {
    constructor() {
        this.init();
    }

    init() {
        this.requestNotificationPermission();
        this.setupInstallPrompt();
        this.setupServiceWorkerMessaging();
    }

    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            console.log('Notification permission:', permission);
        }
    }

    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallButton();
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            this.hideInstallButton();
        });

        // Handle manual install button
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('pwa-install-btn')) {
                if (deferredPrompt) {
                    deferredPrompt.prompt();
                    deferredPrompt.userChoice.then((choiceResult) => {
                        if (choiceResult.outcome === 'accepted') {
                            console.log('User accepted install prompt');
                        }
                        deferredPrompt = null;
                    });
                }
            }
        });
    }

    showInstallButton() {
        // Skip if sw-register already created install button
        if (document.getElementById('install-pwa-btn') || document.querySelector('.pwa-install-btn')) return;
        
        const installBtn = document.createElement('button');
        installBtn.className = 'pwa-install-btn';
        installBtn.innerHTML = '📱 Install App';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: #10b981;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        
        document.body.appendChild(installBtn);
    }

    hideInstallButton() {
        const installBtn = document.querySelector('.pwa-install-btn');
        if (installBtn) installBtn.remove();
    }

    setupServiceWorkerMessaging() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'PLAY_NOTIFICATION_SOUND') {
                    this.playNotificationSound();
                }
            });
        }
    }

    // Enhanced reminder scheduling with PWA features
    scheduleReminder(reminder) {
        const triggerTime = new Date(reminder.datetime).getTime();
        const delay = triggerTime - Date.now();
        
        if (delay > 0) {
            // Schedule through service worker for background notifications
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.ready.then(registration => {
                    registration.active.postMessage({
                        type: 'SCHEDULE_NOTIFICATION',
                        reminder: reminder,
                        triggerTime: triggerTime
                    });
                });
            }
            
            // Local scheduling with sound for when app is open
            setTimeout(() => {
                this.playNotificationSound();
                if (Notification.permission === 'granted') {
                    const notification = new Notification(reminder.title, {
                        body: reminder.description || 'Reminder time!',
                        icon: '/pwa/icon-192.png',
                        badge: '/pwa/icon-96.png',
                        vibrate: [200, 100, 200],
                        requireInteraction: true,
                        tag: 'reminder-' + reminder.id
                    });
                    
                    notification.onclick = () => {
                        window.focus();
                        notification.close();
                    };
                }
            }, delay);
        }
    }

    playNotificationSound() {
        try {
            // Try default audio file
            const audio = new Audio('/assets/default.mp3');
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

    // Check if app is running as PWA
    isPWA() {
        return window.matchMedia('(display-mode: standalone)').matches || 
               window.navigator.standalone === true;
    }

    // Show offline indicator
    showOfflineStatus() {
        if (!navigator.onLine) {
            const offlineIndicator = document.createElement('div');
            offlineIndicator.id = 'offline-indicator';
            offlineIndicator.innerHTML = '📡 Offline Mode';
            offlineIndicator.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #f59e0b;
                color: white;
                text-align: center;
                padding: 8px;
                font-size: 14px;
                z-index: 10000;
            `;
            document.body.appendChild(offlineIndicator);
        }
    }
}

// Initialize PWA Enhanced features
document.addEventListener('DOMContentLoaded', () => {
    window.pwaEnhanced = new PWAEnhanced();
    
    // Show offline status
    window.pwaEnhanced.showOfflineStatus();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) indicator.remove();
    });
    
    window.addEventListener('offline', () => {
        window.pwaEnhanced.showOfflineStatus();
    });
});

// Export for use in existing code
window.PWA = {
    scheduleReminder: (reminder) => window.pwaEnhanced.scheduleReminder(reminder),
    playNotificationSound: () => window.pwaEnhanced.playNotificationSound(),
    isPWA: () => window.pwaEnhanced.isPWA()
};