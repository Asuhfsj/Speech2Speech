import { SpeechToText } from "./stt.js";
import { textToSpeech, ttsModelReadyPromise } from "./tts.js";
import { processStreamingText } from "./sentence-detector.js";

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
    }

    startRecording() {
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
        let $ = document.querySelector.bind(document);
        console.time('STT Processing');
        let text = await this.speechToText.stopRecording();
        console.timeEnd('STT Processing');
        console.log('Transcription:', text)

        const transcriptionStatus = $('#transcriptionStatus');
        transcriptionStatus.textContent = text;

        this.conversationHistory.push({
            role: "user",
            content: text
        });

        let serverUrl = $('#serverUrl').value;
        let system_prompt = $('#systemPrompt').value;

        this.conversationHistory[0].content = system_prompt;

        console.time('LLM Processing');
        const response = await fetch(serverUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                stream: true,
                "messages": this.conversationHistory
            })
        });

        const decoder = new TextDecoder("utf-8");
        const reader = response.body.getReader();
        let accumulatedText = "";
        const voiceSelect = document.getElementById('voiceSelect');
        const voiceId = (voiceSelect && voiceSelect.value) ? voiceSelect.value : "af_heart";

        // Create or get a status element for showing TTS progress
        let ttsStatusElem = document.getElementById('ttsStatus');
        if (!ttsStatusElem) {
            ttsStatusElem = document.createElement('div');
            ttsStatusElem.id = 'ttsStatus';
            ttsStatusElem.className = 'tts-status';
            document.querySelector('.transcription-container').appendChild(ttsStatusElem);
        }

        // Keep track of the number of sentences spoken
        let sentenceCount = 0;

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            //console.log(chunk);

            for (const line of chunk.split("\n")) {
                if (line.startsWith("data: ")) {
                    const payload = line.slice(6).trim();
                    if (payload === "[DONE]") {
                        if (accumulatedText.trim().length > 0) {
                            sentenceCount++;
                            console.log(`Final sentence #${sentenceCount} detected:`, accumulatedText);
                            ttsStatusElem.textContent = `Speaking final sentence #${sentenceCount}...`;
                            textToSpeech(accumulatedText, voiceId);
                        }
                        
                        setTimeout(() => {
                            ttsStatusElem.textContent = `Completed speaking ${sentenceCount} sentences`;
                            // Fade out the status after a few seconds
                            setTimeout(() => {
                                ttsStatusElem.style.opacity = '0';
                                setTimeout(() => {
                                    ttsStatusElem.style.display = 'none';
                                    ttsStatusElem.style.opacity = '1';
                                }, 1000);
                            }, 3000);
                        }, 1000);
                        console.log("\n[Stream complete]");
                        console.timeEnd('LLM Processing');
                        // Save the response to conversation history
                        this.conversationHistory.push({
                            "role": "assistant",
                            "content": accumulatedText
                        });
                        console.log("response", accumulatedText);
                        return;
                    }
                    const json = JSON.parse(payload);
                    const content = json.choices[0].delta.content || "";
                    const result = processStreamingText(accumulatedText, content);

                    // If we have complete sentences, speak them
                    if (result.sentences.length > 0) {
                        // Update status element
                        ttsStatusElem.style.display = 'block';

                        // Process each complete sentence
                        result.sentences.forEach(sentence => {
                            sentenceCount++;
                            console.log(`Sentence #${sentenceCount} detected:`, sentence);

                            // Update status to show what sentence is being spoken
                            ttsStatusElem.textContent = `Speaking sentence #${sentenceCount}...`;

                            // Send for TTS processing
                            textToSpeech(sentence, voiceId);
                        });

                        // Update the accumulated text to whatever remains
                        accumulatedText = result.remainder;
                    } else {
                        // No complete sentences yet, just keep accumulating
                        accumulatedText = result.remainder;
                    }
                }
            }
        }
        // This code will never be reached when streaming is enabled
        // because of the return statement in the "[DONE]" handling block
        console.timeEnd('LLM Processing');

        // This section is for non-streaming mode, which appears to not be used
        // But we'll keep it in case streaming is disabled
        try {
            const data = await response.json();
            const response_text = data.choices[0].message.content;
            this.conversationHistory.push({
                "role": "assistant",
                "content": response_text
            });
            console.log("response", response_text);
        } catch (error) {
            console.log("Error parsing response as JSON, likely already processed as a stream.");
        }


        // This was the original call, but now we're streaming per sentence
        // textToSpeech(reponse, "af_heart");
    }
}



