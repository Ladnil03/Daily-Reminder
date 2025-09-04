// Enhanced Dashboard Management
class DashboardManager {
    constructor() {
        this.currentView = 'list';
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.init();
    }

    init() {
        this.addEventListeners();
        this.initializeUI();
        this.startCountdownUpdater();
        this.addKeyboardShortcuts();
    }

    addEventListeners() {
        // View toggle buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setFilter(e.target.dataset.filter);
            });
        });

        // Search input
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.setSearchQuery(e.target.value);
            });
        }

        // Profile dropdown
        const profileBtn = document.getElementById('profile-btn');
        const profileMenu = document.getElementById('profile-menu');
        if (profileBtn && profileMenu) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                profileMenu.classList.toggle('show');
            });

            document.addEventListener('click', () => {
                profileMenu.classList.remove('show');
            });
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.openSettings();
            });
        }

        // Settings modal
        this.initializeSettingsModal();

        // Notification bell
        const notificationBell = document.getElementById('notification-bell');
        if (notificationBell) {
            notificationBell.addEventListener('click', () => {
                this.showNotifications();
            });
        }

        // Calendar navigation
        const prevMonth = document.getElementById('prev-month');
        const nextMonth = document.getElementById('next-month');
        if (prevMonth && nextMonth) {
            prevMonth.addEventListener('click', () => this.navigateCalendar(-1));
            nextMonth.addEventListener('click', () => this.navigateCalendar(1));
        }
        
        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.showExportMenu());
        }
        
        // Bulk select button
        const bulkSelectBtn = document.getElementById('bulk-select-btn');
        if (bulkSelectBtn) {
            bulkSelectBtn.addEventListener('click', () => {
                if (window.bulkManager) {
                    window.bulkManager.toggleBulkMode();
                }
            });
        }
    }

    initializeUI() {
        // Set initial view
        this.switchView('list');
        
        // Initialize calendar if needed
        if (document.getElementById('calendar-view')) {
            this.initializeCalendar();
        }

        // Update notification count
        this.updateNotificationCount();
    }

    switchView(view) {
        this.currentView = view;

        // Update view buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Update view content
        document.querySelectorAll('.view-content').forEach(content => {
            content.classList.toggle('active', content.id === `${view}-view`);
        });

        // Refresh content based on view
        if (view === 'calendar') {
            this.renderCalendar();
        } else if (view === 'grid') {
            this.renderGridView();
        } else {
            this.renderListView();
        }
    }

    setFilter(filter) {
        this.currentFilter = filter;

        // Update filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        // Re-render current view
        this.refreshCurrentView();
    }

    setSearchQuery(query) {
        this.searchQuery = query.toLowerCase();
        this.refreshCurrentView();
    }

    refreshCurrentView() {
        if (this.currentView === 'calendar') {
            this.renderCalendar();
        } else if (this.currentView === 'grid') {
            this.renderGridView();
        } else {
            this.renderListView();
        }
    }

    renderListView() {
        const container = document.getElementById('reminders-list');
        if (!container || !window.reminderManager) return;

        const reminders = this.getFilteredReminders();
        
        if (reminders.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = reminders.map(reminder => this.createReminderCard(reminder)).join('');
        this.attachReminderEventListeners();
        this.makeDraggable();
    }

    renderGridView() {
        const container = document.getElementById('reminders-grid');
        if (!container || !window.reminderManager) return;

        const reminders = this.getFilteredReminders();
        
        if (reminders.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = reminders.map(reminder => this.createReminderCard(reminder, true)).join('');
        this.attachReminderEventListeners();
        this.makeDraggable();
    }

    getFilteredReminders() {
        if (!window.reminderManager) return [];

        let reminders = [...window.reminderManager.reminders];

        // Apply search filter
        if (this.searchQuery) {
            reminders = reminders.filter(reminder => 
                reminder.title.toLowerCase().includes(this.searchQuery) ||
                (reminder.description && reminder.description.toLowerCase().includes(this.searchQuery))
            );
        }

        // Apply category filter
        if (this.currentFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

            reminders = reminders.filter(reminder => {
                const reminderDate = new Date(reminder.datetime);
                
                switch (this.currentFilter) {
                    case 'today':
                        return reminderDate >= today && reminderDate < tomorrow;
                    case 'upcoming':
                        return reminderDate >= tomorrow;
                    case 'completed':
                        return reminder.completed;
                    default:
                        return true;
                }
            });
        }

        // Sort by date
        return reminders.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    }

    createReminderCard(reminder, isGrid = false) {
        const now = new Date();
        const reminderDate = new Date(reminder.datetime);
        const isOverdue = reminderDate < now && !reminder.completed;
        const countdown = this.getCountdown(reminderDate);
        
        const priority = reminder.priority || 'medium';
        const category = reminder.category || 'personal';

        return `
            <div class="reminder-item ${priority ? `priority-${priority}` : ''} ${reminder.completed ? 'completed' : ''} draggable" 
                 data-id="${reminder.id}" draggable="true">
                <div class="reminder-checkbox">
                    <input type="checkbox" id="check-${reminder.id}" ${reminder.completed ? 'checked' : ''}>
                    <label for="check-${reminder.id}" class="checkmark"></label>
                </div>
                
                <div class="reminder-header">
                    <div>
                        <h3 class="reminder-title">${reminder.title}</h3>
                        <span class="reminder-category ${category}">
                            <i class="fas fa-tag"></i>
                            ${category.charAt(0).toUpperCase() + category.slice(1)}
                        </span>
                    </div>
                </div>
                
                ${reminder.description ? `<p class="reminder-description">${reminder.description}</p>` : ''}
                
                <div class="reminder-meta">
                    <div class="reminder-datetime">
                        <i class="fas fa-calendar-alt"></i>
                        ${this.formatDateTime(reminder.datetime)}
                    </div>
                    <div class="reminder-countdown ${isOverdue ? 'overdue' : ''} ${reminder.completed ? 'completed' : ''}">
                        ${reminder.completed ? 'Completed' : countdown}
                    </div>
                </div>
                
                <div class="reminder-actions">
                    <button class="btn btn-small btn-ghost edit-reminder" data-id="${reminder.id}" title="Edit reminder">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-small btn-ghost snooze-reminder" data-id="${reminder.id}" title="Snooze reminder">
                        <i class="fas fa-clock"></i>
                    </button>
                    <button class="btn btn-small btn-ghost delete-reminder" data-id="${reminder.id}" title="Delete reminder">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${reminder.soundType === 'custom' ? 
                        `<button class="btn btn-small btn-ghost play-sound" data-id="${reminder.id}" title="Play sound">
                            <i class="fas fa-volume-up"></i>
                        </button>` : ''
                    }
                </div>
            </div>
        `;
    }

    attachReminderEventListeners() {
        // Checkbox listeners
        document.querySelectorAll('.reminder-checkbox input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const reminderId = e.target.id.replace('check-', '');
                this.toggleReminderCompletion(reminderId, e.target.checked);
            });
        });

        // Edit buttons
        document.querySelectorAll('.edit-reminder').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const reminderId = e.target.closest('.edit-reminder').dataset.id;
                this.editReminder(reminderId);
            });
        });

        // Delete buttons
        document.querySelectorAll('.delete-reminder').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const reminderId = e.target.closest('.delete-reminder').dataset.id;
                this.deleteReminder(reminderId);
            });
        });
        
        // Snooze buttons
        document.querySelectorAll('.snooze-reminder').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const reminderId = e.target.closest('.snooze-reminder').dataset.id;
                this.snoozeReminder(reminderId);
            });
        });

        // Play sound buttons
        document.querySelectorAll('.play-sound').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const reminderId = e.target.closest('.play-sound').dataset.id;
                this.playReminderSound(reminderId);
            });
        });
    }

    toggleReminderCompletion(reminderId, completed) {
        if (!window.reminderManager) return;

        const reminder = window.reminderManager.reminders.find(r => r.id === reminderId);
        if (reminder) {
            reminder.completed = completed;
            reminder.completedAt = completed ? new Date().toISOString() : null;
            
            // Stop sound when task is completed
            if (completed && window.reminderManager) {
                window.reminderManager.stopCurrentSound();
            }
            
            window.reminderManager.storeReminders();
            window.reminderManager.updateStats();
            
            // Add completion animation
            const reminderElement = document.querySelector(`[data-id="${reminderId}"]`);
            if (reminderElement) {
                if (completed) {
                    reminderElement.style.animation = 'bounce 0.6s ease-out';
                    setTimeout(() => {
                        reminderElement.classList.add('completed');
                        reminderElement.style.animation = '';
                    }, 600);
                } else {
                    reminderElement.classList.remove('completed');
                }
            }
        }
    }

    editReminder(reminderId) {
        if (!window.reminderManager) return;

        const reminder = window.reminderManager.reminders.find(r => r.id === reminderId);
        if (reminder) {
            window.reminderManager.openModal(reminder);
        }
    }

    deleteReminder(reminderId) {
        if (!window.reminderManager) return;

        if (confirm('Are you sure you want to delete this reminder?')) {
            window.reminderManager.deleteReminder(reminderId);
            this.refreshCurrentView();
        }
    }

    playReminderSound(reminderId) {
        if (!window.reminderManager) return;

        const reminder = window.reminderManager.reminders.find(r => r.id === reminderId);
        if (reminder) {
            window.reminderManager.playReminderSound(reminder);
        }
    }
    
    snoozeReminder(reminderId) {
        if (!window.reminderManager) return;
        
        const reminder = window.reminderManager.reminders.find(r => r.id === reminderId);
        if (!reminder) return;
        
        const snoozeOptions = [
            { label: '5 minutes', minutes: 5 },
            { label: '15 minutes', minutes: 15 },
            { label: '30 minutes', minutes: 30 },
            { label: '1 hour', minutes: 60 },
            { label: '2 hours', minutes: 120 }
        ];
        
        const choice = prompt(
            'Snooze for how long?\n' + 
            snoozeOptions.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n') +
            '\nEnter number (1-5):'
        );
        
        const index = parseInt(choice) - 1;
        if (index >= 0 && index < snoozeOptions.length) {
            const newTime = new Date(Date.now() + snoozeOptions[index].minutes * 60000);
            reminder.datetime = newTime.toISOString();
            reminder.isActive = true;
            
            window.reminderManager.storeReminders();
            this.refreshCurrentView();
            
            // Show snooze confirmation
            const toast = document.createElement('div');
            toast.textContent = `Reminder snoozed for ${snoozeOptions[index].label}`;
            toast.style.cssText = `
                position: fixed; top: 90px; right: 20px; background: var(--warning-color);
                color: white; padding: 1rem; border-radius: var(--radius-lg);
                box-shadow: var(--shadow-lg); z-index: 3000;
            `;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }
    }

    getCountdown(targetDate) {
        const now = new Date();
        const diff = targetDate - now;

        if (diff < 0) {
            return 'Overdue';
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) {
            return `${days}d ${hours}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    formatDateTime(datetime) {
        const date = new Date(datetime);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        let dateStr;
        if (date >= today && date < tomorrow) {
            dateStr = 'Today';
        } else if (date >= tomorrow && date < new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)) {
            dateStr = 'Tomorrow';
        } else {
            dateStr = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
            });
        }

        const timeStr = date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true
        });

        return `${dateStr} at ${timeStr}`;
    }

    getEmptyState() {
        const messages = {
            all: {
                icon: 'fas fa-tasks',
                title: 'No reminders yet',
                message: 'Create your first reminder to get started!'
            },
            today: {
                icon: 'fas fa-calendar-day',
                title: 'No reminders for today',
                message: 'Enjoy your free day!'
            },
            upcoming: {
                icon: 'fas fa-clock',
                title: 'No upcoming reminders',
                message: 'All caught up!'
            },
            completed: {
                icon: 'fas fa-check-circle',
                title: 'No completed reminders',
                message: 'Complete some tasks to see them here.'
            }
        };

        const config = messages[this.currentFilter] || messages.all;

        return `
            <div class="empty-state">
                <i class="${config.icon}"></i>
                <h3>${config.title}</h3>
                <p>${config.message}</p>
                ${this.currentFilter === 'all' ? 
                    '<button class="btn btn-primary" onclick="document.getElementById(\'add-reminder-btn\').click()">Add Your First Reminder</button>' : 
                    ''
                }
            </div>
        `;
    }

    startCountdownUpdater() {
        // Update countdowns every minute
        setInterval(() => {
            document.querySelectorAll('.reminder-countdown').forEach(element => {
                if (!element.classList.contains('completed')) {
                    const reminderItem = element.closest('.reminder-item');
                    const reminderId = reminderItem?.dataset.id;
                    
                    if (reminderId && window.reminderManager) {
                        const reminder = window.reminderManager.reminders.find(r => r.id === reminderId);
                        if (reminder) {
                            const countdown = this.getCountdown(new Date(reminder.datetime));
                            element.textContent = countdown;
                            element.classList.toggle('overdue', countdown === 'Overdue');
                        }
                    }
                }
            });
        }, 60000);
    }

    updateNotificationCount() {
        if (!window.reminderManager) return;

        const now = new Date();
        const upcomingCount = window.reminderManager.reminders.filter(reminder => {
            const reminderDate = new Date(reminder.datetime);
            const timeDiff = reminderDate - now;
            return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000 && !reminder.completed;
        }).length;

        const countElement = document.getElementById('notification-count');
        const bellElement = document.getElementById('notification-bell');
        
        if (countElement && bellElement) {
            if (upcomingCount > 0) {
                countElement.textContent = upcomingCount;
                countElement.classList.remove('hidden');
                bellElement.classList.add('has-notifications');
            } else {
                countElement.classList.add('hidden');
                bellElement.classList.remove('has-notifications');
            }
        }
    }

    showNotifications() {
        // This could open a notifications panel
        console.log('Show notifications panel');
    }

    openSettings() {
        const modal = document.getElementById('settings-modal');
        if (modal) {
            modal.classList.add('show');
        }
    }

    initializeSettingsModal() {
        const modal = document.getElementById('settings-modal');
        const closeBtn = modal?.querySelector('.modal-close');
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('show');
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
                    modal.classList.remove('show');
                }
            });
        }

        // Load settings
        this.loadSettings();
    }

    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        
        const notificationsToggle = document.getElementById('setting-notifications');
        const soundToggle = document.getElementById('setting-sound');
        const darkModeToggle = document.getElementById('setting-dark-mode');
        
        if (notificationsToggle) {
            notificationsToggle.checked = settings.notifications !== false;
            notificationsToggle.addEventListener('change', () => this.saveSetting('notifications', notificationsToggle.checked));
        }
        
        if (soundToggle) {
            soundToggle.checked = settings.sound !== false;
            soundToggle.addEventListener('change', () => this.saveSetting('sound', soundToggle.checked));
        }
        
        if (darkModeToggle) {
            darkModeToggle.checked = document.documentElement.getAttribute('data-theme') === 'dark';
            darkModeToggle.addEventListener('change', () => {
                if (window.themeManager) {
                    window.themeManager.toggleTheme();
                }
            });
        }
    }

    saveSetting(key, value) {
        const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        settings[key] = value;
        localStorage.setItem('userSettings', JSON.stringify(settings));
    }

    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only trigger if not in input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            switch (e.key.toLowerCase()) {
                case 'n':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        document.getElementById('add-reminder-btn')?.click();
                    }
                    break;
                case '1':
                    if (e.altKey) {
                        e.preventDefault();
                        this.switchView('list');
                    }
                    break;
                case '2':
                    if (e.altKey) {
                        e.preventDefault();
                        this.switchView('grid');
                    }
                    break;
                case '3':
                    if (e.altKey) {
                        e.preventDefault();
                        this.switchView('calendar');
                    }
                    break;
                case '/':
                    e.preventDefault();
                    document.getElementById('search-input')?.focus();
                    break;
                case 'escape':
                    // Close any open modals
                    document.querySelectorAll('.modal.show').forEach(modal => {
                        modal.classList.remove('show');
                    });
                    break;
            }
        });
    }

    // Calendar methods (basic implementation)
    initializeCalendar() {
        this.currentCalendarDate = new Date();
        this.renderCalendar();
    }

    navigateCalendar(direction) {
        this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + direction);
        this.renderCalendar();
    }

    renderCalendar() {
        const titleElement = document.getElementById('calendar-title');
        const gridElement = document.getElementById('calendar-grid');
        
        if (!titleElement || !gridElement) return;

        // Update title
        titleElement.textContent = this.currentCalendarDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });

        // Generate calendar grid
        const year = this.currentCalendarDate.getFullYear();
        const month = this.currentCalendarDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        let calendarHTML = '';
        
        // Add day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            calendarHTML += `<div class="calendar-day-header">${day}</div>`;
        });

        // Add calendar days
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = this.isToday(currentDate);
            const dayReminders = this.getRemindersForDate(currentDate);

            calendarHTML += `
                <div class="calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}">
                    <div class="calendar-day-number">${currentDate.getDate()}</div>
                    ${dayReminders.map(reminder => `
                        <div class="calendar-reminder" title="${reminder.title}">
                            ${reminder.title.substring(0, 15)}${reminder.title.length > 15 ? '...' : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }

        gridElement.innerHTML = calendarHTML;
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    getRemindersForDate(date) {
        if (!window.reminderManager) return [];

        return window.reminderManager.reminders.filter(reminder => {
            const reminderDate = new Date(reminder.datetime);
            return reminderDate.toDateString() === date.toDateString();
        });
    }
    
    showExportMenu() {
        const menu = document.createElement('div');
        menu.className = 'export-menu';
        menu.innerHTML = `
            <div class="export-options">
                <button onclick="window.calendarManager.exportCalendar('json')">Export as JSON</button>
                <button onclick="window.calendarManager.exportCalendar('ics')">Export as ICS</button>
                <button onclick="this.parentElement.parentElement.remove()">Cancel</button>
            </div>
        `;
        menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--card-bg);
            padding: 1rem;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-xl);
            z-index: 2000;
        `;
        document.body.appendChild(menu);
    }
    
    makeDraggable() {
        if (!window.dragDropManager) return;
        
        document.querySelectorAll('.reminder-item').forEach(item => {
            const reminderId = item.dataset.id;
            if (reminderId) {
                window.dragDropManager.makeDraggable(item, reminderId);
            }
        });
    }
}

// Initialize dashboard manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.authManager && window.authManager.isLoggedIn()) {
        window.dashboardManager = new DashboardManager();
    }
});