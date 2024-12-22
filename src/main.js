import { Waveform } from './waveform.js';
import { VowelChart } from './chart.js';

const startButton = document.getElementById('start-recording');
const waveformCanvas = document.getElementById('waveform');
const vowelCanvas = document.getElementById('vowel-chart');
const tooltip = document.createElement('div'); // Tooltip for displaying F1/F2 values

// Initialize components
const waveform = new Waveform(waveformCanvas);
const vowelChart = new VowelChart(vowelCanvas);

vowelChart.drawChart();

// Style the tooltip
tooltip.style.position = 'absolute';
tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
tooltip.style.color = 'white';
tooltip.style.padding = '5px 10px';
tooltip.style.borderRadius = '5px';
tooltip.style.pointerEvents = 'none';
tooltip.style.fontSize = '14px';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

// Start/stop waveform visualization
startButton.addEventListener('click', () => {
    if (!waveform.isRecording) {
        waveform.start();
        startButton.textContent = "Stop Recording";
    } else {
        waveform.stop();
        startButton.textContent = "Start Recording";
    }
});

// Handle mouse movement on the vowel chart
vowelCanvas.addEventListener('mousemove', (event) => {
    // Get mouse position relative to the canvas
    const rect = vowelCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Map mouse position to F1/F2
    const f2 = vowelChart.mapXToF2(mouseX);
    const f1 = vowelChart.mapYToF1(mouseY);

    // Update tooltip content and position
    tooltip.textContent = `F1: ${Math.round(f1)} Hz, F2: ${Math.round(f2)} Hz`;
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
    tooltip.style.display = 'block';
});

// Hide tooltip when the mouse leaves the canvas
vowelCanvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
});

// window.addEventListener('resize', () => this.drawChart());