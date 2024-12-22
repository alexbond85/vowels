// Waveform class handles real-time audio visualization on a canvas element
export class Waveform {
    // Initialize the Waveform with a canvas element where the visualization will be drawn
    constructor(canvas) {
        this.canvas = canvas;                    // Store reference to the canvas element
        this.ctx = canvas.getContext('2d');      // Get 2D rendering context for drawing
        this.audioContext = null;                // Will hold the Web Audio API context
        this.analyser = null;                    // Will hold the audio analyzer node
        this.dataArray = null;                   // Will store the audio waveform data
        this.bufferLength = 0;                   // Length of the audio data buffer
        this.isRecording = false;                // Flag to track if we're currently recording
    }

    // Begin audio capture and visualization
    start() {
        // Request access to the user's microphone
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                // Create new audio context (with fallback for webkit browsers)
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

                // Create an audio source from the microphone stream
                const source = this.audioContext.createMediaStreamSource(stream);

                // Create an analyzer node to process the audio data
                this.analyser = this.audioContext.createAnalyser();

                // Set FFT size to 2048 - this determines the detail level of the waveform
                // Larger FFT sizes provide more detailed frequency data but require more processing
                this.analyser.fftSize = 4*2048;

                // frequencyBinCount is always fftSize/2 - this is how many data points we'll have
                this.bufferLength = this.analyser.frequencyBinCount;

                // Create a Float32Array to hold the waveform data
                // Using Float32Array because we want high-precision audio samples
                this.dataArray = new Float32Array(this.bufferLength);

                // Connect the audio source to the analyzer
                source.connect(this.analyser);

                // Set recording flag and start the visualization loop
                this.isRecording = true;
                this.visualize();
            })
            .catch(err => console.error("Error accessing microphone:", err));
    }

    // Stop recording and clean up audio context
    stop() {
        if (this.audioContext) {
            this.audioContext.close();   // Close the audio context to free up resources
        }
        this.isRecording = false;       // Stop the visualization loop
    }

    // Main visualization loop - draws the waveform
    visualize() {
        // Exit if we're not recording
        if (!this.isRecording) return;

        // Schedule the next frame
        requestAnimationFrame(() => this.visualize());

        // Get the current waveform data
        this.analyser.getFloatTimeDomainData(this.dataArray);

        // Create a slight fade effect by filling with semi-transparent black
        // This creates a trail effect in the visualization
        this.ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Set up the waveform line style
        this.ctx.lineWidth = 2;         // Width of the waveform line
        this.ctx.strokeStyle = "white";  // Color of the waveform
        this.ctx.beginPath();           // Start a new path for drawing

        // Calculate width of each segment based on canvas width and buffer length
        const sliceWidth = this.canvas.width / this.bufferLength;
        let x = 0;  // X coordinate for drawing

        // Loop through each point in the audio data
        for (let i = 0; i < this.bufferLength; i++) {
            // Normalize the audio data value to fit in our canvas
            // Audio data ranges from -1 to 1, so we scale and shift to 0 to 1
            const v = this.dataArray[i] * 0.5 *4 + 0.5;

            // Calculate Y coordinate based on normalized value
            const y = v * this.canvas.height;

            // For the first point, move to position without drawing
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                // For all other points, draw a line to this position
                this.ctx.lineTo(x, y);
            }

            // Move X coordinate for next point
            x += sliceWidth;
        }

        // Actually draw the waveform path
        this.ctx.stroke();
    }
}