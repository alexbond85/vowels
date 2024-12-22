export class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.frequencyData = null;
        this.timeData = null;  // For amplitude checking
        this.isRecording = false;
        this.stream = null;
        this.sampleRate = null;
    }

    async start() {
        if (this.isRecording) return;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.sampleRate = this.audioContext.sampleRate;

            const source = this.audioContext.createMediaStreamSource(this.stream);
            this.analyser = this.audioContext.createAnalyser();

            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;

            this.frequencyData = new Float32Array(this.analyser.frequencyBinCount);
            this.timeData = new Float32Array(this.analyser.fftSize);  // For time domain data

            source.connect(this.analyser);
            this.isRecording = true;

            return this.sampleRate;
        } catch (err) {
            console.error("Error accessing microphone:", err);
            throw err;
        }
    }

    stop() {
        if (!this.isRecording) return;

        if (this.audioContext) {
            this.audioContext.close();
        }
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }

        this.audioContext = null;
        this.analyser = null;
        this.frequencyData = null;
        this.timeData = null;
        this.isRecording = false;
        this.sampleRate = null;
    }

    getFrequencyData() {
        if (!this.analyser || !this.isRecording) return null;
        this.analyser.getFloatFrequencyData(this.frequencyData);
        return this.frequencyData;
    }

    getCurrentAmplitude() {
        if (!this.analyser || !this.isRecording) return 0;

        this.analyser.getFloatTimeDomainData(this.timeData);

        // Calculate RMS amplitude
        let sumSquares = 0;
        for (let i = 0; i < this.timeData.length; i++) {
            sumSquares += this.timeData[i] * this.timeData[i];
        }
        const rms = Math.sqrt(sumSquares / this.timeData.length);

        return rms;
    }
}