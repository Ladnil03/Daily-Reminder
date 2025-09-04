// Contact form management
class ContactManager {
    constructor() {
        this.init();
    }

    init() {
        this.addEventListeners();
    }

    addEventListeners() {
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    handleSubmit(e) {
        e.preventDefault();

        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const subject = document.getElementById('subject').value.trim();
        const message = document.getElementById('message').value.trim();

        if (!name || !email || !subject || !message) {
            this.showMessage('Please fill in all fields', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showMessage('Please enter a valid email address', 'error');
            return;
        }

        // Simulate form submission (since we don't have a backend)
        this.simulateSubmission({ name, email, subject, message });
    }

    simulateSubmission(formData) {
        // Store message locally for demo purposes
        const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
        const newMessage = {
            id: Date.now().toString(),
            ...formData,
            timestamp: new Date().toISOString()
        };
        
        messages.push(newMessage);
        localStorage.setItem('contactMessages', JSON.stringify(messages));

        // Show success message
        this.showMessage('Thank you for your message! We\'ll get back to you soon.', 'success');
        
        // Reset form
        document.getElementById('contact-form').reset();
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showMessage(text, type) {
        // Remove existing message
        const existingMessage = document.querySelector('.form-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `form-message ${type}`;
        messageDiv.textContent = text;

        // Add styles
        messageDiv.style.cssText = `
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
            text-align: center;
            font-weight: bold;
            ${type === 'success' 
                ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;'
                : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
            }
        `;

        // Insert before form
        const form = document.getElementById('contact-form');
        form.parentNode.insertBefore(messageDiv, form);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);
    }
}

// Initialize contact manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.contactManager = new ContactManager();
});