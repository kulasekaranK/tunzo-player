"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamSettings = void 0;
class StreamSettings {
    /**
     * Loads stream quality from localStorage
     */
    static loadQuality() {
        var _a;
        const value = parseInt(localStorage.getItem(this.qualityValueKey) || '3');
        const label = localStorage.getItem(this.qualityLabelKey) ||
            ((_a = this.qualityOptions.find(q => q.value === value)) === null || _a === void 0 ? void 0 : _a.label) ||
            'High (160kbps)';
        return { value, label };
    }
    /**
     * Saves stream quality to localStorage
     * @param value Index of quality option
     * @param label Display label of selected quality
     */
    static saveQuality(value, label) {
        localStorage.setItem(this.qualityValueKey, value.toString());
        localStorage.setItem(this.qualityLabelKey, label);
    }
    /**
     * Updates quality using value index only
     * @param value Stream quality index (0 to 4)
     */
    static updateQuality(value) {
        const quality = this.qualityOptions.find(q => q.value === value);
        if (!quality)
            throw new Error('Invalid quality value');
        this.saveQuality(quality.value, quality.label);
        return quality;
    }
    /**
     * Returns the label for a given value
     * @param value Quality value index
     */
    static getLabel(value) {
        var _a;
        return ((_a = this.qualityOptions.find(q => q.value === value)) === null || _a === void 0 ? void 0 : _a.label) || '';
    }
    /**
     * Returns the available quality options
     */
    static getOptions() {
        return this.qualityOptions;
    }
}
exports.StreamSettings = StreamSettings;
// All available stream quality options
StreamSettings.qualityOptions = [
    { value: 0, label: 'Very Low (12kbps)' },
    { value: 1, label: 'Low (48kbps)' },
    { value: 2, label: 'Medium (96kbps)' },
    { value: 3, label: 'High (160kbps)' },
    { value: 4, label: 'Ultra (320kbps)' },
];
StreamSettings.qualityValueKey = 'qualityValue';
StreamSettings.qualityLabelKey = 'qualityLabel';
