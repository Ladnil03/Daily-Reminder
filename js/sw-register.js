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
            console.log('PWA install prompt available');
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            deferredPrompt = e;
            
            // Show install button after a delay
            setTimeout(() => {
                this.showInstallButton(deferredPrompt);
            }, 3000);
        });

        window.addEventListener('appinstalled', (e) => {
            console.log('PWA was installed successfully');
            this.hideInstallButton();
            this.showInstallSuccess();
        });
        
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            console.log('PWA is already installed');
        }
        
        // For iOS Safari - show manual install instructions
        if (this.isIOS() && !this.isInStandaloneMode()) {
            setTimeout(() => {
                this.showIOSInstallInstructions();
            }, 5000);
        }
    }
    
    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }
    
    isInStandaloneMode() {
        return window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches;
    }
    
    showIOSInstallInstructions() {
        const instructions = document.createElement('div');
        instructions.innerHTML = `
            <div style="background: #007AFF; color: white; padding: 1rem; border-radius: 10px; position: fixed; bottom: 20px; left: 20px; right: 20px; z-index: 2000; text-align: center;">
                <p><strong>Install this app:</strong></p>
                <p>Tap <span style="font-size: 1.2em;">⬆️</span> then "Add to Home Screen"</p>
                <button onclick="this.parentElement.remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 0.5rem 1rem; border-radius: 5px; margin-top: 0.5rem;">Got it</button>
            </div>
        `;
        document.body.appendChild(instructions);
        
        // Auto remove after 10 seconds
        setTimeout(() => {
            if (instructions.parentElement) {
                instructions.remove();
            }
        }, 10000);
    }

    showInstallButton(deferredPrompt) {
        // Create install button if it doesn't exist
        let installBtn = document.getElementById('install-btn');
        if (!installBtn) {
            installBtn = document.createElement('button');
            installBtn.id = 'install-btn';
            installBtn.innerHTML = '📱 Install App';
            installBtn.className = 'btn-primary install-btn';
            
            // Add styles for better visibility
            installBtn.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 1000;
                background: linear-gradient(135deg, #6366f1, #4f46e5);
                color: white;
                border: none;
                padding: 1rem 1.5rem;
                border-radius: 50px;
                box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
                cursor: pointer;
                font-size: 1rem;
                font-weight: 600;
                transition: all 0.3s ease;
                animation: pulse 2s infinite;
            `;
            
            document.body.appendChild(installBtn);
        }

        installBtn.style.display = 'block';
        
        installBtn.onclick = async () => {
            if (deferredPrompt) {
                try {
                    await deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    console.log(`Install prompt result: ${outcome}`);
                    
                    if (outcome === 'accepted') {
                        console.log('PWA installed successfully');
                        this.showInstallSuccess();
                    }
                    
                    deferredPrompt = null;
                    this.hideInstallButton();
                } catch (error) {
                    console.error('Install prompt failed:', error);
                }
            }
        };
    }
    
    showInstallSuccess() {
        const toast = document.createElement('div');
        toast.innerHTML = '✅ App installed successfully!';
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            z-index: 2000;
            font-weight: 600;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
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