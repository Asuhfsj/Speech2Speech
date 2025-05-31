# Speech2Speech

A web application that converts speech to text, processes it through an AI language model, and converts the response back to speech using advanced text-to-speech technology.

This all happens in the local browser, nothing is sent to any server.

Important: You NEED a local running chat LLM server like llama-server

## Features

- **Speech Recognition**: Uses Moonshine to transcribe spoken english language only into text
- **AI Processing**: Sends transcribed text to a language model API for intelligent responses
- **Text-to-Speech**: Converts the AI response back to speech using Kokoro TTS
- **Dark Mode**: Modern dark-themed UI for comfortable use

## Technologies Used

- **Moonshine**: Speech recognition model by Useful Sensors
- **Kokoro**: Advanced text-to-speech synthesis engine
- **Hugging Face Transformers.js**: Client-side machine learning models
- **Web Audio API**: For audio recording and playback
- **Modern JavaScript**: ES6+ features including modules, classes, and async/await

## Getting Started

### Prerequisites

- Modern web browser with JavaScript AND WebGPU enabled
- Local or remote server to host the application
- Optional: Web server that supports the language model API endpoint

### Installation

1. Clone the repository
2. Host the files on a web server
3. Open the application in a web browser

### Configuration

In the Settings tab:
- Set the Chat Inference Server URL to your language model endpoint
- Configure the System Prompt to control the AI assistant's behavior

## How to Use

1. Navigate to the Conversation tab
2. Click "Start Recording" to begin speaking
3. Click "Stop Recording" when finished to process the audio
4. Wait for the AI to generate a response
5. The response will be spoken aloud using the selected voice
6. View the conversation history in the Transcription section

## Project Structure

- `/css`: Stylesheet files for the UI
- `/js`: JavaScript modules for application logic
  - `AudioPlayer.js`: Handles audio playback
  - `conversation.js`: Manages the conversation flow
  - `kokoro.js`: Text-to-speech implementation
  - `stt.js`: Speech-to-text functionality
  - `ui.js`: User interface interactions
- `/index.html`: Main application page

## Credits

This project uses the following open source technologies:

- [Moonshine](https://github.com/usefulsensors/moonshine) - Speech recognition model by Useful Sensors
- [Kokoro](https://github.com/hexgrad/kokoro) - Text-to-speech synthesis engine
- [Hugging Face Transformers.js](https://huggingface.co/docs/transformers.js) - Machine learning models in the browser

## License

Apache 2.0

