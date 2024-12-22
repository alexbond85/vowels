// src/main_todo.js
import { VowelChart } from './chart.js';
import { AudioAnalyzer } from './audio.js';
import { setupUI } from './ui.js';

const vowelCanvas = document.createElement("canvas");
vowelCanvas.width = 600;
vowelCanvas.height = 400;
vowelCanvas.style.border = "1px solid black";
document.body.appendChild(vowelCanvas);

const startButton = document.getElementById("start-recording");
const chart = new VowelChart(vowelCanvas);

const analyzer = new AudioAnalyzer((formants) => {
    const [f1, f2] = formants;
    chart.drawChart(); // Update the chart
    console.log(`Formants detected: F1=${f1}, F2=${f2}`);
});

setupUI(startButton, () => {
    if (!analyzer.isRecording) {
        analyzer.start();
        startButton.textContent = "Stop Analysis";
    } else {
        analyzer.stop();
        startButton.textContent = "Start Analysis";
    }
});

chart.drawChart(); // Draw initial chart