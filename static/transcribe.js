import { pipeline } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.1/dist/transformers.js";
import { convertAudioBufferToWav, resampleAudio } from "/static/convertAudioBufferToWav.js";

let my_worker = new Worker(new URL("/static/worker.js", import.meta.url), { type: "module" });
let audioQueue = [];
let audioContext = new AudioContext();
let isPlaying = false;

const playAudioQueue = async () => {
    if (isPlaying || audioQueue.length === 0) return;
    isPlaying = true;
    try {
        while (audioQueue.length > 0) {
            const audioBuffer = audioQueue.shift();
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);
            if (audioContext.state === "suspended") {
                await audioContext.resume();
                console.log("AudioContext resumed.");
            }
            console.log("Playing audio buffer");
            await new Promise((resolve) => {
                source.onended = resolve;
                source.start();
            });
            console.log("Audio playback finished.");
        }
    } catch (error) {
        console.error("Error during audio playback:", error);
    } finally {
        isPlaying = false;
    }
};

const onMessageReceived = async (e) => {
    switch (e.data.status) {
        case "ready":
            break;

        case "device":
            console.log(e.data);
            break;

        case "progress":
            break;

        case "stream":
            console.log("stream", e.data);
            audioQueue.push(await audioContext.decodeAudioData(e.data.audio));
            playAudioQueue();
            break;
    }
};

const onErrorReceived = (e) => { console.error("Worker error:", e); };

my_worker.addEventListener("message", onMessageReceived);
my_worker.addEventListener("error", onErrorReceived);

async function detectWebGPU() {
    try {
        const adapter = await navigator.gpu.requestAdapter();
        return !!adapter;
    } catch (e) {
        return false;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    let mediaRecorder;
    let audioChunks = [];
    let recordingStartTime;
    let timerInterval;
    let mode;    let wav;
    // Array to store conversation history
    let conversationHistory = [
        {
            role: "system",
            content: "You are a customer."
        }
    ];
      // Function to reset conversation history
    function resetConversation() {
        conversationHistory = [
            {
                role: "system",
                content: "You are a customer."
            }
        ];
        transcriptionStatus.textContent = 'Conversation reset. Ready for new recording.';
        transcriptionResult.textContent = '';
        console.log('Conversation history reset');
        updateResetButtonText();
    }
    const startButton = document.getElementById('startRecording');
    const stopButton = document.getElementById('stopRecording');
    const recordingStatus = document.getElementById('recordingStatus');
    const recordingIndicator = document.getElementById('recordingIndicator');    const recordingTimer = document.getElementById('recordingTimer');
    const transcriptionStatus = document.getElementById('transcriptionStatus');
    const transcriptionResult = document.getElementById('transcriptionResult');
    const resetButton = document.getElementById('resetConversation');
      // Add event listener for reset conversation button
    resetButton.addEventListener('click', function() {
        resetConversation();
    });
    
    // Function to update the reset button text with conversation count
    function updateResetButtonText() {
        // Subtract 1 to exclude the system message
        const messageCount = conversationHistory.length - 1;
        if (messageCount > 0) {
            resetButton.textContent = `Reset Conversation (${messageCount} messages)`;
            resetButton.style.display = 'inline-block';
        } else {
            resetButton.textContent = 'Reset Conversation';
            resetButton.style.display = 'none';
        }
    }
    
    // Initial update of reset button
    updateResetButtonText();

    function updateTimer() {
        const elapsed = new Date() - recordingStartTime;
        const seconds = Math.floor((elapsed / 1000) % 60).toString().padStart(2, '0');
        const minutes = Math.floor((elapsed / 1000 / 60) % 60).toString().padStart(2, '0');
        recordingTimer.textContent = `${minutes}:${seconds}`;
    }

    startButton.addEventListener('click', function () {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                startButton.disabled = true;
                stopButton.disabled = false;

                recordingStatus.textContent = 'Recording...';
                recordingIndicator.style.display = 'block';
                transcriptionStatus.textContent = 'Recording in progress...';
                transcriptionResult.textContent = '';

                recordingStartTime = new Date();
                timerInterval = setInterval(updateTimer, 1000);
                updateTimer();

                mode = "WAV";
                const options = { mimeType: 'audio/wav' };
                try {
                    mediaRecorder = new MediaRecorder(stream, options);
                } catch (e) {
                    console.info('WAV format not supported, using default format.');
                    mediaRecorder = new MediaRecorder(stream);
                    mode = "OGG";
                }
                audioChunks = [];

                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.start();
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                recordingStatus.textContent = 'Error accessing microphone: ' + error.message;
            });
    });

    // Stop recording and process the audio locally
    stopButton.addEventListener('click', function () {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
            clearInterval(timerInterval);

            recordingIndicator.style.display = 'none';
            recordingStatus.textContent = 'Recording stopped. Processing...';
            startButton.disabled = false;
            stopButton.disabled = true; 
            mediaRecorder.onstop = async () => {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
                // Create blob with WAV MIME type
                let type = { type: 'audio/webm;codecs=opus' }
                if (mode === "WAV") {
                    type = { type: 'audio/wav' };
                }

                if (mode === "WAV") {
                    console.log('WAV format is already selected.');
                } else {
                    console.info('Converting audio to WAV format...');
                    const audioContext = new AudioContext();
                    let audioBlob = new Blob(audioChunks, { type: type });
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    //console.log("arrayBuffer", arrayBuffer)
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    //console.log('Audio buffer decoded:', audioBuffer);
                    //wav = audioBuffer.getChannelData(0); // Float32Array of first channel
                    //console.log(wav)
                    wav = convertAudioBufferToWav(audioBuffer);
                }

                transcriptionStatus.textContent = 'Transcribing audio...';
                try {
                    const isWebGPUSupported = await detectWebGPU();
                    const device = isWebGPUSupported ? "webgpu" : "wasm";
                    const dtype = isWebGPUSupported ? "fp32" : "q8";
                    const options = {
                        device: device,
                        dtype: dtype,
                        quantized: !isWebGPUSupported,
                    };

                    const transcriber = await pipeline(
                        'automatic-speech-recognition',
                        'onnx-community/moonshine-base-ONNX',
                        options
                    );

                    console.log('Transcriber loaded:', transcriber);

                    //wav = await resampleAudio(wav, 16000);
                    //const output = await transcriber(wav);

                    let wavBlob = new Blob([wav], { type: 'audio/wav' });
                    const wavBlobUrl = URL.createObjectURL(wavBlob);
                    const output = await transcriber(wavBlobUrl);                    console.log('Transcription output:', output.text)
                      // Add the user's message to conversation history
                    conversationHistory.push({
                        role: "user",
                        content: output.text
                    });

                    const response = await fetch("http://localhost:8080/v1/chat/completions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            "messages": conversationHistory
                        })
                    });

                    const data = await response.json();
                    const text = data.choices[0].message.content;
                      // Add the assistant's response to conversation history
                    conversationHistory.push({
                        "role": "assistant",
                        "content": text
                    });
                    
                    // Update reset button to show message count
                    updateResetButtonText();
                      
                    console.log('Conversation history:', conversationHistory);
                    console.log(text);

                    my_worker.postMessage({ type: "generate", text: text, voice: "af" });

                    // Display the full conversation history
                    transcriptionStatus.textContent = 'Conversation:';
                    
                    // Create HTML to display the conversation
                    let conversationHTML = '';
                    // Skip the system message at index 0
                    for (let i = 1; i < conversationHistory.length; i++) {
                        const message = conversationHistory[i];
                        const roleClass = message.role === 'user' ? 'user-message' : 'assistant-message';
                        const roleLabel = message.role === 'user' ? 'You' : 'Assistant';
                        conversationHTML += `<div class="${roleClass}">
                            <strong>${roleLabel}:</strong> ${message.content}
                        </div>`;
                    }
                    
                    transcriptionResult.innerHTML = conversationHTML;
                    console.log('Transcription output:', data);                } catch (error) {
                    console.error('Error during transcription:', error);
                    transcriptionStatus.textContent = 'Error during transcription:';
                    transcriptionResult.innerHTML = `<p class="error">${error.message}</p>`;
                    
                    // Even on error, we should update the reset button if we have a conversation history
                    if (conversationHistory.length > 1) {
                        updateResetButtonText();
                    }
                }
            };
        }
    });
});
