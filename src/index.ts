import { Context } from "@cordisjs/core";

export const name = "voice-input";

export function apply(ctx: Context) {
    //1. Logic recognition initialization in browser context
    ctx.effect(() => {
        if (typeof window === "undefined") return;

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.lang = "ru-RU";
        recognition.interimResults = true;
        recognition.continuous = true;

        recognition.onresult = (event: any) => {
            let interimTranscript = "";
            let finalTranscript = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i].transcript
                } else {
                    interimTranscript += event.results[i].transcript
                }
            }

            ctx.emit("session/voice-preview", {
                text: finalTranscript || interimTranscript,
                isFinal: finalTranscript !== ""
            });
        };

        ctx.provide("voiceController", {
            start: () =>  recognition.start(),
            stop: () => recognition.stop()
        });

        return () => recognition.stop();
    });

    // 2. Micro's button rendering in UI chat
    ctx.slot("session/input-actions", () => {
        let isRecording = false;

        const toggleRecording = () => {
            isRecording = !isRecording;
            const controller = ctx.get("voiceController");
            const btn = document.getElementById("mic-btn");

            if (isRecording) {
                controller.start();
                btn?.classList.add("recording-active");
                if (btn) btn.innerHTML = "";
            } else {
                controller.stop();
                btn?.classList.remove("recording-active");
                if (btn) btn.innerHTML = "";
            }
        };

        return
            <button id="mic-btn" onclick="${toggleRecording}" style="padding: 8px; border: none; background: transparent; cursor: pointer;">

            </button>
            ;
    });

    // 3. Text synchronization with input field
    ctx.on("session/voice-preview", ({ text, isFinal }) => {
        const inputEl = document.querySelector(".chat-input-textarea") as HTMLTextAreaElement;
        if (inputEl) {
            inputEl.value = text;
            inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
    });
}
