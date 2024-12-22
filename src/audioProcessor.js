export class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
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

            // Match the successful configuration
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;

            this.dataArray = new Float32Array(this.analyser.frequencyBinCount);

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
        this.dataArray = null;
        this.isRecording = false;
        this.sampleRate = null;
    }

    getFrequencyData() {
        if (!this.analyser || !this.isRecording) return null;
        this.analyser.getFloatFrequencyData(this.dataArray);
        return this.dataArray;
    }

    // Add method to get average power for threshold detection
    getAveragePower() {
        if (!this.analyser || !this.isRecording) return -Infinity;

        const data = this.getFrequencyData();
        if (!data) return -Infinity;

        return data.reduce((sum, val) => sum + val, 0) / data.length;
    }
}