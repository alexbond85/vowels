from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import parselmouth
import numpy as np
from pydub import AudioSegment
import os
import math
import logging
from datetime import datetime

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create directories for original and converted files
UPLOAD_FOLDER = "uploads"
ORIGINAL_FOLDER = os.path.join(UPLOAD_FOLDER, "original")
CONVERTED_FOLDER = os.path.join(UPLOAD_FOLDER, "converted")
os.makedirs(ORIGINAL_FOLDER, exist_ok=True)
os.makedirs(CONVERTED_FOLDER, exist_ok=True)


def load_audio_mp3(file_path):
    audio = AudioSegment.from_file(file_path)
    audio = audio.set_channels(1)  # Convert to mono
    audio = audio.set_frame_rate(44100)  # Set sample rate to 44100 Hz

    # Save the converted audio
    converted_path = os.path.join(CONVERTED_FOLDER,
                                  os.path.basename(file_path).replace('.webm', '.mp3'))
    audio.export(converted_path, format='mp3')
    logger.info(f"Saved converted audio to: {converted_path}")

    samples = np.array(audio.get_array_of_samples(), dtype="float64") / (2 ** 15)  # Normalize
    return samples, audio.frame_rate


def extract_formants(file_path):
    samples, sample_rate = load_audio_mp3(file_path)
    sound = parselmouth.Sound(samples, sampling_frequency=sample_rate)
    formant = sound.to_formant_burg()

    times = np.arange(0, formant.xmax, 0.01)

    # Replace NaN values with None
    f1 = [formant.get_value_at_time(1, t) for t in times]
    f1 = [None if (val is None or math.isnan(val)) else val for val in f1]

    f2 = [formant.get_value_at_time(2, t) for t in times]
    f2 = [None if (val is None or math.isnan(val)) else val for val in f2]

    return {"times": times.tolist(), "f1": f1, "f2": f2}


@app.post("/analyze-formants")
async def analyze_formants(audio: UploadFile = File(...)):
    try:
        # Generate timestamp for unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        original_filename = f"recording_{timestamp}.webm"
        file_path = os.path.join(ORIGINAL_FOLDER, original_filename)

        # Save original file
        with open(file_path, "wb") as buffer:
            contents = await audio.read()
            buffer.write(contents)
        logger.info(f"Saved original file to: {file_path}")

        # Process the file
        try:
            formant_data = extract_formants(file_path)
            logger.info("Formant extraction successful")
            return {
                "success": True,
                "data": formant_data
            }
        except Exception as e:
            logger.error(f"Error extracting formants: {str(e)}")
            raise

    except Exception as e:
        logger.error(f"Error processing audio: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)