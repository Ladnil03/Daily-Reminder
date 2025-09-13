// PWA Integration - Clean addition to existing app
class PWAManager {
    constructor() {
        this.init();
    }

    init() {
        this.registerServiceWorker();
        this.handleInstallPrompt();
        this.requestNotificationPermission();
    }

    // Service Worker Registration
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/service-worker.js');
                console.log('Service Worker registered');
            } catch (error) {
                console.log('Service Worker registration failed');
            }
        }
    }

    // Install Prompt Handling
    handleInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            this.showInstallButton(deferredPrompt);
        });

        window.addEventListener('appinstalled', () => {
            this.hideInstallButton();
        });
    }

    showInstallButton(deferredPrompt) {
        if (document.getElementById('pwa-install-btn')) return;
        
        const installBtn = document.createElement('button');
        installBtn.id = 'pwa-install-btn';
        installBtn.innerHTML = '📱 Install App';
        installBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #6366f1;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            z-index: 1000;
            transition: all 0.3s ease;
        `;
        
        installBtn.onclick = () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((result) => {
                    if (result.outcome === 'accepted') {
                        this.hideInstallButton();
                    }
                });
            }
        };
        
        document.body.appendChild(installBtn);
    }

    hideInstallButton() {
        const installBtn = document.getElementById('pwa-install-btn');
        if (installBtn) {
            installBtn.remove();
        }
    }

    // Notification Permission
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            await Notification.requestPermission();
        }
    }

    // Schedule Reminder with Background Support
    scheduleReminder(reminder) {
        const triggerTime = new Date(reminder.datetime).getTime();
        
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
        const delay = triggerTime - Date.now();
        if (delay > 0) {
            setTimeout(() => {
                this.playNotificationSound();
                if (Notification.permission === 'granted') {
                    new Notification(reminder.title, {
                        body: reminder.description || 'Reminder time!',
                        icon: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192"%3E%3Crect width="192" height="192" fill="%236366f1" rx="42"/%3E%3Ctext x="96" y="125" font-size="84" text-anchor="middle" fill="white"%3E🔔%3C/text%3E%3C/svg%3E'
                    });
                }
            }, delay);
        }
    }

    // Play notification sound
    playNotificationSound() {
        try {
            // Try to play default audio file first
            const audio = new Audio('/assets/default.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => {
                // Fallback to generated beep sound
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
            console.log('Could not play notification sound');
        }
    }
}

// Initialize PWA Manager
document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
});

// Export for use in existing reminder code
window.PWA = {
    scheduleReminder: (reminder) => window.pwaManager?.scheduleReminder(reminder),
    playSound: () => window.pwaManager?.playNotificationSound()
};