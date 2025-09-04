// Service Worker registration
class ServiceWorkerManager {
    constructor() {
        this.init();
    }

    async init() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('pwa/service-worker.js');
                console.log('Service Worker registered successfully:', registration);
                
                // Handle updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            this.showUpdateNotification();
                        }
                    });
                });
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }

        // Handle install prompt
        this.handleInstallPrompt();
    }

    handleInstallPrompt() {
        // Disable all install prompts
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            console.log('Install prompt blocked');
        });

        window.addEventListener('appinstalled', (e) => {
            console.log('App installed');
        });
    }
    






    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.innerHTML = `
            <div class="update-content">
                <p>🔄 A new version is available!</p>
                <button id="update-btn" class="btn-primary">Update</button>
                <button id="dismiss-update" class="btn-secondary">Later</button>
            </div>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: var(--primary-color, #2196F3);
            color: white;
            padding: 1rem;
            text-align: center;
            z-index: 10000;
            transform: translateY(-100%);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateY(0)';
        }, 100);

        // Handle update
        document.getElementById('update-btn').addEventListener('click', () => {
            window.location.reload();
        });

        // Handle dismiss
        document.getElementById('dismiss-update').addEventListener('click', () => {
            notification.style.transform = 'translateY(-100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
    }
}

// Initialize service worker manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.swManager = new ServiceWorkerManager();
});