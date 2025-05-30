
import { SpeechToText } from "./stt.js";
import { textToSpeech } from "./tts.js";

export class Conversation {
    constructor(system_prompt) {
        this.system_prompt = system_prompt;
        this.speechToText = new SpeechToText();
        this.resetConversation();
    }

    resetConversation() {
        this.conversationHistory = [
            {
                role: "system",
                content: this.system_prompt
            }
        ];
    }

    startRecording() {
        this.speechToText.startRecording();
    }

    async stopRecording() {
        let text = await this.speechToText.stopRecording();
        console.log('Transcription output2:', text)

        this.conversationHistory.push({
            role: "user",
            content: text
        });

        const response = await fetch("http://localhost:8080/v1/chat/completions", {
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

        //console.log('Conversation history:', conversationHistory);
        console.log("reponse", reponse);

        textToSpeech(reponse, "af_heart");

        //updateTranscriptionStatus(transcriptionStatus, 'Conversation:');

        //displayConversation(this.conversationHistory, transcriptionResult);

    }



}



