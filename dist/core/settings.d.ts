export interface StreamQuality {
    value: number;
    label: string;
}
export declare class StreamSettings {
    static readonly qualityOptions: StreamQuality[];
    static readonly qualityValueKey = "qualityValue";
    static readonly qualityLabelKey = "qualityLabel";
    /**
     * Loads stream quality from localStorage
     */
    static loadQuality(): StreamQuality;
    /**
     * Saves stream quality to localStorage
     * @param value Index of quality option
     * @param label Display label of selected quality
     */
    static saveQuality(value: number, label: string): void;
    /**
     * Updates quality using value index only
     * @param value Stream quality index (0 to 4)
     */
    static updateQuality(value: number): StreamQuality;
    /**
     * Returns the label for a given value
     * @param value Quality value index
     */
    static getLabel(value: number): string;
    /**
     * Returns the available quality options
     */
    static getOptions(): StreamQuality[];
}
