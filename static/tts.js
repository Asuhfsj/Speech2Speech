let audioQueue = [];
let audioContext = new AudioContext();
let isPlaying = false;

const my_worker = new Worker(new URL("/static/worker.js", import.meta.url), { type: "module" });

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

export function textToSpeech(text, voice) {
    if (!text || !voice) {
        console.error("Text and voice parameters are required for text-to-speech.");
        return;
    }

    text = text.replaceAll("*", "");

    my_worker.postMessage({ type: "generate", text: text, voice: voice });
}