// audioRecorder.js

export class AudioRecorder {
    constructor(duration = 2000) {
        this.recordingDuration = duration;
        this.stream = null;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.audioChunks = [];
        this.isRecording = false;
    }

    async start() {
        if (this.isRecording) return null;

        try {
            // Create audio context first to get supported sample rate
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const sampleRate = this.audioContext.sampleRate;
            console.log('Supported sample rate:', sampleRate);

            // Request high-quality audio stream
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: sampleRate,        // Use highest available sample rate
                    sampleSize: 24,                // Request 24-bit depth if available
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    latency: 0,                    // Request lowest latency
                }
            });

            // Get the actual track settings
            const track = this.stream.getAudioTracks()[0];
            const settings = track.getSettings();
            console.log('Actual track settings:', settings);

            this.audioChunks = [];

            // Try to use highest quality codec available
            const mimeTypes = [
                'audio/wav',
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/mp4'
            ];

            let selectedMimeType = null;
            for (const mimeType of mimeTypes) {
                if (MediaRecorder.isTypeSupported(mimeType)) {
                    selectedMimeType = mimeType;
                    break;
                }
            }

            if (!selectedMimeType) {
                throw new Error('No supported MIME type found');
            }

            console.log('Using MIME type:', selectedMimeType);

            // Create MediaRecorder with high bitrate
            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: selectedMimeType,
                audioBitsPerSecond: 256000    // 256 kbps for higher quality
            });

            return new Promise((resolve) => {
                this.mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        this.audioChunks.push(event.data);
                    }
                };

                this.mediaRecorder.onstop = () => {
                    this.isRecording = false;
                    const audioBlob = new Blob(this.audioChunks, {type: selectedMimeType});
                    console.log('Recording complete - details:', {
                        blobType: audioBlob.type,
                        blobSize: audioBlob.size,
                        sampleRate: sampleRate,
                        mimeType: selectedMimeType
                    });
                    resolve(audioBlob);
                };

                // Request data more frequently for smoother recording
                this.mediaRecorder.start(50);  // Collect data every 50ms
                this.isRecording = true;

                setTimeout(() => {
                    if (this.mediaRecorder.state === 'recording') {
                        this.mediaRecorder.stop();
                    }
                }, this.recordingDuration);
            });

        } catch (error) {
            console.error("Error in AudioRecorder:", error);
            throw error;
        }
    }

    stop() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.isRecording = false;
    }
}