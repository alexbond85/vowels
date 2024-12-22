export class FormantAnalyzer {
    constructor(sampleRate = 44100) {
        this.sampleRate = sampleRate;
        // Use a smaller smoothing factor for more responsive updates
        this.smoothingFactor = 0.5;
        this.prevF1 = null;
        this.prevF2 = null;
    }

    computeFormants(frequencyData) {
        if (!frequencyData) return [0, 0];

        // Convert from dB to linear scale and normalize
        const spectrum = this.normalizeSpectrum(frequencyData);

        // Find formant peaks
        const f1 = this.findFormantInRange(spectrum, 200, 900);
        const f2 = this.findFormantInRange(spectrum, 750, 2600);

        // Apply lighter temporal smoothing for more responsive updates
        const smoothedF1 = this.smoothValue(f1, this.prevF1);
        const smoothedF2 = this.smoothValue(f2, this.prevF2);

        // Store current values for next frame
        this.prevF1 = smoothedF1;
        this.prevF2 = smoothedF2;

        return [smoothedF1, smoothedF2];
    }

    normalizeSpectrum(frequencyData) {
        const spectrum = new Float32Array(frequencyData.length);
        let maxVal = -Infinity;
        let minVal = Infinity;

        // Find min and max values
        for (let i = 0; i < frequencyData.length; i++) {
            const value = Math.pow(10, frequencyData[i] / 20);
            maxVal = Math.max(maxVal, value);
            minVal = Math.min(minVal, value);
        }

        // Normalize with improved dynamic range
        const range = maxVal - minVal;
        if (range > 0) {
            for (let i = 0; i < frequencyData.length; i++) {
                const value = Math.pow(10, frequencyData[i] / 20);
                spectrum[i] = (value - minVal) / range;
            }
        }

        return spectrum;
    }

    findFormantInRange(spectrum, minFreq, maxFreq) {
        const minBin = Math.floor((minFreq * spectrum.length * 2) / this.sampleRate);
        const maxBin = Math.ceil((maxFreq * spectrum.length * 2) / this.sampleRate);

        let maxVal = -Infinity;
        let peakBin = -1;

        // Find the highest peak in the range
        for (let i = minBin; i < maxBin; i++) {
            if (spectrum[i] > maxVal &&
                i > 0 && i < spectrum.length - 1 &&
                spectrum[i] > spectrum[i - 1] &&
                spectrum[i] > spectrum[i + 1]) {
                maxVal = spectrum[i];
                peakBin = i;
            }
        }

        if (peakBin !== -1) {
            return (peakBin * this.sampleRate) / (spectrum.length * 2);
        }

        return this.prevF1 || 0; // Return previous value if no peak found
    }

    smoothValue(current, previous) {
        if (previous === null) return current;
        return this.smoothingFactor * previous + (1 - this.smoothingFactor) * current;
    }
}