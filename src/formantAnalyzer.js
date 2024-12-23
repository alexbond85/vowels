// formantAnalyzer.js

export class FormantAnalyzer {
    constructor(backendUrl = 'http://localhost:8000') {
        this.backendUrl = backendUrl;
    }

    async analyzeAudio(audioBlob) {
        try {
            // Verify we have a valid blob
            if (!(audioBlob instanceof Blob)) {
                console.error('Invalid audio data:', audioBlob);
                throw new Error('Invalid audio data received');
            }

            console.log('Analyzing audio blob:', audioBlob.type, audioBlob.size);

            const formData = new FormData();
            formData.append('audio', audioBlob, 'recording.webm');

            const response = await fetch(`${this.backendUrl}/analyze-formants`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response:', errorText);
                throw new Error(`Server error: ${errorText}`);
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Analysis failed');
            }

            return result.data;
        } catch (error) {
            console.error("Error analyzing formants:", error);
            throw error;
        }
    }
}