# Speech Recording and Playback Web Application

This is a simple web application that allows users to record their voice, send it to a server, and play it back.

## Features

- Record audio from the user's microphone
- Display recording time
- Upload the recording to the server
- Save the recording on the server
- Play back the recording

## Setup and Installation

1. Make sure you have Python installed (Python 3.7 or higher is recommended)

2. Install the required dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the server:
   ```
   python server.py
   ```

4. Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

## How It Works

1. The web application provides a simple interface with "Start Recording" and "Stop Recording" buttons.
2. When you click "Start Recording", the app requests access to your microphone.
3. After recording and clicking "Stop Recording", the audio is sent to the server.
4. The server saves the audio file with a unique name in the "uploads" directory.
5. The audio is then sent back to the browser for playback.

## Technical Details

- The server is built with Flask, a lightweight Python web framework.
- Audio recording in the browser uses the MediaRecorder API.
- Audio files are stored as WAV format by default.
- Each recording is assigned a unique filename using UUID and timestamps.
