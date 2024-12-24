// main.js
import { Waveform } from './waveform.js';
import { VowelChart } from './chart.js';
import { AudioRecorder } from './audioRecorder.js';
import { FormantDisplay } from './formantDisplay.js';
import { FormantAnalyzer } from './formantAnalyzer.js';

class App {
    constructor() {
        // UI Elements
        this.startButton = document.getElementById('start-recording');
        this.waveformCanvas = document.getElementById('waveform');
        this.vowelCanvas = document.getElementById('vowel-chart');
        this.tooltip = document.getElementById('tooltip');
        this.isRecording = false;

        // Initialize components
        this.audioRecorder = new AudioRecorder(2000); // 3 second recordings
        this.formantAnalyzer = new FormantAnalyzer('http://localhost:8000');
        this.formantDisplay = new FormantDisplay(
            document.getElementById('f1'),
            document.getElementById('f2')
        );
        this.waveform = new Waveform(this.waveformCanvas);
        this.vowelChart = new VowelChart(this.vowelCanvas);

        // Initialize events
        this.attachEventListeners();

        // Initial chart draw
        this.vowelChart.drawChart();
    }

    attachEventListeners() {
        // Recording control
        this.startButton.addEventListener('click', () => this.toggleRecording());

        // Vowel chart interactions
        this.vowelCanvas.addEventListener('mousemove', (e) => this.handleChartMouseMove(e));
        this.vowelCanvas.addEventListener('mouseleave', () => this.handleChartMouseLeave());
        this.vowelCanvas.addEventListener('click', (e) => this.handleChartClick(e));
    }

    async handleRecording() {
        if (!this.isRecording) return;

        try {
            // Start waveform visualization
            this.waveform.start();

            // Update button state
            this.startButton.textContent = "Recording...";
            this.startButton.disabled = true;

            // Record audio chunk
            console.log('Starting recording...');
            const audioBlob = await this.audioRecorder.start();
            console.log('Recording complete, got blob:', audioBlob);

            if (!audioBlob) {
                throw new Error('No audio data received');
            }

            // Analyze formants
            const formantData = await this.formantAnalyzer.analyzeAudio(audioBlob);

            // Process and display formants
            if (formantData && formantData.f1 && formantData.f2) {
                this.vowelChart.clearHistory();

                const totalPoints = formantData.f1.length;
                for (let i = 0; i < totalPoints; i++) {
                    if (formantData.f1[i] !== null && formantData.f2[i] !== null) {
                        const opacity = 0.2 + (0.8 * (i / totalPoints));
                        this.vowelChart.addFormantPoint(
                            formantData.f1[i],
                            formantData.f2[i],
                            opacity
                        );
                    }
                }

                // Update display with most recent valid formants
                let lastValidIndex = totalPoints - 1;
                while (lastValidIndex >= 0) {
                    if (formantData.f1[lastValidIndex] !== null &&
                        formantData.f2[lastValidIndex] !== null) {
                        this.formantDisplay.update(
                            formantData.f1[lastValidIndex],
                            formantData.f2[lastValidIndex]
                        );
                        break;
                    }
                    lastValidIndex--;
                }
            }

        } catch (error) {
            console.error("Recording error:", error);
        } finally {
            // Reset UI state
            this.startButton.disabled = false;
            this.startButton.textContent = "Start Recording";
            this.waveform.stop();
            this.isRecording = false;
        }
    }
    async toggleRecording() {
        this.isRecording = !this.isRecording;

        if (this.isRecording) {
            this.handleRecording();
        } else {
            this.stopRecording();
        }
    }

    stopRecording() {
        this.isRecording = false;
        this.startButton.textContent = "Start Recording";
        this.startButton.disabled = false;
        this.audioRecorder.stop();
        this.waveform.stop();
        this.formantDisplay.reset();
    }

    handleChartMouseMove(event) {
        const rect = this.vowelCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Get formant values at mouse position
        const f2 = this.vowelChart.mapXToF2(mouseX);
        const f1 = this.vowelChart.mapYToF1(mouseY);

        // Update tooltip
        if (this.tooltip) {
            this.tooltip.textContent = `F1: ${Math.round(f1)} Hz, F2: ${Math.round(f2)} Hz`;
            this.tooltip.style.left = `${event.pageX + 10}px`;
            this.tooltip.style.top = `${event.pageY + 10}px`;
            this.tooltip.style.display = 'block';
        }
    }

    handleChartMouseLeave() {
        if (this.tooltip) {
            this.tooltip.style.display = 'none';
        }
    }

    handleChartClick(event) {
        // Delegate to VowelChart's click handler for vowel playback
        const rect = this.vowelCanvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        this.vowelChart.handleClick({ x: mouseX, y: mouseY });
    }
}

// Initialize the app
new App();