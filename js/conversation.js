import { SpeechToText } from "./stt.js";
import { textToSpeech, ttsModelReadyPromise } from "./tts.js";

export class Conversation {
    constructor() {
        this.modelsReady = false;
        this.speechToText = new SpeechToText();
        this.initModels();
        this.conversationHistory = [
            {
                role: "system",
                content: "placeholder"
            }
        ];
    }
      async initModels() {
        try {
            // Wait for both STT and TTS models to be initialized
            await Promise.all([
                this.speechToText.modelReadyPromise,
                ttsModelReadyPromise
            ]);
            
            // Signal that models are ready
            this.modelsReady = true;
            
            // Update UI to enable recording
            const toggleButton = document.getElementById('toggleRecording');
            toggleButton.disabled = false;
            toggleButton.textContent = 'Start Recording';
            const recordingStatus = document.getElementById('recordingStatus');
            recordingStatus.textContent = 'Models loaded. Click "Start Recording" to begin';
        } catch (error) {
            console.error('Error initializing models:', error);
            const recordingStatus = document.getElementById('recordingStatus');
            recordingStatus.textContent = 'Error loading models: ' + error.message;
        }
    }    startRecording() {
        // Only start recording if models are ready
        if (this.modelsReady) {
            this.speechToText.startRecording();
        } else {
            console.warn('Cannot start recording: models are not yet loaded');
            const recordingStatus = document.getElementById('recordingStatus');
            recordingStatus.textContent = 'Please wait for models to finish loading...';
        }
    }

    async stopRecording() {
        let text = await this.speechToText.stopRecording();
        console.log('Transcription output2:', text)

        const transcriptionStatus = document.getElementById('transcriptionStatus');
        transcriptionStatus.textContent = text;

        this.conversationHistory.push({
            role: "user",
            content: text
        });

        let serverUrl = document.getElementById('serverUrl').value;
        let system_prompt = document.getElementById('systemPrompt').value;

        this.conversationHistory[0].content = system_prompt;

        const response = await fetch(serverUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "messages": this.conversationHistory
            })
        });

        const data = await response.json();
        const reponse = data.choices[0].message.content;
        this.conversationHistory.push({
            "role": "assistant",
            "content": reponse
        });
        console.log("reponse", reponse);
        textToSpeech(reponse, "af_heart");
    }
}



