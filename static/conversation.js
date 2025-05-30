
import { SpeechToText } from "./stt.js";
import { textToSpeech } from "./tts.js";

export class Conversation {
    initialize() {
        this.resetConversation();
        this.speechToText = new SpeechToText();
    }

    resetConversation() {
        this.conversationHistory = [
            {
                role: "system",
                content: "You are a customer."
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

        textToSpeech(reponse, "af");

        //updateTranscriptionStatus(transcriptionStatus, 'Conversation:');

        //displayConversation(this.conversationHistory, transcriptionResult);

    }



}



