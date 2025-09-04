// Reminder management
class ReminderManager {
    constructor() {
        this.reminders = [];
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.loadReminders();
        this.addEventListeners();
        this.renderReminders();
        this.updateStats();
        this.startReminderChecker();
    }

    addEventListeners() {
        // Add reminder button
        const addBtn = document.getElementById('add-reminder-btn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openModal());
        }
        
        // Add quick test reminder button (for testing)
        this.addQuickTestButton();

        // Modal close buttons
        const closeBtn = document.getElementById('modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Cancel button
        const cancelBtn = document.getElementById('cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        // Form submit
        const form = document.getElementById('reminder-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // Sound selection and test
        const soundSelect = document.getElementById('reminder-sound');
        const customSoundInput = document.getElementById('custom-sound');
        const testSoundBtn = document.getElementById('test-sound');
        
        if (soundSelect && customSoundInput) {
            soundSelect.addEventListener('change', (e) => {
                customSoundInput.classList.toggle('hidden', e.target.value !== 'custom');
            });
        }
        
        if (testSoundBtn) {
            testSoundBtn.addEventListener('click', () => this.testSound());
        }

        // Repeat checkbox
        const repeatCheckbox = document.getElementById('reminder-repeat');
        const repeatOptions = document.getElementById('repeat-options');
        if (repeatCheckbox && repeatOptions) {
            repeatCheckbox.addEventListener('change', (e) => {
                repeatOptions.classList.toggle('hidden', !e.target.checked);
            });
        }

        // Close modal on outside click
        const modal = document.getElementById('reminder-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
                    this.closeModal();
                }
            });
        }
    }

    openModal(reminder = null) {
        const modal = document.getElementById('reminder-modal');
        const modalTitle = document.getElementById('modal-title');
        const form = document.getElementById('reminder-form');

        if (reminder) {
            // Edit mode
            this.currentEditId = reminder.id;
            modalTitle.textContent = 'Edit Reminder';
            this.populateForm(reminder);
        } else {
            // Add mode
            this.currentEditId = null;
            modalTitle.textContent = 'Add Reminder';
            form.reset();
            
            // Set default datetime to current time + 1 hour
            const defaultDate = new Date();
            defaultDate.setHours(defaultDate.getHours() + 1);
            defaultDate.setMinutes(0);
            document.getElementById('reminder-datetime').value = defaultDate.toISOString().slice(0, 16);
        }

        modal.classList.add('show');
        
        // Focus first input
        setTimeout(() => {
            const firstInput = form.querySelector('input, textarea, select');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    closeModal() {
        const modal = document.getElementById('reminder-modal');
        modal.classList.remove('show');
        this.currentEditId = null;
        this.setLoadingState(false);
    }

    populateForm(reminder) {
        document.getElementById('reminder-title').value = reminder.title;
        document.getElementById('reminder-description').value = reminder.description || '';
        document.getElementById('reminder-datetime').value = reminder.datetime;
        document.getElementById('reminder-priority').value = reminder.priority || 'medium';
        document.getElementById('reminder-category').value = reminder.category || 'personal';
        document.getElementById('reminder-sound').value = reminder.soundType || 'default';
        
        // Handle repeat settings
        const repeatCheckbox = document.getElementById('reminder-repeat');
        const repeatOptions = document.getElementById('repeat-options');
        if (reminder.repeat) {
            repeatCheckbox.checked = true;
            repeatOptions.classList.remove('hidden');
            document.getElementById('repeat-frequency').value = reminder.repeatFrequency || 'daily';
        }
        
        // Show custom sound input if needed
        const customSoundInput = document.getElementById('custom-sound');
        if (reminder.soundType === 'custom') {
            customSoundInput.classList.remove('hidden');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        if (this.isLoading) return;

        const title = document.getElementById('reminder-title').value.trim();
        const description = document.getElementById('reminder-description').value.trim();
        const datetime = document.getElementById('reminder-datetime').value;
        const priority = document.getElementById('reminder-priority').value;
        const category = document.getElementById('reminder-category').value;
        const soundType = document.getElementById('reminder-sound').value;
        const customSoundFile = document.getElementById('custom-sound').files[0];
        const repeat = document.getElementById('reminder-repeat').checked;
        const repeatFrequency = document.getElementById('repeat-frequency').value;

        if (!title || !datetime) {
            this.showFormError('Please fill in required fields');
            return;
        }

        // Check if datetime is in the future (allow current time for testing)
        if (new Date(datetime) < new Date(Date.now() - 60000)) {
            this.showFormError('Please select a future date and time');
            return;
        }

        this.setLoadingState(true);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 500));

        const reminderData = {
            id: this.currentEditId || Date.now().toString(),
            title,
            description,
            datetime,
            priority,
            category,
            soundType,
            customSound: null,
            repeat,
            repeatFrequency: repeat ? repeatFrequency : null,
            userId: window.authManager.currentUser.id,
            createdAt: this.currentEditId ? this.getCurrentReminder()?.createdAt : new Date().toISOString(),
            isActive: true,
            completed: this.currentEditId ? this.getCurrentReminder()?.completed || false : false
        };

        // Handle custom sound
        if (soundType === 'custom' && customSoundFile) {
            try {
                const reader = new FileReader();
                reader.onload = (e) => {
                    reminderData.customSound = e.target.result;
                    this.saveReminder(reminderData);
                };
                reader.readAsDataURL(customSoundFile);
            } catch (error) {
                this.setLoadingState(false);
                this.showFormError('Error processing custom sound file');
            }
        } else {
            this.saveReminder(reminderData);
        }
    }

    saveReminder(reminderData) {
        if (this.currentEditId) {
            // Update existing
            const index = this.reminders.findIndex(r => r.id === this.currentEditId);
            if (index !== -1) {
                this.reminders[index] = reminderData;
            }
        } else {
            // Add new
            this.reminders.push(reminderData);
        }

        this.storeReminders();
        this.renderReminders();
        this.updateStats();
        
        // Update dashboard if available
        if (window.dashboardManager) {
            window.dashboardManager.refreshCurrentView();
            window.dashboardManager.updateNotificationCount();
        }
        
        this.setLoadingState(false);
        this.closeModal();
        
        // Show success message
        this.showSuccessToast(this.currentEditId ? 'Reminder updated!' : 'Reminder created!');
    }

    deleteReminder(id) {
        if (confirm('Are you sure you want to delete this reminder?')) {
            this.reminders = this.reminders.filter(r => r.id !== id);
            this.storeReminders();
            this.renderReminders();
            this.updateStats();
        }
    }

    loadReminders() {
        const stored = localStorage.getItem('reminders');
        if (stored) {
            this.reminders = JSON.parse(stored).filter(r => 
                r.userId === window.authManager.currentUser.id
            );
        }
    }

    storeReminders() {
        // Get all reminders from storage
        const allReminders = JSON.parse(localStorage.getItem('reminders') || '[]');
        
        // Remove current user's reminders
        const otherReminders = allReminders.filter(r => 
            r.userId !== window.authManager.currentUser.id
        );
        
        // Add current user's reminders
        const updatedReminders = [...otherReminders, ...this.reminders];
        
        localStorage.setItem('reminders', JSON.stringify(updatedReminders));
    }

    renderReminders() {
        // This method is now handled by the dashboard manager
        // Keep for backward compatibility
        if (window.dashboardManager) {
            window.dashboardManager.refreshCurrentView();
        }
    }

    updateStats() {
        const totalElement = document.getElementById('total-reminders');
        const activeElement = document.getElementById('active-reminders');
        const completedElement = document.getElementById('completed-reminders');
        const completionRateElement = document.getElementById('completion-rate');

        if (totalElement) {
            totalElement.textContent = this.reminders.length;
        }

        if (activeElement) {
            const today = new Date();
            const todayStr = today.toDateString();
            const activeToday = this.reminders.filter(r => 
                new Date(r.datetime).toDateString() === todayStr && !r.completed
            ).length;
            activeElement.textContent = activeToday;
        }
        
        if (completedElement) {
            const completed = this.reminders.filter(r => r.completed).length;
            completedElement.textContent = completed;
        }
        
        if (completionRateElement) {
            const total = this.reminders.length;
            const completed = this.reminders.filter(r => r.completed).length;
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
            completionRateElement.textContent = `${rate}%`;
        }
    }

    formatDateTime(datetime) {
        const date = new Date(datetime);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    startReminderChecker() {
        // Check every 10 seconds for testing, then every minute
        setInterval(() => {
            this.checkDueReminders();
        }, 10000);
        
        // Also check immediately
        setTimeout(() => this.checkDueReminders(), 2000);
    }

    checkDueReminders() {
        const now = new Date();
        const dueReminders = this.reminders.filter(reminder => {
            const reminderTime = new Date(reminder.datetime);
            // Allow 1 minute tolerance for testing
            return reminderTime <= now && reminder.isActive && !reminder.completed;
        });

        console.log(`Checking reminders: ${dueReminders.length} due now`);

        dueReminders.forEach(reminder => {
            console.log('Triggering reminder:', reminder.title);
            this.triggerReminder(reminder);
            // Mark as inactive to prevent repeated notifications
            reminder.isActive = false;
        });

        if (dueReminders.length > 0) {
            this.storeReminders();
        }
    }

    triggerReminder(reminder) {
        // Show notification
        if (window.notificationManager) {
            window.notificationManager.showNotification(reminder);
        }

        // Play sound
        this.playReminderSound(reminder);
        
        // Animate notification bell
        const notificationBell = document.getElementById('notification-bell');
        if (notificationBell) {
            notificationBell.classList.add('has-notifications');
            setTimeout(() => {
                notificationBell.classList.remove('has-notifications');
            }, 3000);
        }
        
        // Update notification count
        if (window.dashboardManager) {
            window.dashboardManager.updateNotificationCount();
        }
    }

    async playReminderSound(reminder) {
        console.log('Playing reminder sound for:', reminder.title);
        
        // Initialize audio context
        await this.initializeAudio();
        
        if (reminder.soundType === 'custom' && reminder.customSound) {
            try {
                const audio = new Audio(reminder.customSound);
                audio.volume = 0.7;
                await audio.play();
                console.log('Custom reminder sound played');
            } catch (e) {
                console.log('Could not play custom sound:', e);
                await this.playDefaultBeep();
            }
        } else {
            await this.playDefaultBeep();
        }
    }

    async playDefaultBeep() {
        try {
            // Create or resume audio context
            if (!window.audioContext) {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // Resume audio context if suspended
            if (window.audioContext.state === 'suspended') {
                await window.audioContext.resume();
            }
            
            const oscillator = window.audioContext.createOscillator();
            const gainNode = window.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(window.audioContext.destination);
            
            // Create a more pleasant beep sound
            oscillator.frequency.setValueAtTime(800, window.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, window.audioContext.currentTime + 0.1);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, window.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, window.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.5);
            
            oscillator.start(window.audioContext.currentTime);
            oscillator.stop(window.audioContext.currentTime + 0.5);
            
            console.log('Beep sound played successfully');
        } catch (e) {
            console.log('Could not play beep sound:', e);
            // Fallback: try HTML5 audio with data URL
            this.playFallbackBeep();
        }
    }
    
    playFallbackBeep() {
        try {
            // Create a simple beep using data URL
            const beepSound = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT';
            const audio = new Audio(beepSound);
            audio.volume = 0.3;
            audio.play().catch(e => console.log('Fallback beep failed:', e));
        } catch (e) {
            console.log('All sound methods failed:', e);
        }
    }
    
    async testSound() {
        // Initialize audio context on user interaction
        await this.initializeAudio();
        
        const soundType = document.getElementById('reminder-sound')?.value || 'default';
        const customSoundFile = document.getElementById('custom-sound')?.files[0];
        
        console.log('Testing sound:', soundType);
        
        if (soundType === 'custom' && customSoundFile) {
            try {
                const audio = new Audio(URL.createObjectURL(customSoundFile));
                audio.volume = 0.5;
                await audio.play();
                console.log('Custom sound played successfully');
            } catch (e) {
                console.log('Could not play custom sound:', e);
                await this.playDefaultBeep();
            }
        } else {
            await this.playDefaultBeep();
        }
    }
    
    async initializeAudio() {
        try {
            if (!window.audioContext) {
                window.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            if (window.audioContext.state === 'suspended') {
                await window.audioContext.resume();
                console.log('Audio context resumed');
            }
        } catch (e) {
            console.log('Audio initialization failed:', e);
        }
    }
    
    setLoadingState(loading) {
        this.isLoading = loading;
        const submitBtn = document.querySelector('#reminder-form button[type="submit"]');
        const loader = submitBtn?.querySelector('.btn-loader');
        const btnText = submitBtn?.querySelector('span');
        
        if (submitBtn) {
            submitBtn.disabled = loading;
            if (loading) {
                submitBtn.classList.add('loading');
                if (loader) loader.classList.remove('hidden');
                if (btnText) btnText.style.opacity = '0.7';
            } else {
                submitBtn.classList.remove('loading');
                if (loader) loader.classList.add('hidden');
                if (btnText) btnText.style.opacity = '1';
            }
        }
    }
    
    showFormError(message) {
        // Remove existing error
        const existingError = document.querySelector('.form-error');
        if (existingError) {
            existingError.remove();
        }

        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error';
        errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
        errorDiv.style.cssText = `
            color: var(--error-color);
            background: rgba(239, 68, 68, 0.1);
            padding: 1rem;
            border-radius: var(--radius-md);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border: 1px solid rgba(239, 68, 68, 0.2);
            animation: slideIn 0.3s ease-out;
        `;

        // Add to form
        const form = document.getElementById('reminder-form');
        if (form) {
            form.insertBefore(errorDiv, form.firstChild);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.remove();
                }
            }, 5000);
        }
    }
    
    showSuccessToast(message) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
        toast.style.cssText = `
            position: fixed;
            top: 90px;
            right: 20px;
            background: var(--success-color);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-lg);
            box-shadow: var(--shadow-lg);
            z-index: 3000;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 500;
            transform: translateX(400px);
            transition: transform 0.3s ease;
        `;

        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 3000);
    }
    
    getCurrentReminder() {
        if (!this.currentEditId) return null;
        return this.reminders.find(r => r.id === this.currentEditId);
    }
    
    addQuickTestButton() {
        // Add a quick test button for development
        const testBtn = document.createElement('button');
        testBtn.textContent = '🔔 Test Sound Now';
        testBtn.className = 'btn btn-secondary btn-small';
        testBtn.style.cssText = 'position: fixed; top: 100px; right: 20px; z-index: 1000;';
        testBtn.onclick = () => this.createTestReminder();
        document.body.appendChild(testBtn);
    }
    
    createTestReminder() {
        const testReminder = {
            id: 'test-' + Date.now(),
            title: 'Test Reminder',
            description: 'This is a test reminder to check sound',
            datetime: new Date(Date.now() + 5000).toISOString(), // 5 seconds from now
            priority: 'high',
            category: 'personal',
            soundType: 'default',
            userId: window.authManager.currentUser.id,
            createdAt: new Date().toISOString(),
            isActive: true,
            completed: false
        };
        
        this.reminders.push(testReminder);
        this.storeReminders();
        this.updateStats();
        
        if (window.dashboardManager) {
            window.dashboardManager.refreshCurrentView();
        }
        
        this.showSuccessToast('Test reminder created! Will trigger in 5 seconds.');
        console.log('Test reminder created:', testReminder);
    }
}

// Initialize reminder manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.authManager && window.authManager.isLoggedIn()) {
        window.reminderManager = new ReminderManager();
    }
});

// Add keyboard shortcut for new reminder
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && window.reminderManager) {
        e.preventDefault();
        window.reminderManager.openModal();
    }
});