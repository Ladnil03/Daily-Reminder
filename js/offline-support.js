// Offline Support Manager
class OfflineSupport {
    constructor() {
        this.init();
    }

    init() {
        this.addOfflineHandlers();
        this.enablePersistentStorage();
    }

    addOfflineHandlers() {
        window.addEventListener('online', () => {
            console.log('App is online');
            this.showConnectionStatus('online');
        });

        window.addEventListener('offline', () => {
            console.log('App is offline');
            this.showConnectionStatus('offline');
        });
    }

    async enablePersistentStorage() {
        if ('storage' in navigator && 'persist' in navigator.storage) {
            const persistent = await navigator.storage.persist();
            console.log('Persistent storage:', persistent);
        }
    }

    showConnectionStatus(status) {
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 20px;
            border-radius: 20px;
            color: white;
            font-weight: 600;
            z-index: 3000;
            background: ${status === 'online' ? '#10b981' : '#ef4444'};
        `;
        statusDiv.textContent = status === 'online' ? '🟢 Back Online' : '🔴 Offline Mode';
        
        document.body.appendChild(statusDiv);
        setTimeout(() => statusDiv.remove(), 3000);
    }
}

// Initialize offline support
document.addEventListener('DOMContentLoaded', () => {
    window.offlineSupport = new OfflineSupport();
});