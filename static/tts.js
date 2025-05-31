import { AudioPlayer } from "./AudioPlayer.js";

const my_worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });

let audioPlayer = new AudioPlayer();

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
            audioPlayer.queueAudio(e.data.audio);
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
