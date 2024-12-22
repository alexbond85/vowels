// src/audio.js
export class AudioAnalyzer {
    constructor(callback) {
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.bufferLength = 0;
        this.isRecording = false;
        this.callback = callback;
    }

    start() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = this.audioContext.createMediaStreamSource(stream);
                this.analyser = this.audioContext.createAnalyser();

                this.analyser.fftSize = 2048;
                this.bufferLength = this.analyser.frequencyBinCount;
                this.dataArray = new Float32Array(this.bufferLength);
                source.connect(this.analyser);

                this.isRecording = true;
                this.analyze();
            })
            .catch(err => console.error("Error accessing microphone:", err));
    }

    stop() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.isRecording = false;
    }

    analyze() {
        if (!this.isRecording) return;

        requestAnimationFrame(() => this.analyze());
        this.analyser.getFloatFrequencyData(this.dataArray);

        const formants = this.getFormants();
        if (formants) {
            this.callback(formants);
        }
    }

    getFormants() {
        // Calculate F1/F2 peaks...
    }
}