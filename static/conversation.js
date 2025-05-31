import { SpeechToText } from "./stt.js";
import { textToSpeech } from "./tts.js";

export class Conversation {
    constructor() {
        this.speechToText = new SpeechToText();
        this.conversationHistory = [
            {
                role: "system",
                content: "placeholder"
            }
        ];
    }

    startRecording() {
        this.speechToText.startRecording();
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



