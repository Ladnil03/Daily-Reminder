// Notification Popup Manager
class NotificationPopupManager {
    constructor() {
        this.activePopups = new Map();
        this.init();
    }

    init() {
        this.createPopupContainer();
    }

    createPopupContainer() {
        if (document.getElementById('notification-popups')) return;
        
        const container = document.createElement('div');
        container.id = 'notification-popups';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 3000;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    showReminderPopup(reminder) {
        // Don't show if already showing for this reminder
        if (this.activePopups.has(reminder.id)) return;

        const popup = document.createElement('div');
        popup.className = 'reminder-popup';
        popup.style.cssText = `
            background: var(--card-bg, white);
            border: 2px solid var(--primary-color, #6366f1);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            max-width: 350px;
            pointer-events: auto;
            animation: slideInRight 0.3s ease-out;
            position: relative;
        `;

        popup.innerHTML = `
            <div class="popup-header">
                <div class="popup-icon">
                    <i class="fas fa-bell" style="color: var(--primary-color, #6366f1); font-size: 1.5rem;"></i>
                </div>
                <div class="popup-priority priority-${reminder.priority || 'medium'}"></div>
            </div>
            <h3 style="margin: 0.5rem 0; color: var(--text-color, #333); font-size: 1.1rem;">${reminder.title}</h3>
            ${reminder.description ? `<p style="margin: 0.5rem 0; color: var(--text-muted, #666); font-size: 0.9rem;">${reminder.description}</p>` : ''}
            <div class="popup-time" style="font-size: 0.8rem; color: var(--text-muted, #666); margin: 0.5rem 0;">
                <i class="fas fa-clock"></i> ${this.formatTime(reminder.datetime)}
            </div>
            <div class="popup-actions" style="display: flex; gap: 0.5rem; margin-top: 1rem;">
                <button class="popup-btn seen-btn" data-id="${reminder.id}">
                    <i class="fas fa-eye"></i> I've Seen It
                </button>
                <button class="popup-btn complete-btn" data-id="${reminder.id}">
                    <i class="fas fa-check"></i> Complete
                </button>
            </div>
        `;

        // Add CSS for buttons
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            .popup-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.5rem;
            }
            .popup-priority {
                width: 12px;
                height: 12px;
                border-radius: 50%;
            }
            .popup-priority.priority-low { background: #10b981; }
            .popup-priority.priority-medium { background: #f59e0b; }
            .popup-priority.priority-high { background: #ef4444; }
            .popup-btn {
                flex: 1;
                padding: 0.7rem 1rem;
                border: none;
                border-radius: 8px;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.3rem;
            }
            .seen-btn {
                background: #e5e7eb;
                color: #374151;
            }
            .seen-btn:hover {
                background: #d1d5db;
                transform: translateY(-1px);
            }
            .complete-btn {
                background: #10b981;
                color: white;
            }
            .complete-btn:hover {
                background: #059669;
                transform: translateY(-1px);
            }
        `;
        document.head.appendChild(style);

        // Add event listeners
        popup.querySelector('.seen-btn').onclick = () => this.handleSeen(reminder.id);
        popup.querySelector('.complete-btn').onclick = () => this.handleComplete(reminder.id);

        // Add to container
        document.getElementById('notification-popups').appendChild(popup);
        this.activePopups.set(reminder.id, popup);

        // Auto-remove after 30 seconds if no action
        setTimeout(() => {
            if (this.activePopups.has(reminder.id)) {
                this.removePopup(reminder.id);
            }
        }, 30000);
    }

    handleSeen(reminderId) {
        console.log('User acknowledged reminder:', reminderId);
        
        // Stop the sound
        if (window.reminderManager) {
            window.reminderManager.stopCurrentSound();
        }
        
        // Remove popup
        this.removePopup(reminderId);
        
        // Show acknowledgment
        this.showAckMessage('Reminder acknowledged');
    }

    handleComplete(reminderId) {
        console.log('User completed reminder:', reminderId);
        
        // Stop the sound
        if (window.reminderManager) {
            window.reminderManager.stopCurrentSound();
        }
        
        // Mark as completed
        if (window.dashboardManager) {
            window.dashboardManager.toggleReminderCompletion(reminderId, true);
        }
        
        // Remove popup
        this.removePopup(reminderId);
        
        // Show completion message
        this.showAckMessage('Task completed! 🎉');
    }

    removePopup(reminderId) {
        const popup = this.activePopups.get(reminderId);
        if (popup) {
            popup.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (popup.parentNode) {
                    popup.remove();
                }
            }, 300);
            this.activePopups.delete(reminderId);
        }
    }

    showAckMessage(message) {
        const ack = document.createElement('div');
        ack.textContent = message;
        ack.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #10b981;
            color: white;
            padding: 0.8rem 1.5rem;
            border-radius: 25px;
            font-weight: 600;
            z-index: 3001;
            animation: fadeInOut 2s ease-in-out;
        `;
        
        const ackStyle = document.createElement('style');
        ackStyle.textContent = `
            @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
                20%, 80% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
            }
            @keyframes slideOutRight {
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(ackStyle);
        
        document.body.appendChild(ack);
        setTimeout(() => ack.remove(), 2000);
    }

    formatTime(datetime) {
        const date = new Date(datetime);
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true
        });
    }
}

// Initialize notification popup manager
document.addEventListener('DOMContentLoaded', () => {
    window.notificationPopupManager = new NotificationPopupManager();
});