import { vowels } from './constants.js';

export class VowelChart {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.margin = 30;

        // For formant history
        this.recentFormants = [];
        this.MAX_DOTS = 100; // Increased from 5 to show more points

        // Updated ranges for F1 and F2
        this.f1Range = { min: 270, max: 870 };
        this.f2Range = { min: 650, max: 2700 };

        // Store vowel positions for click detection
        this.vowelPositions = new Map();

        // Add event listeners
        window.addEventListener("resize", () => this.drawChart());
        this.canvas.addEventListener("click", (event) => this.handleClick(event));

        // Initial draw
        this.drawChart();
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        console.log("Canvas clicked at:", mouseX, mouseY);

        // Check each vowel position
        this.vowelPositions.forEach((position, vowel) => {
            const distance = Math.sqrt(
                Math.pow(mouseX - position.x, 2) +
                Math.pow(mouseY - position.y, 2)
            );

            if (distance <= 20) { // 20 is the radius of vowel circles
                console.log("Playing vowel:", vowel.label);
                this.playAudio(vowel.audio);
            }
        });
    }

    playAudio(audioFile) {
        console.log("Playing audio:", audioFile);
        const audio = new Audio(audioFile);
        audio
            .play()
            .then(() => console.log("Audio played successfully"))
            .catch((err) => console.error("Audio playback error:", err));
    }

    drawChart() {
        // Clear canvas
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Clear vowel positions
        this.vowelPositions.clear();

        // Draw vowels
        vowels.forEach((vowel) => {
            const x = this.mapF2ToX(vowel.f2);
            const y = this.mapF1ToY(vowel.f1);

            // Store position for click detection
            this.vowelPositions.set(vowel, { x, y });

            // Draw circle
            this.ctx.beginPath();
            this.ctx.arc(x, y, 20, 0, 2 * Math.PI);
            this.ctx.fillStyle = "#00A3A3";
            this.ctx.fill();

            // Draw label
            this.ctx.fillStyle = "black";
            this.ctx.font = "bold 16px Arial";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(vowel.label, x, y);
        });
    }

    addFormantPoint(f1, f2, opacity = 1.0) {
        // Check if formant values are within valid ranges
        if (f1 >= this.f1Range.min && f1 <= this.f1Range.max &&
            f2 >= this.f2Range.min && f2 <= this.f2Range.max) {

            // Convert F1/F2 frequencies to canvas coordinates
            const x = this.mapF2ToX(f2);
            const y = this.mapF1ToY(f1);

            // Add new point to array
            this.recentFormants.push({ x, y, f1, f2, opacity });

            // If we exceed MAX_DOTS, remove oldest point
            if (this.recentFormants.length > this.MAX_DOTS) {
                this.recentFormants.shift(); // removes first (oldest) element
            }

            // Redraw the chart with updated points
            this.drawChartWithFormants();
        }
    }

    drawChartWithFormants() {
        this.drawChart();
        this.drawFormantPoints();
        this.highlightClosestVowel();
    }

    drawFormantPoints() {
        // Draw each point in the array
        this.recentFormants.forEach((formant) => {
            this.ctx.beginPath();
            this.ctx.arc(formant.x, formant.y, 4, 0, 2 * Math.PI);
            this.ctx.fillStyle = `rgba(255, 0, 0, ${formant.opacity})`;
            this.ctx.fill();
        });
    }

    highlightClosestVowel() {
        if (this.recentFormants.length === 0) return;

        const currentFormant = this.recentFormants[this.recentFormants.length - 1];
        let closestVowel = null;
        let minDistance = Infinity;

        vowels.forEach(vowel => {
            const dist = Math.sqrt(
                Math.pow((currentFormant.f1 - vowel.f1) / 100, 2) +
                Math.pow((currentFormant.f2 - vowel.f2) / 200, 2)
            );
            if (dist < minDistance) {
                minDistance = dist;
                closestVowel = vowel;
            }
        });

        if (minDistance < 3) {
            const vowelX = this.mapF2ToX(closestVowel.f2);
            const vowelY = this.mapF1ToY(closestVowel.f1);

            this.ctx.beginPath();
            this.ctx.arc(vowelX, vowelY, 25, 0, 2 * Math.PI);
            this.ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
    }

    clearHistory() {
        this.recentFormants = [];
        this.drawChart();
    }

    // Updated mapping functions for new coordinate system
    mapF2ToX(f2) {
        const width = this.canvas.width - 2 * this.margin;
        return this.margin + width * (1 - (f2 - this.f2Range.min) / (this.f2Range.max - this.f2Range.min));
    }

    mapF1ToY(f1) {
        const height = this.canvas.height - 2 * this.margin;
        return this.margin + height * ((f1 - this.f1Range.min) / (this.f1Range.max - this.f1Range.min));
    }

    mapXToF2(x) {
        const width = this.canvas.width - 2 * this.margin;
        return this.f2Range.max - ((x - this.margin) / width) * (this.f2Range.max - this.f2Range.min);
    }

    mapYToF1(y) {
        const height = this.canvas.height - 2 * this.margin;
        return this.f1Range.min + ((y - this.margin) / height) * (this.f1Range.max - this.f1Range.min);
    }

    clearHistory() {
        // Clear all points
        this.recentFormants = [];
        this.drawChart();
    }
}