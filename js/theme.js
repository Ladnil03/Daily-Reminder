// Enhanced Theme Management
class ThemeManager {
    constructor() {
        this.init();
    }

    init() {
        // Load saved theme or detect system preference
        const savedTheme = localStorage.getItem('theme');
        const systemTheme = this.getSystemTheme();
        const initialTheme = savedTheme || systemTheme;
        
        this.setTheme(initialTheme);
        
        // Add event listener to theme toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Listen for system theme changes
        this.watchSystemTheme();
    }

    getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    watchSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually set a preference
                if (!localStorage.getItem('theme')) {
                    this.setTheme(e.matches ? 'dark' : 'light');
                }
            });
        }
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        // Update toggle button icon
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            } else {
                // Fallback for emoji-based buttons
                themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
            }
        }
        
        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.content = theme === 'dark' ? '#1f2937' : '#6366f1';
        }
        
        // Dispatch theme change event
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
        
        // Add transition class to body for smooth theme switching
        document.body.classList.add('theme-transitioning');
        setTimeout(() => {
            document.body.classList.remove('theme-transitioning');
        }, 300);
    }

    toggleTheme() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
        
        // Add a subtle animation to the toggle button
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.style.transform = 'scale(0.9) rotate(180deg)';
            setTimeout(() => {
                themeToggle.style.transform = '';
            }, 200);
        }
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }
    
    // Auto theme switching based on time
    enableAutoTheme() {
        const hour = new Date().getHours();
        const shouldBeDark = hour < 6 || hour >= 18; // Dark from 6 PM to 6 AM
        this.setTheme(shouldBeDark ? 'dark' : 'light');
    }
    
    // Reset to system theme
    resetToSystemTheme() {
        localStorage.removeItem('theme');
        this.setTheme(this.getSystemTheme());
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.themeManager = new ThemeManager();
});

// Add CSS for smooth theme transitions
const themeTransitionCSS = `
    .theme-transitioning,
    .theme-transitioning *,
    .theme-transitioning *:before,
    .theme-transitioning *:after {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        transition-delay: 0 !important;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = themeTransitionCSS;
document.head.appendChild(styleSheet);