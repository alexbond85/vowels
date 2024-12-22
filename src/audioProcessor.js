export class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.timeDataArray = null;  // For amplitude checking
        this.isRecording = false;
        this.stream = null;
        this.sampleRate = null;
    }

    async start() {
        if (this.isRecording) return;

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 44100,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            this.audioContext = new AudioContext();
            this.sampleRate = this.audioContext.sampleRate;

            const source = this.audioContext.createMediaStreamSource(this.stream);
            this.analyser = this.audioContext.createAnalyser();

            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.5;
            this.analyser.minDecibels = -100;
            this.analyser.maxDecibels = -30;

            this.dataArray = new Float32Array(this.analyser.frequencyBinCount);
            this.timeDataArray = new Float32Array(this.analyser.fftSize);

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
        this.timeDataArray = null;
        this.isRecording = false;
        this.sampleRate = null;
    }

    getFrequencyData() {
        if (!this.analyser || !this.isRecording) return null;
        this.analyser.getFloatFrequencyData(this.dataArray);
        return this.dataArray;
    }

    // New method to get current audio amplitude
    getCurrentAmplitude() {
        if (!this.analyser || !this.isRecording) return 0;

        this.analyser.getFloatTimeDomainData(this.timeDataArray);

        // Calculate RMS amplitude
        let sum = 0;
        for (let i = 0; i < this.timeDataArray.length; i++) {
            sum += this.timeDataArray[i] * this.timeDataArray[i];
        }
        const rms = Math.sqrt(sum / this.timeDataArray.length);
        return rms;
    }
}