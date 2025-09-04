// Bulk Operations Manager
class BulkOperationsManager {
    constructor() {
        this.selectedReminders = new Set();
        this.bulkMode = false;
        this.init();
    }

    init() {
        this.addEventListeners();
        this.createBulkToolbar();
    }

    addEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'a') {
                e.preventDefault();
                this.selectAll();
            }
            if (e.key === 'Delete' && this.selectedReminders.size > 0) {
                this.deleteSelected();
            }
        });
    }

    createBulkToolbar() {
        const toolbar = document.createElement('div');
        toolbar.id = 'bulk-toolbar';
        toolbar.className = 'bulk-toolbar hidden';
        toolbar.innerHTML = `
            <div class="bulk-content">
                <span class="bulk-count">0 selected</span>
                <div class="bulk-actions">
                    <button class="btn btn-small btn-ghost" onclick="window.bulkManager.markCompleted()">
                        <i class="fas fa-check"></i> Complete
                    </button>
                    <button class="btn btn-small btn-ghost" onclick="window.bulkManager.changePriority()">
                        <i class="fas fa-flag"></i> Priority
                    </button>
                    <button class="btn btn-small btn-ghost" onclick="window.bulkManager.changeCategory()">
                        <i class="fas fa-tag"></i> Category
                    </button>
                    <button class="btn btn-small btn-ghost" onclick="window.bulkManager.deleteSelected()">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="window.bulkManager.clearSelection()">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(toolbar);
    }

    toggleBulkMode() {
        this.bulkMode = !this.bulkMode;
        document.body.classList.toggle('bulk-mode', this.bulkMode);
        
        if (!this.bulkMode) {
            this.clearSelection();
        }
        
        this.updateUI();
    }

    selectReminder(reminderId) {
        if (this.selectedReminders.has(reminderId)) {
            this.selectedReminders.delete(reminderId);
        } else {
            this.selectedReminders.add(reminderId);
        }
        this.updateUI();
    }

    selectAll() {
        if (!window.reminderManager) return;
        
        this.selectedReminders.clear();
        window.reminderManager.reminders.forEach(r => {
            this.selectedReminders.add(r.id);
        });
        this.updateUI();
    }

    clearSelection() {
        this.selectedReminders.clear();
        this.bulkMode = false;
        document.body.classList.remove('bulk-mode');
        this.updateUI();
    }

    updateUI() {
        const toolbar = document.getElementById('bulk-toolbar');
        const count = this.selectedReminders.size;
        
        if (count > 0) {
            toolbar.classList.remove('hidden');
            toolbar.querySelector('.bulk-count').textContent = `${count} selected`;
        } else {
            toolbar.classList.add('hidden');
        }

        // Update reminder cards
        document.querySelectorAll('.reminder-item').forEach(item => {
            const isSelected = this.selectedReminders.has(item.dataset.id);
            item.classList.toggle('selected', isSelected);
        });
    }

    markCompleted() {
        if (!window.reminderManager) return;
        
        this.selectedReminders.forEach(id => {
            const reminder = window.reminderManager.reminders.find(r => r.id === id);
            if (reminder) {
                reminder.completed = true;
                reminder.completedAt = new Date().toISOString();
            }
        });
        
        window.reminderManager.storeReminders();
        window.reminderManager.updateStats();
        window.dashboardManager?.refreshCurrentView();
        this.clearSelection();
    }

    changePriority() {
        const priority = prompt('Enter priority (low, medium, high):', 'medium');
        if (!priority || !['low', 'medium', 'high'].includes(priority)) return;
        
        this.selectedReminders.forEach(id => {
            const reminder = window.reminderManager.reminders.find(r => r.id === id);
            if (reminder) {
                reminder.priority = priority;
            }
        });
        
        window.reminderManager.storeReminders();
        window.dashboardManager?.refreshCurrentView();
        this.clearSelection();
    }

    changeCategory() {
        const category = prompt('Enter category (personal, work, health, finance, other):', 'personal');
        if (!category || !['personal', 'work', 'health', 'finance', 'other'].includes(category)) return;
        
        this.selectedReminders.forEach(id => {
            const reminder = window.reminderManager.reminders.find(r => r.id === id);
            if (reminder) {
                reminder.category = category;
            }
        });
        
        window.reminderManager.storeReminders();
        window.dashboardManager?.refreshCurrentView();
        this.clearSelection();
    }

    deleteSelected() {
        if (!confirm(`Delete ${this.selectedReminders.size} selected reminders?`)) return;
        
        window.reminderManager.reminders = window.reminderManager.reminders.filter(r => 
            !this.selectedReminders.has(r.id)
        );
        
        window.reminderManager.storeReminders();
        window.reminderManager.updateStats();
        window.dashboardManager?.refreshCurrentView();
        this.clearSelection();
    }
}

// Initialize bulk operations
document.addEventListener('DOMContentLoaded', () => {
    window.bulkManager = new BulkOperationsManager();
});