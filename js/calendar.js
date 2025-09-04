// Calendar Utility Functions
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.init();
    }

    init() {
        this.addEventListeners();
    }

    addEventListeners() {
        // Calendar day clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('calendar-day') && !e.target.classList.contains('other-month')) {
                this.selectDate(e.target);
            }
        });

        // Calendar reminder clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('calendar-reminder')) {
                e.stopPropagation();
                this.showReminderDetails(e.target);
            }
        });
    }

    selectDate(dayElement) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day.selected').forEach(day => {
            day.classList.remove('selected');
        });

        // Add selection to clicked day
        dayElement.classList.add('selected');
        
        const dayNumber = parseInt(dayElement.querySelector('.calendar-day-number').textContent);
        this.selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), dayNumber);
        
        // Show reminders for selected date
        this.showDateReminders(this.selectedDate);
    }

    showDateReminders(date) {
        if (!window.reminderManager) return;

        const reminders = window.reminderManager.reminders.filter(reminder => {
            const reminderDate = new Date(reminder.datetime);
            return reminderDate.toDateString() === date.toDateString();
        });

        // You could show these in a sidebar or modal
        console.log(`Reminders for ${date.toDateString()}:`, reminders);
    }

    showReminderDetails(reminderElement) {
        const title = reminderElement.textContent;
        // Find the full reminder by title (this is a simplified approach)
        if (window.reminderManager) {
            const reminder = window.reminderManager.reminders.find(r => 
                r.title.startsWith(title.replace('...', ''))
            );
            if (reminder) {
                window.reminderManager.openModal(reminder);
            }
        }
    }

    navigateToDate(date) {
        this.currentDate = new Date(date);
        if (window.dashboardManager) {
            window.dashboardManager.currentCalendarDate = this.currentDate;
            window.dashboardManager.renderCalendar();
        }
    }

    goToToday() {
        this.navigateToDate(new Date());
    }

    addReminderToDate(date) {
        if (window.reminderManager) {
            // Pre-fill the date in the modal
            const modal = document.getElementById('reminder-modal');
            const dateInput = document.getElementById('reminder-datetime');
            
            if (dateInput) {
                const isoString = date.toISOString().slice(0, 16);
                dateInput.value = isoString;
            }
            
            window.reminderManager.openModal();
        }
    }

    getCalendarEvents(year, month) {
        if (!window.reminderManager) return [];

        return window.reminderManager.reminders.filter(reminder => {
            const reminderDate = new Date(reminder.datetime);
            return reminderDate.getFullYear() === year && reminderDate.getMonth() === month;
        }).map(reminder => ({
            id: reminder.id,
            title: reminder.title,
            date: new Date(reminder.datetime),
            completed: reminder.completed,
            priority: reminder.priority || 'medium',
            category: reminder.category || 'personal'
        }));
    }

    exportCalendar(format = 'ics') {
        if (!window.reminderManager) return;

        const reminders = window.reminderManager.reminders;
        
        if (format === 'ics') {
            this.exportToICS(reminders);
        } else if (format === 'json') {
            this.exportToJSON(reminders);
        }
    }

    exportToICS(reminders) {
        let icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Daily Reminder//Daily Reminder App//EN',
            'CALSCALE:GREGORIAN'
        ];

        reminders.forEach(reminder => {
            const startDate = new Date(reminder.datetime);
            const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration
            
            icsContent.push(
                'BEGIN:VEVENT',
                `UID:${reminder.id}@dailyreminder.app`,
                `DTSTART:${this.formatDateForICS(startDate)}`,
                `DTEND:${this.formatDateForICS(endDate)}`,
                `SUMMARY:${reminder.title}`,
                `DESCRIPTION:${reminder.description || ''}`,
                `STATUS:${reminder.completed ? 'COMPLETED' : 'CONFIRMED'}`,
                'END:VEVENT'
            );
        });

        icsContent.push('END:VCALENDAR');

        this.downloadFile(icsContent.join('\r\n'), 'daily-reminders.ics', 'text/calendar');
    }

    exportToJSON(reminders) {
        const jsonContent = JSON.stringify(reminders, null, 2);
        this.downloadFile(jsonContent, 'daily-reminders.json', 'application/json');
    }

    formatDateForICS(date) {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    importCalendar(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            
            if (file.name.endsWith('.ics')) {
                this.importFromICS(content);
            } else if (file.name.endsWith('.json')) {
                this.importFromJSON(content);
            }
        };
        reader.readAsText(file);
    }

    importFromICS(icsContent) {
        // Basic ICS parsing (simplified)
        const lines = icsContent.split('\n');
        let currentEvent = null;
        const events = [];

        lines.forEach(line => {
            line = line.trim();
            
            if (line === 'BEGIN:VEVENT') {
                currentEvent = {};
            } else if (line === 'END:VEVENT' && currentEvent) {
                events.push(currentEvent);
                currentEvent = null;
            } else if (currentEvent) {
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':');
                
                switch (key) {
                    case 'SUMMARY':
                        currentEvent.title = value;
                        break;
                    case 'DESCRIPTION':
                        currentEvent.description = value;
                        break;
                    case 'DTSTART':
                        currentEvent.datetime = this.parseICSDate(value);
                        break;
                }
            }
        });

        // Add imported events as reminders
        if (window.reminderManager) {
            events.forEach(event => {
                if (event.title && event.datetime) {
                    const reminder = {
                        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                        title: event.title,
                        description: event.description || '',
                        datetime: event.datetime,
                        priority: 'medium',
                        category: 'other',
                        soundType: 'default',
                        userId: window.authManager.currentUser.id,
                        createdAt: new Date().toISOString(),
                        isActive: true
                    };
                    
                    window.reminderManager.reminders.push(reminder);
                }
            });
            
            window.reminderManager.storeReminders();
            window.reminderManager.renderReminders();
            window.reminderManager.updateStats();
        }
    }

    importFromJSON(jsonContent) {
        try {
            const reminders = JSON.parse(jsonContent);
            
            if (Array.isArray(reminders) && window.reminderManager) {
                reminders.forEach(reminder => {
                    if (reminder.title && reminder.datetime) {
                        reminder.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
                        reminder.userId = window.authManager.currentUser.id;
                        window.reminderManager.reminders.push(reminder);
                    }
                });
                
                window.reminderManager.storeReminders();
                window.reminderManager.renderReminders();
                window.reminderManager.updateStats();
            }
        } catch (error) {
            console.error('Error importing JSON:', error);
        }
    }

    parseICSDate(icsDate) {
        // Parse ICS date format (YYYYMMDDTHHMMSSZ)
        const year = parseInt(icsDate.substr(0, 4));
        const month = parseInt(icsDate.substr(4, 2)) - 1; // Month is 0-indexed
        const day = parseInt(icsDate.substr(6, 2));
        const hour = parseInt(icsDate.substr(9, 2));
        const minute = parseInt(icsDate.substr(11, 2));
        const second = parseInt(icsDate.substr(13, 2));
        
        return new Date(year, month, day, hour, minute, second).toISOString();
    }
}

// Initialize calendar manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.authManager && window.authManager.isLoggedIn()) {
        window.calendarManager = new CalendarManager();
    }
});