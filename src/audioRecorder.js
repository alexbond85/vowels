// audioRecorder.js

export class AudioRecorder {
    constructor(duration = 2000) {
        this.recordingDuration = duration;
        this.stream = null;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
    }

    async start() {
        if (this.isRecording) return null;

        try {
            if (!this.stream) {
                this.stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }
                });
            }

            this.audioChunks = [];

            // Check what MIME types are supported
            const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                ? 'audio/webm;codecs=opus'
                : 'audio/webm';

            console.log('Using MIME type:', mimeType);  // Debug log

            this.mediaRecorder = new MediaRecorder(this.stream, {
                mimeType: mimeType
            });

            return new Promise((resolve) => {
                this.mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        this.audioChunks.push(event.data);
                    }
                };

                this.mediaRecorder.onstop = () => {
                    this.isRecording = false;
                    const audioBlob = new Blob(this.audioChunks, {
                        type: mimeType
                    });
                    console.log('Created audio blob:', audioBlob);  // Debug log
                    resolve(audioBlob);
                };

                this.mediaRecorder.start();
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
        this.isRecording = false;
    }
}