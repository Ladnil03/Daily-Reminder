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
        let deferredPrompt;

        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button
            this.showInstallButton(deferredPrompt);
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallButton();
        });
    }

    showInstallButton(deferredPrompt) {
        // Create install button if it doesn't exist
        let installBtn = document.getElementById('install-btn');
        if (!installBtn) {
            installBtn = document.createElement('button');
            installBtn.id = 'install-btn';
            installBtn.textContent = '📱 Install App';
            installBtn.className = 'btn-secondary install-btn';
            
            // Add styles
            installBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                background: var(--primary-color, #2196F3);
                color: white;
                border: none;
                padding: 1rem;
                border-radius: 50px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                cursor: pointer;
                font-size: 0.9rem;
                transition: all 0.3s ease;
            `;
            
            document.body.appendChild(installBtn);
        }

        installBtn.style.display = 'block';
        
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                this.hideInstallButton();
            }
        });
    }

    hideInstallButton() {
        const installBtn = document.getElementById('install-btn');
        if (installBtn) {
            installBtn.style.display = 'none';
        }
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