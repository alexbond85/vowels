export class FormantAnalyzer {
    constructor(sampleRate = 44100) {
        this.sampleRate = sampleRate;
    }

    computeFormants(frequencyData) {
        const nyquist = this.sampleRate / 2;
        const binSize = nyquist / frequencyData.length;

        // Debug log the signal strength
        const avgPower = frequencyData.reduce((sum, val) => sum + val, 0) / frequencyData.length;
        console.log("Average power:", avgPower);

        // Convert to power spectrum
        const powerSpectrum = new Float32Array(frequencyData.length);
        for (let i = 0; i < frequencyData.length; i++) {
            powerSpectrum[i] = Math.pow(10, frequencyData[i] / 20);
        }

        // Find peaks in specific frequency ranges
        const f1Range = { min: 200, max: 1000 };
        const f2Range = { min: 750, max: 2600 };

        const f1Peak = this.findStrongestPeakInRange(powerSpectrum, binSize, f1Range, frequencyData);
        const f2Peak = this.findStrongestPeakInRange(powerSpectrum, binSize, f2Range, frequencyData);

        // Using the same threshold as your original code
        if (f1Peak && f2Peak && f1Peak.power > -80 && f2Peak.power > -80) {
            console.log("Found formants:", [f1Peak.frequency, f2Peak.frequency]);
            return [f1Peak.frequency, f2Peak.frequency];
        }
        return null;  // Return null instead of [0, 0] to match original behavior
    }

    findStrongestPeakInRange(spectrum, binSize, range, rawData) {
        const startBin = Math.floor(range.min / binSize);
        const endBin = Math.ceil(range.max / binSize);
        const windowSize = 2;  // Same window size as original

        let maxPower = -Infinity;
        let peakFreq = null;
        let peakPower = null;

        for (let i = startBin + windowSize; i < endBin - windowSize; i++) {
            const centerValue = spectrum[i];
            const centerPower = rawData[i];

            // Check if it's a local maximum
            let isPeak = true;
            for (let j = -windowSize; j <= windowSize; j++) {
                if (j !== 0 && spectrum[i + j] >= centerValue) {
                    isPeak = false;
                    break;
                }
            }

            if (isPeak && centerValue > maxPower) {
                maxPower = centerValue;
                peakFreq = i * binSize;
                peakPower = centerPower;
            }
        }

        return peakFreq ? { frequency: peakFreq, power: peakPower } : null;
    }
}