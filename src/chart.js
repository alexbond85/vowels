import { vowels } from './constants.js';

export class VowelChart {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.margin = 50;

        // For formant history
        this.recentFormants = [];
        this.MAX_DOTS = 5;  // Maximum number of history points to show

        // Store ranges for consistency
        this.f1Range = { min: 240, max: 900 };
        this.f2Range = { min: 750, max: 2600 };

        window.addEventListener("resize", () => this.drawChart());
    }

    addFormantPoint(f1, f2) {
        if (f1 >= 200 && f1 <= 1000 && f2 >= 750 && f2 <= 2600) {
            // Add new formant point with coordinates and timestamp
            const x = this.mapF2ToX(f2);
            const y = this.mapF1ToY(f1);
            this.recentFormants.push({ x, y, f1, f2, timestamp: Date.now() });

            // Remove oldest point if we exceed maximum
            if (this.recentFormants.length > this.MAX_DOTS) {
                this.recentFormants.shift();
            }

            // Redraw everything
            this.drawChartWithFormants();
        }
    }

    drawChartWithFormants() {
        // First draw the base chart
        this.drawChart();

        // Then draw formant points with fade effect
        this.drawFormantPoints();

        // Finally, highlight closest vowel if any point is close enough
        this.highlightClosestVowel();
    }

    drawFormantPoints() {
        this.recentFormants.forEach((formant) => {
            const age = (Date.now() - formant.timestamp) / 1000;
            const alpha = Math.max(0, 1 - (age / 2));  // Fade over 2 seconds

            this.ctx.beginPath();
            this.ctx.arc(formant.x, formant.y, 8, 0, 2 * Math.PI);
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            this.ctx.fill();
        });
    }

    highlightClosestVowel() {
        if (this.recentFormants.length === 0) return;

        // Use the most recent formant point
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

        // Highlight if we're close enough
        if (minDistance < 3) {  // You can adjust this threshold
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

    drawChart() {
        // Clear canvas
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw vowels
        vowels.forEach((vowel) => {
            const x = this.mapF2ToX(vowel.f2);
            const y = this.mapF1ToY(vowel.f1);

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
        return this.f2Range.min + (1 - (x - this.margin) / width) * (this.f2Range.max - this.f2Range.min);
    }

    mapYToF1(y) {
        const height = this.canvas.height - 2 * this.margin;
        return this.f1Range.min + ((y - this.margin) / height) * (this.f1Range.max - this.f1Range.min);
    }
}