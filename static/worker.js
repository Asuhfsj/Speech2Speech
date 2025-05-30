import { KokoroTTS } from "./kokoro.js";
import { splitTextSmart } from "./semantic-split.js";

async function detectWebGPU() {
    try {
        const adapter = await navigator.gpu.requestAdapter();
        return !!adapter;
    } catch (e) {
        return false;
    }
}

const device = (await detectWebGPU()) ? "webgpu" : "wasm";
self.postMessage({ status: "device", device });

let model_id = "onnx-community/Kokoro-82M-v1.0-ONNX";


const tts = await KokoroTTS.from_pretrained(model_id, {
    dtype: device === "wasm" ? "q8" : "fp32",
    device,
    progress_callback: (progress) => {
        // Report progress to main thread
        self.postMessage({ status: "progress", progress });
    }
}).catch((e) => {
    self.postMessage({ status: "error", error: e.message });
    throw e;
});

self.postMessage({ status: "ready", voices: tts.voices, device });

self.addEventListener("message", async (e) => {
    let chunks = splitTextSmart(text, 600);

    for (const chunk of chunks) {
        console.log("chunk", chunk);
        const audio = await tts.generate(chunk, { voice });
        console.log("generate done");
        const wavData = audio.toWav(); // this is now an ArrayBuffer
        self.postMessage({ status: "stream", audio: wavData, text: chunk }, [wavData]);
    }

    self.postMessage({ status: "complete" });
});

