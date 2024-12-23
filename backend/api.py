from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import parselmouth
import numpy as np
import math
import io
import soundfile as sf
from pydub import AudioSegment
import tempfile
import os
import logging

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def convert_audio_to_wav(audio_bytes):
    """Convert audio to WAV format using pydub"""
    try:
        # Create temporary input file
        with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as temp_in:
            temp_in.write(audio_bytes)
            temp_in_path = temp_in.name

        # Create temporary output file
        temp_out_path = temp_in_path + '.wav'

        # Convert to WAV
        audio = AudioSegment.from_file(temp_in_path)
        audio.export(temp_out_path, format='wav')

        # Read the converted WAV file
        with open(temp_out_path, 'rb') as wav_file:
            wav_bytes = wav_file.read()

        return wav_bytes

    except Exception as e:
        logger.error(f"Error converting audio: {str(e)}")
        raise

    finally:
        # Clean up temporary files
        if os.path.exists(temp_in_path):
            os.unlink(temp_in_path)
        if os.path.exists(temp_out_path):
            os.unlink(temp_out_path)


@app.post("/analyze-formants")
async def analyze_formants(audio: UploadFile = File(...)):
    try:
        logger.info(f"Received audio file: {audio.filename}, content_type: {audio.content_type}")

        # Read the uploaded file
        contents = await audio.read()
        logger.info(f"Read {len(contents)} bytes")

        # Convert to WAV if needed
        if audio.filename.endswith('.webm') or audio.content_type == 'audio/webm':
            logger.info("Converting WebM to WAV")
            contents = convert_audio_to_wav(contents)
            logger.info(f"Conversion complete, new size: {len(contents)} bytes")

        # Create a BytesIO object for soundfile
        with io.BytesIO(contents) as audio_bytes:
            # Read audio data
            logger.info("Reading audio data with soundfile")
            samples, sample_rate = sf.read(audio_bytes)
            logger.info(f"Audio read successfully: sample_rate={sample_rate}, shape={samples.shape}")

            # Convert to mono if stereo
            if len(samples.shape) > 1:
                samples = samples.mean(axis=1)
                logger.info("Converted stereo to mono")

            # Create Praat Sound object and analyze
            logger.info("Creating Praat Sound object")
            sound = parselmouth.Sound(samples, sampling_frequency=sample_rate)
            formant = sound.to_formant_burg()

            # Extract formants
            times = np.arange(0, formant.xmax, 0.03)
            logger.info(f"Extracting formants for {len(times)} time points")

            f1 = [formant.get_value_at_time(1, t) for t in times]
            f1 = [None if (val is None or math.isnan(val)) else val for val in f1]

            f2 = [formant.get_value_at_time(2, t) for t in times]
            f2 = [None if (val is None or math.isnan(val)) else val for val in f2]

            logger.info("Analysis complete")
            return {
                "success": True,
                "data": {
                    "times": times.tolist(),
                    "f1": f1,
                    "f2": f2
                }
            }

    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)