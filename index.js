const startButton = document.getElementById("start-recording");
const canvas = document.getElementById("waveform");
const canvasCtx = canvas.getContext("2d");

const vowelCanvas = document.createElement("canvas");
vowelCanvas.width = 600;
vowelCanvas.height = 400;
vowelCanvas.style.border = "1px solid black";
vowelCanvas.style.marginTop = "20px";
document.body.appendChild(vowelCanvas);

const vowelCtx = vowelCanvas.getContext("2d");

let audioContext, analyser, dataArray, bufferLength;
let isRecording = false;
let recentFormants = [];
const MAX_DOTS = 5;

const vowels = [
    // Top row
    { label: "i", f1: 275, f2: 2585 },  // High front unrounded
    { label: "y", f1: 276, f2: 2091 },  // High front rounded
    { label: "u", f1: 291, f2: 779 },   // High back rounded

    // Second row
    { label: "e", f1: 405, f2: 2553 },  // Mid-high front unrounded
    { label: "ø", f1: 409, f2: 1599 },  // Mid-high front rounded
    { label: "o", f1: 415, f2: 842 },   // Mid-high back rounded

    // Third row
    { label: "ɛ", f1: 614, f2: 2306 },  // Mid-low front unrounded
    { label: "œ", f1: 599, f2: 1678 },  // Mid-low front rounded
    { label: "ɔ", f1: 595, f2: 1144 },  // Mid-low back rounded

    // Bottom row
    { label: "a", f1: 830, f2: 1438 },  // Low front unrounded
];

function drawVowelChart() {
    // Clear the entire canvas
    vowelCtx.fillStyle = "white";
    vowelCtx.fillRect(0, 0, vowelCanvas.width, vowelCanvas.height);

    // Draw border for debugging
    vowelCtx.strokeStyle = "#ccc";
    vowelCtx.strokeRect(0, 0, vowelCanvas.width, vowelCanvas.height);

    // Map F1/F2 to x/y coordinates
    vowels.forEach(vowel => {
        const x = mapF2ToX(vowel.f2);
        const y = mapF1ToY(vowel.f1);

        // Draw circle for vowel
        vowelCtx.beginPath();
        vowelCtx.arc(x, y, 20, 0, 2 * Math.PI);
        vowelCtx.fillStyle = "#00A3A3";
        vowelCtx.fill();

        // Draw vowel label
        vowelCtx.fillStyle = "black";
        vowelCtx.font = "bold 16px Arial";
        vowelCtx.textAlign = "center";
        vowelCtx.textBaseline = "middle";
        vowelCtx.fillText(vowel.label, x, y);
    });
}

function mapF2ToX(f2) {
    const margin = 50;
    const width = vowelCanvas.width - 2 * margin;
    const minF2 = 750;   // Adjusted to match lowest F2 (u)
    const maxF2 = 2600;  // Adjusted to match highest F2 (i)
    return margin + width * (1 - (f2 - minF2) / (maxF2 - minF2));
}

function mapF1ToY(f1) {
    const margin = 50;
    const height = vowelCanvas.height - 2 * margin;
    const minF1 = 250;   // Adjusted to match highest vowels
    const maxF1 = 850;   // Adjusted to match lowest vowel
    return margin + height * ((f1 - minF1) / (maxF1 - minF1));
}

function updateFormantHistory(f1, f2) {
    if (f1 >= 200 && f1 <= 1000 && f2 >= 750 && f2 <= 2600) {
        // Add new formant point
        const x = mapF2ToX(f2);
        const y = mapF1ToY(f1);
        recentFormants.push({ x, y, f1, f2, timestamp: Date.now() });

        if (recentFormants.length > MAX_DOTS) {
            recentFormants.shift();
        }

        // Redraw chart and points
        drawVowelChart();

        // Draw formant points and highlight closest vowel
        let closestVowel = null;
        let minDistance = Infinity;

        vowels.forEach(vowel => {
            const dist = Math.sqrt(
                Math.pow((f1 - vowel.f1) / 100, 2) +
                Math.pow((f2 - vowel.f2) / 200, 2)
            );
            if (dist < minDistance) {
                minDistance = dist;
                closestVowel = vowel;
            }
        });

        // Highlight closest vowel if we're close enough
        if (minDistance < 3) {  // Adjust this threshold as needed
            const vowelX = mapF2ToX(closestVowel.f2);
            const vowelY = mapF1ToY(closestVowel.f1);
            vowelCtx.beginPath();
            vowelCtx.arc(vowelX, vowelY, 25, 0, 2 * Math.PI);
            vowelCtx.strokeStyle = "rgba(255, 255, 0, 0.5)";
            vowelCtx.lineWidth = 3;
            vowelCtx.stroke();
        }

        // Draw recent formant points
        recentFormants.forEach((formant, index) => {
            const age = (Date.now() - formant.timestamp) / 1000;
            const alpha = Math.max(0, 1 - (age / 2));

            vowelCtx.beginPath();
            vowelCtx.arc(formant.x, formant.y, 8, 0, 2 * Math.PI);
            vowelCtx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            vowelCtx.fill();
        });
    }
}

function startAudioAnalysis() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            analyser = audioContext.createAnalyser();

            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;
            bufferLength = analyser.frequencyBinCount;
            dataArray = new Float32Array(bufferLength);

            source.connect(analyser);

            drawVowelChart(); // Initialize the vowel chart
            visualizeWaveform();
            analyzeFormants();
        })
        .catch(err => console.error("Error accessing microphone:", err));
}

function analyzeFormants() {
    if (!isRecording) return;

    requestAnimationFrame(analyzeFormants);
    analyser.getFloatFrequencyData(dataArray);

    const formants = getFormants(dataArray);
    if (formants) {
        const [f1, f2] = formants;

        // Update display
        document.getElementById("f1").textContent = Math.round(f1);
        document.getElementById("f2").textContent = Math.round(f2);

        // Update visualization
        updateFormantHistory(f1, f2);
    }
}

function getFormants(frequencyData) {
    const sampleRate = audioContext.sampleRate;
    const nyquist = sampleRate / 2;
    const binSize = nyquist / bufferLength;

    // Debug log the signal strength
    const avgPower = frequencyData.reduce((sum, val) => sum + val, 0) / frequencyData.length;

    // Lowered threshold for testing
    // if (avgPower < -75) {
    //     return null;
    // }

    // Convert to power spectrum
    const powerSpectrum = new Float32Array(bufferLength);
    for (let i = 0; i < bufferLength; i++) {
        powerSpectrum[i] = Math.pow(10, frequencyData[i] / 20);
    }

    // Find peaks in specific frequency ranges
    const f1Range = { min: 200, max: 1000 };
    const f2Range = { min: 750, max: 2600 };

    const f1Peak = findStrongestPeakInRange(powerSpectrum, binSize, f1Range, frequencyData);
    const f2Peak = findStrongestPeakInRange(powerSpectrum, binSize, f2Range, frequencyData);

    // Lowered power threshold for testing
    if (f1Peak && f2Peak && f1Peak.power > -80 && f2Peak.power > -80) {
        return [f1Peak.frequency, f2Peak.frequency];
    }
    return null;
}

function findStrongestPeakInRange(spectrum, binSize, range, rawData) {
    const startBin = Math.floor(range.min / binSize);
    const endBin = Math.ceil(range.max / binSize);

    let maxPower = -Infinity;
    let peakFreq = null;
    let peakPower = null;
    const windowSize = 2;

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

function visualizeWaveform() {
    if (!isRecording) return;

    requestAnimationFrame(visualizeWaveform);
    analyser.getFloatTimeDomainData(dataArray);

    canvasCtx.fillStyle = "rgba(0, 0, 0, 0.2)";
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = "white";
    canvasCtx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] * 0.5 + 0.5;
        const y = v * canvas.height;

        if (i === 0) {
            canvasCtx.moveTo(x, y);
        } else {
            canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    canvasCtx.stroke();
}

// Initial draw of vowel chart
drawVowelChart();

startButton.addEventListener("click", () => {
    if (!isRecording) {
        startAudioAnalysis();
        startButton.textContent = "Stop Analysis";
    } else {
        if (audioContext) {
            audioContext.close();
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            vowelCtx.clearRect(0, 0, vowelCanvas.width, vowelCanvas.height);
            recentFormants = [];
        }
        startButton.textContent = "Start Analysis";
    }
    isRecording = !isRecording;
});