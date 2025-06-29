"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThemeManager = void 0;
class ThemeManager {
    /**
     * Initializes the theme based on system preference or stored value
     */
    static initialize() {
        const stored = localStorage.getItem(this.key);
        if (stored !== null) {
            const shouldAdd = stored === 'dark';
            this.apply(shouldAdd);
        }
        else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
            this.apply(prefersDark.matches);
            // Save for future
            localStorage.setItem(this.key, prefersDark.matches ? 'dark' : 'light');
        }
        // Optional: listen to system change
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
            this.apply(event.matches);
            localStorage.setItem(this.key, event.matches ? 'dark' : 'light');
        });
    }
    /**
     * Applies dark/light theme class
     * @param shouldAdd Whether to add dark class
     */
    static apply(shouldAdd) {
        document.documentElement.classList.toggle(this.darkClass, shouldAdd);
    }
    /**
     * Toggles current theme between light and dark
     */
    static toggle() {
        const isDark = document.documentElement.classList.contains(this.darkClass);
        const newMode = isDark ? 'light' : 'dark';
        this.apply(!isDark);
        localStorage.setItem(this.key, newMode);
    }
    /**
     * Returns current theme value
     */
    static getCurrent() {
        return document.documentElement.classList.contains(this.darkClass) ? 'dark' : 'light';
    }
    /**
     * Returns true if dark mode is active
     */
    static isDark() {
        return this.getCurrent() === 'dark';
    }
}
exports.ThemeManager = ThemeManager;
ThemeManager.key = 'themePalette'; // localStorage key
ThemeManager.darkClass = 'ion-palette-dark'; // CSS class to toggle
