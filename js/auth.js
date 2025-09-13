// Enhanced Authentication Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.isLoading = false;
        this.init();
    }

    init() {
        // Check if user is logged in
        this.currentUser = this.getCurrentUser();
        
        // Add event listeners first
        this.addEventListeners();
        
        // Initialize UI enhancements
        this.initializeUIEnhancements();
        
        // Update UI
        this.updateUI();
        
        // Handle page access after a short delay to ensure DOM is ready
        setTimeout(() => this.handlePageAccess(), 100);
        
        // Add keyboard shortcuts
        this.addKeyboardShortcuts();
    }
    
    initializeUIEnhancements() {
        // Password toggle functionality
        this.initPasswordToggle();
        
        // Password strength meter
        this.initPasswordStrength();
        
        // Form animations
        this.initFormAnimations();
        
        // Input focus effects
        this.initInputEffects();
    }

    addEventListeners() {
        console.log('Adding event listeners');
        
        // Login form
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            console.log('Login form found, adding listener');
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            console.log('Register form found, adding listener');
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            console.log('Logout button found, adding listener');
            logoutBtn.addEventListener('click', () => this.logout());
        }
        
        // Test user button
        const testUserBtn = document.getElementById('create-test-user');
        if (testUserBtn) {
            console.log('Test user button found, adding listener');
            testUserBtn.addEventListener('click', () => this.createTestUser());
        }
        
        // Remember me functionality
        const rememberMe = document.getElementById('remember-me');
        if (rememberMe) {
            const savedUsername = localStorage.getItem('rememberedUsername');
            if (savedUsername) {
                const usernameField = document.getElementById('username');
                if (usernameField) {
                    usernameField.value = savedUsername;
                    rememberMe.checked = true;
                }
            }
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        console.log('Login form submitted');
        
        if (this.isLoading) return;
        
        const username = document.getElementById('username')?.value?.trim();
        const password = document.getElementById('password')?.value;
        const rememberMe = document.getElementById('remember-me')?.checked;

        console.log('Login attempt:', { username, password: password ? '***' : 'empty' });

        if (!username || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        
        // Simulate network delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));

        // Get stored users
        const users = this.getStoredUsers();
        console.log('Stored users:', users.length);
        
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            console.log('Login successful');
            
            // Handle remember me
            if (rememberMe) {
                localStorage.setItem('rememberedUsername', username);
            } else {
                localStorage.removeItem('rememberedUsername');
            }
            
            this.setCurrentUser(user);
            this.showSuccess('Login successful! Redirecting...');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            console.log('Login failed');
            this.setLoadingState(false);
            this.showError('Invalid username or password');
            this.shakeForm();
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        console.log('Register form submitted');
        
        if (this.isLoading) return;
        
        const username = document.getElementById('username')?.value?.trim();
        const email = document.getElementById('email')?.value?.trim();
        const password = document.getElementById('password')?.value;
        const termsAccepted = document.getElementById('terms')?.checked;

        console.log('Registration attempt:', { username, email, password: password ? '***' : 'empty' });

        if (!username || !email || !password) {
            this.showError('Please fill in all fields');
            return;
        }
        
        if (!termsAccepted) {
            this.showError('Please accept the terms of service');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }
        
        if (!this.isValidEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }

        // Show loading state
        this.setLoadingState(true);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check if user already exists
        const users = this.getStoredUsers();
        console.log('Existing users:', users.length);
        
        if (users.find(u => u.username === username)) {
            this.setLoadingState(false);
            this.showError('Username already exists');
            this.shakeForm();
            return;
        }

        if (users.find(u => u.email === email)) {
            this.setLoadingState(false);
            this.showError('Email already registered');
            this.shakeForm();
            return;
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            username,
            email,
            password,
            createdAt: new Date().toISOString(),
            preferences: {
                theme: 'light',
                notifications: true,
                soundEnabled: true
            }
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        console.log('User registered successfully:', newUser.username);
        
        this.setCurrentUser(newUser);
        this.showSuccess('Account created successfully! Redirecting...');
        
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }

    logout() {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userSession');
        localStorage.removeItem('backgroundReminders');
        this.currentUser = null;
        
        // Clear any scheduled notifications
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
                registration.active.postMessage({
                    type: 'CLEAR_NOTIFICATIONS'
                });
            });
        }
        
        window.location.href = 'index.html';
    }

    getStoredUsers() {
        return JSON.parse(localStorage.getItem('users') || '[]');
    }

    getCurrentUser() {
        try {
            const stored = localStorage.getItem('currentUser');
            if (!stored) return null;
            
            const userData = JSON.parse(stored);
            
            // Handle old format without timestamp
            if (!userData.timestamp) {
                const newUserData = {
                    user: userData,
                    timestamp: Date.now(),
                    expires: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
                };
                localStorage.setItem('currentUser', JSON.stringify(newUserData));
                return userData;
            }
            
            // Check if session expired (1 year)
            if (Date.now() > userData.expires) {
                console.log('Session expired, logging out');
                this.logout();
                return null;
            }
            
            // Extend session on activity
            userData.expires = Date.now() + (365 * 24 * 60 * 60 * 1000);
            localStorage.setItem('currentUser', JSON.stringify(userData));
            
            return userData.user;
        } catch (e) {
            console.log('Error getting current user:', e);
            return null;
        }
    }

    setCurrentUser(user) {
        this.currentUser = user;
        const userData = {
            user: user,
            timestamp: Date.now(),
            expires: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
        };
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Store user session persistently
        localStorage.setItem('userSession', JSON.stringify({
            userId: user.id,
            username: user.username,
            loginTime: Date.now()
        }));
    }

    isLoggedIn() {
        const isLoggedInFlag = localStorage.getItem('isLoggedIn');
        const currentUser = this.getCurrentUser();
        return isLoggedInFlag === 'true' && currentUser !== null;
    }

    handlePageAccess() {
        const currentPage = window.location.pathname.split('/').pop() || window.location.href.split('/').pop();
        console.log('Current page:', currentPage, 'Logged in:', this.isLoggedIn());
        
        // Redirect to dashboard if logged in and on auth pages
        if (this.isLoggedIn() && (currentPage === 'login.html' || currentPage === 'register.html')) {
            console.log('Redirecting logged in user to dashboard');
            window.location.href = 'dashboard.html';
        }
        
        // Redirect to login if not logged in and on dashboard
        if (!this.isLoggedIn() && currentPage === 'dashboard.html') {
            console.log('Redirecting non-logged in user to login');
            window.location.href = 'login.html';
        }
    }

    updateUI() {
        const userNameElement = document.getElementById('user-name');
        if (userNameElement && this.currentUser) {
            userNameElement.textContent = `Welcome, ${this.currentUser.username}`;
        }
        
        // Add debug info
        const debugElement = document.getElementById('debug-info');
        if (debugElement) {
            const users = this.getStoredUsers();
            debugElement.innerHTML = `
                <p>Debug Info:</p>
                <p>Users in storage: ${users.length}</p>
                <p>Current user: ${this.currentUser ? this.currentUser.username : 'None'}</p>
                <p>LocalStorage available: ${typeof(Storage) !== "undefined"}</p>
            `;
        }
    }

    createTestUser() {
        console.log('Creating test user');
        const testUser = {
            id: 'test-user-123',
            username: 'test',
            email: 'test@example.com',
            password: 'test123',
            createdAt: new Date().toISOString(),
            preferences: {
                theme: 'light',
                notifications: true,
                soundEnabled: true
            }
        };
        
        const users = this.getStoredUsers();
        // Remove existing test user if any
        const filteredUsers = users.filter(u => u.username !== 'test');
        filteredUsers.push(testUser);
        
        localStorage.setItem('users', JSON.stringify(filteredUsers));
        console.log('Test user created. Username: test, Password: test123');
        
        // Fill form with test credentials
        const usernameField = document.getElementById('username');
        const passwordField = document.getElementById('password');
        if (usernameField && passwordField) {
            usernameField.value = 'test';
            passwordField.value = 'test123';
            
            // Trigger input events for validation
            usernameField.dispatchEvent(new Event('input'));
            passwordField.dispatchEvent(new Event('input'));
        }
        
        this.showSuccess('Test user created! Username: test, Password: test123');
        this.updateUI();
    }
    
    setLoadingState(loading) {
        this.isLoading = loading;
        const submitBtn = document.querySelector('button[type="submit"]');
        const loader = document.querySelector('.btn-loader');
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
    
    shakeForm() {
        const form = document.querySelector('.auth-card');
        if (form) {
            form.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                form.style.animation = '';
            }, 500);
        }
    }
    
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    initPasswordToggle() {
        const passwordToggles = document.querySelectorAll('.password-toggle');
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const passwordInput = toggle.parentElement.querySelector('input');
                const icon = toggle.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        });
    }
    
    initPasswordStrength() {
        const passwordInput = document.getElementById('password');
        const strengthBar = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        if (passwordInput && strengthBar && strengthText) {
            passwordInput.addEventListener('input', (e) => {
                const password = e.target.value;
                const strength = this.calculatePasswordStrength(password);
                
                strengthBar.style.width = `${strength.percentage}%`;
                strengthText.textContent = strength.text;
                strengthText.style.color = strength.color;
            });
        }
    }
    
    calculatePasswordStrength(password) {
        let score = 0;
        let feedback = [];
        
        if (password.length >= 8) score += 25;
        else feedback.push('at least 8 characters');
        
        if (/[a-z]/.test(password)) score += 25;
        else feedback.push('lowercase letter');
        
        if (/[A-Z]/.test(password)) score += 25;
        else feedback.push('uppercase letter');
        
        if (/[0-9]/.test(password)) score += 25;
        else feedback.push('number');
        
        if (/[^A-Za-z0-9]/.test(password)) score += 10;
        
        let text, color;
        if (score < 30) {
            text = 'Weak';
            color = '#ef4444';
        } else if (score < 60) {
            text = 'Fair';
            color = '#f59e0b';
        } else if (score < 90) {
            text = 'Good';
            color = '#06b6d4';
        } else {
            text = 'Strong';
            color = '#10b981';
        }
        
        return { percentage: Math.min(score, 100), text, color };
    }
    
    initFormAnimations() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });
            
            input.addEventListener('blur', () => {
                if (!input.value) {
                    input.parentElement.classList.remove('focused');
                }
            });
        });
    }
    
    initInputEffects() {
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                if (input.value) {
                    input.classList.add('has-value');
                } else {
                    input.classList.remove('has-value');
                }
            });
        });
    }
    
    addKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Alt + L for login page
            if (e.altKey && e.key === 'l') {
                e.preventDefault();
                window.location.href = 'login.html';
            }
            
            // Alt + R for register page
            if (e.altKey && e.key === 'r') {
                e.preventDefault();
                window.location.href = 'register.html';
            }
            
            // Alt + H for home page
            if (e.altKey && e.key === 'h') {
                e.preventDefault();
                window.location.href = 'index.html';
            }
        });
    }

    showSuccess(message) {
        console.log('Showing success:', message);
        
        // Remove existing messages
        const existingError = document.querySelector('.error, .success');
        if (existingError) {
            existingError.remove();
        }

        // Create success element
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;

        // Add to form
        const form = document.querySelector('form');
        if (form) {
            form.appendChild(successDiv);
        }
    }

    showError(message) {
        console.log('Showing error:', message);
        
        // Remove existing error
        const existingError = document.querySelector('.error, .success');
        if (existingError) {
            existingError.remove();
        }

        // Create error element
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;

        // Add to form
        const form = document.querySelector('form');
        if (form) {
            form.appendChild(errorDiv);
        }
    }
}

// Initialize auth manager when DOM is loaded
function initAuth() {
    console.log('Initializing AuthManager');
    window.authManager = new AuthManager();
}

// Multiple initialization methods to ensure it works
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
} else {
    initAuth();
}

// Fallback initialization
window.addEventListener('load', () => {
    if (!window.authManager) {
        console.log('Fallback auth initialization');
        initAuth();
    }
});