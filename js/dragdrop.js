// Drag & Drop Functionality
class DragDropManager {
    constructor() {
        this.draggedElement = null;
        this.init();
    }

    init() {
        this.addEventListeners();
    }

    addEventListeners() {
        document.addEventListener('dragstart', (e) => this.handleDragStart(e));
        document.addEventListener('dragover', (e) => this.handleDragOver(e));
        document.addEventListener('drop', (e) => this.handleDrop(e));
        document.addEventListener('dragend', (e) => this.handleDragEnd(e));
    }

    makeDraggable(element, reminderId) {
        element.draggable = true;
        element.dataset.reminderId = reminderId;
        element.classList.add('draggable');
    }

    handleDragStart(e) {
        if (!e.target.classList.contains('draggable')) return;
        
        this.draggedElement = e.target;
        e.target.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.outerHTML);
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const dropZone = e.target.closest('.reminder-item, .calendar-day');
        if (dropZone && dropZone !== this.draggedElement) {
            dropZone.classList.add('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        
        const dropZone = e.target.closest('.reminder-item, .calendar-day');
        if (!dropZone || dropZone === this.draggedElement) return;

        const draggedId = this.draggedElement.dataset.reminderId;
        
        if (dropZone.classList.contains('calendar-day')) {
            this.moveToCalendarDay(draggedId, dropZone);
        } else if (dropZone.classList.contains('reminder-item')) {
            this.reorderReminders(draggedId, dropZone.dataset.reminderId);
        }
        
        this.clearDragStyles();
    }

    handleDragEnd(e) {
        this.clearDragStyles();
    }

    clearDragStyles() {
        document.querySelectorAll('.dragging, .drag-over').forEach(el => {
            el.classList.remove('dragging', 'drag-over');
        });
        this.draggedElement = null;
    }

    moveToCalendarDay(reminderId, dayElement) {
        if (!window.reminderManager) return;
        
        const reminder = window.reminderManager.reminders.find(r => r.id === reminderId);
        if (!reminder) return;

        const dayNumber = dayElement.querySelector('.calendar-day-number').textContent;
        const currentDate = new Date(reminder.datetime);
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), parseInt(dayNumber));
        
        reminder.datetime = newDate.toISOString();
        window.reminderManager.storeReminders();
        window.dashboardManager?.refreshCurrentView();
    }

    reorderReminders(draggedId, targetId) {
        if (!window.reminderManager) return;
        
        const reminders = window.reminderManager.reminders;
        const draggedIndex = reminders.findIndex(r => r.id === draggedId);
        const targetIndex = reminders.findIndex(r => r.id === targetId);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        const [draggedReminder] = reminders.splice(draggedIndex, 1);
        reminders.splice(targetIndex, 0, draggedReminder);
        
        window.reminderManager.storeReminders();
        window.dashboardManager?.refreshCurrentView();
    }
}

// Initialize drag & drop
document.addEventListener('DOMContentLoaded', () => {
    window.dragDropManager = new DragDropManager();
});