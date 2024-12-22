import { Waveform } from './waveform.js';
import { VowelChart } from './chart.js';
import { AudioProcessor } from './audioProcessor.js';
import { FormantDisplay } from './formantDisplay.js';
import { FormantAnalyzer } from './formantAnalyzer.js';

class App {
    constructor() {
        this.startButton = document.getElementById('start-recording');
        this.waveformCanvas = document.getElementById('waveform');
        this.vowelCanvas = document.getElementById('vowel-chart');
        this.tooltip = document.getElementById('tooltip');
        this.isRecording = false;

        // Amplitude threshold (RMS value between 0 and 1)
        // Adjust this value based on testing:
        // - Higher values (e.g., 0.1) require louder speech
        // - Lower values (e.g., 0.01) are more sensitive
        this.AMPLITUDE_THRESHOLD = 0.01;

        // Initialize components
        this.audioProcessor = new AudioProcessor();
        this.formantAnalyzer = null;
        this.formantDisplay = new FormantDisplay(
            document.getElementById('f1'),
            document.getElementById('f2')
        );
        this.waveform = new Waveform(this.waveformCanvas);
        this.vowelChart = new VowelChart(this.vowelCanvas);

        this.vowelChart.drawChart();
        this.attachEventListeners();
    }

    updateFormantsRealtime() {
        if (!this.isRecording) return;

        requestAnimationFrame(() => this.updateFormantsRealtime());

        // Check amplitude instead of power
        const currentAmplitude = this.audioProcessor.getCurrentAmplitude();

        if (currentAmplitude > this.AMPLITUDE_THRESHOLD) {
            const frequencyData = this.audioProcessor.getFrequencyData();
            if (frequencyData && this.formantAnalyzer) {
                const formants = this.formantAnalyzer.computeFormants(frequencyData);

                if (formants) {
                    const [f1, f2] = formants;
                    this.formantDisplay.update(Math.round(f1), Math.round(f2));
                    this.vowelChart.addFormantPoint(f1, f2);
                }
            }
        } else {
            this.formantDisplay.reset();
        }
    }
    attachEventListeners() {
        this.startButton.addEventListener('click', () => this.toggleRecording());
        this.vowelCanvas.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        this.vowelCanvas.addEventListener('mouseleave', () => this.handleMouseLeave());
    }

    async startRecording() {
        try {
            const sampleRate = await this.audioProcessor.start();
            this.formantAnalyzer = new FormantAnalyzer(sampleRate);

            this.waveform.start();
            this.startButton.textContent = "Stop Recording";
            this.isRecording = true;

            this.updateFormantsRealtime();
        } catch (err) {
            console.error("Failed to start recording:", err);
        }
    }

    stopRecording() {
        this.audioProcessor.stop();
        this.waveform.stop();
        this.formantDisplay.reset();
        this.vowelChart.clearHistory();  // Clear formant history
        this.isRecording = false;
        this.startButton.textContent = "Start Recording";
    }
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }

    handleMouseMove(event) {
        const rect = this.vowelCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const f2 = this.vowelChart.mapXToF2(mouseX);
        const f1 = this.vowelChart.mapYToF1(mouseY);

        if (this.tooltip) {
            this.tooltip.textContent = `F1: ${Math.round(f1)} Hz, F2: ${Math.round(f2)} Hz`;
            this.tooltip.style.left = `${event.pageX + 10}px`;
            this.tooltip.style.top = `${event.pageY + 10}px`;
            this.tooltip.style.display = 'block';
        }
    }

    handleMouseLeave() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }
}
// Initialize the app
new App();