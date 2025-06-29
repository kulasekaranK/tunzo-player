export declare class ThemeManager {
    private static readonly key;
    private static readonly darkClass;
    /**
     * Initializes the theme based on system preference or stored value
     */
    static initialize(): void;
    /**
     * Applies dark/light theme class
     * @param shouldAdd Whether to add dark class
     */
    static apply(shouldAdd: boolean): void;
    /**
     * Toggles current theme between light and dark
     */
    static toggle(): void;
    /**
     * Returns current theme value
     */
    static getCurrent(): 'light' | 'dark';
    /**
     * Returns true if dark mode is active
     */
    static isDark(): boolean;
}
