export interface StreamQuality {
    value: number;
    label: string;
  }
  
  export class StreamSettings {
    // All available stream quality options
    static readonly qualityOptions: StreamQuality[] = [
      { value: 0, label: 'Very Low (12kbps)' },
      { value: 1, label: 'Low (48kbps)' },
      { value: 2, label: 'Medium (96kbps)' },
      { value: 3, label: 'High (160kbps)' },
      { value: 4, label: 'Ultra (320kbps)' },
    ];
  
    static readonly qualityValueKey = 'qualityValue';
    static readonly qualityLabelKey = 'qualityLabel';
  
    /**
     * Loads stream quality from localStorage
     */
    static loadQuality(): StreamQuality {
      const value = parseInt(localStorage.getItem(this.qualityValueKey) || '3');
      const label =
        localStorage.getItem(this.qualityLabelKey) ||
        this.qualityOptions.find(q => q.value === value)?.label ||
        'High (160kbps)';
  
      return { value, label };
    }
  
    /**
     * Saves stream quality to localStorage
     * @param value Index of quality option
     * @param label Display label of selected quality
     */
    static saveQuality(value: number, label: string) {
      localStorage.setItem(this.qualityValueKey, value.toString());
      localStorage.setItem(this.qualityLabelKey, label);
    }
  
    /**
     * Updates quality using value index only
     * @param value Stream quality index (0 to 4)
     */
    static updateQuality(value: number): StreamQuality {
      const quality = this.qualityOptions.find(q => q.value === value);
      if (!quality) throw new Error('Invalid quality value');
  
      this.saveQuality(quality.value, quality.label);
      return quality;
    }
  
    /**
     * Returns the label for a given value
     * @param value Quality value index
     */
    static getLabel(value: number): string {
      return this.qualityOptions.find(q => q.value === value)?.label || '';
    }
  
    /**
     * Returns the available quality options
     */
    static getOptions(): StreamQuality[] {
      return this.qualityOptions;
    }
  }
  