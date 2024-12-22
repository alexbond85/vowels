import { vowels } from './constants.js';

const F1_RANGE = { min: 240, max: 900 };
const F2_RANGE = { min: 750, max: 2600 };

export class VowelChart {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.margin = 20; // Reduced margin for better space utilization

        // Store the original F1/F2 ranges for consistency
        this.f1Range = { ...F1_RANGE };
        this.f2Range = { ...F2_RANGE };

        // Add listeners for resize and clicks
        window.addEventListener("resize", () => this.drawChart());
        this.canvas.addEventListener("click", (event) => {
            console.log("Canvas clicked"); // Debug log
            this.handleClick(event);
        });
    }

    drawChart() {
        // Adjust canvas dimensions dynamically
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;

        // Clear canvas
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw vowels
        vowels.forEach((vowel) => {
            const x = this.mapF2ToX(vowel.f2);
            const y = this.mapF1ToY(vowel.f1);

            // Store mapped positions and radius for click detection
            vowel.mappedX = x;
            vowel.mappedY = y;
            vowel.radius = 15;

            // Draw the vowel circle
            this.ctx.beginPath();
            this.ctx.arc(x, y, vowel.radius, 0, 2 * Math.PI);
            this.ctx.fillStyle = "#00A3A3";
            this.ctx.fill();

            // Draw the vowel label
            this.ctx.fillStyle = "black";
            this.ctx.font = "bold 14px Arial";
            this.ctx.textAlign = "center";
            this.ctx.textBaseline = "middle";
            this.ctx.fillText(vowel.label, x, y);
        });
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        console.log(`Mouse position: (${mouseX}, ${mouseY})`);

        // Check if the click is inside any vowel circle
        vowels.forEach((vowel) => {
            const distance = Math.sqrt(
                Math.pow(mouseX - vowel.mappedX, 2) + Math.pow(mouseY - vowel.mappedY, 2)
            );

            console.log(
                `Checking vowel ${vowel.label}: distance = ${distance}, radius = ${vowel.radius}`
            );

            if (distance <= vowel.radius) {
                console.log(`Vowel clicked: ${vowel.label}`);
                this.playAudio(vowel.audio);
            }
        });
    }

    playAudio(audioFile) {
        console.log(`Playing audio: ${audioFile}`);
        const audio = new Audio(audioFile);
        audio
            .play()
            .then(() => console.log("Audio played successfully"))
            .catch((err) => console.error("Audio playback error:", err));
    }

    // Map F2 to X coordinate (forward mapping)
    mapF2ToX(f2) {
        const width = this.canvas.width - 2 * this.margin;
        return (
            this.margin +
            width * (1 - (f2 - this.f2Range.min) / (this.f2Range.max - this.f2Range.min))
        );
    }

    // Map F1 to Y coordinate (forward mapping)
    mapF1ToY(f1) {
        const height = this.canvas.height - 2 * this.margin;
        return (
            this.margin +
            height * ((f1 - this.f1Range.min) / (this.f1Range.max - this.f1Range.min))
        );
    }

    // Reverse map X coordinate to F2
    mapXToF2(x) {
        const width = this.canvas.width - 2 * this.margin;
        return (
            this.f2Range.min +
            (1 - (x - this.margin) / width) * (this.f2Range.max - this.f2Range.min)
        );
    }

    // Reverse map Y coordinate to F1
    mapYToF1(y) {
        const height = this.canvas.height - 2 * this.margin;
        return (
            this.f1Range.min +
            ((y - this.margin) / height) * (this.f1Range.max - this.f1Range.min)
        );
    }
}