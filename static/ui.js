import { Conversation } from './conversation.js';


// Subtract 1 to exclude the system message
function updateResetButtonText(conversationHistory, resetButton) {
    const messageCount = conversationHistory.length - 1;
    if (messageCount > 0) {
        resetButton.textContent = `Reset Conversation (${messageCount} messages)`;
        resetButton.style.display = 'inline-block';
    } else {
        resetButton.textContent = 'Reset Conversation';
        resetButton.style.display = 'none';
    }
}

function updateTimer(recordingStartTime, recordingTimer) {
    const elapsed = new Date() - recordingStartTime;
    const seconds = Math.floor((elapsed / 1000) % 60).toString().padStart(2, '0');
    const minutes = Math.floor((elapsed / 1000 / 60) % 60).toString().padStart(2, '0');
    recordingTimer.textContent = `${minutes}:${seconds}`;
}

function displayConversation(conversationHistory, transcriptionResult) {
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
}


    


function displayTranscriptionError(transcriptionStatus, transcriptionResult, error) {
    transcriptionStatus.textContent = 'Error during transcription:';
    transcriptionResult.innerHTML = `<p class="error">${error.message}</p>`;
}

document.addEventListener('DOMContentLoaded', async function () {
    const toggleButton = document.getElementById('toggleRecording');
    const recordingStatus = document.getElementById('recordingStatus');
    const recordingIndicator = document.getElementById('recordingIndicator');
    const recordingTimer = document.getElementById('recordingTimer');
    const transcriptionStatus = document.getElementById('transcriptionStatus');
    const transcriptionResult = document.getElementById('transcriptionResult');
    const resetButton = document.getElementById('resetConversation');

    let recordingStartTime;
    let timerInterval;
    let isRecording = false;

    let system_prompt = await (await fetch("static/system_prompt.txt")).text();
    system_prompt = system_prompt.replaceAll("{{char}}", "Vanessa").replaceAll("{{user}}", "Ray");

    let conversation = new Conversation(system_prompt);
    resetButton.addEventListener('click', function () {
        conversation.resetConversation();
        transcriptionStatus.textContent = 'Conversation reset. Ready for new recording.';
        transcriptionResult.textContent = '';
        console.log('Conversation history reset');
        updateResetButtonText(conversation.conversationHistory, resetButton);
    });

    toggleButton.addEventListener('click', function () {
        if (!isRecording) {
            isRecording = true;
            toggleButton.textContent = 'Stop Recording';
            recordingStatus.textContent = 'Recording...';
            recordingIndicator.style.display = 'block';
            transcriptionStatus.textContent = 'Recording in progress...';
            transcriptionResult.textContent = '';
            recordingStartTime = new Date();
            timerInterval = setInterval(() => updateTimer(recordingStartTime, recordingTimer), 1000);
            updateTimer(recordingStartTime, recordingTimer);
            conversation.startRecording();
        } else {
            isRecording = false;
            toggleButton.textContent = 'Start Recording';
            recordingStatus.textContent = 'Recording stopped. Processing...';
            transcriptionStatus.textContent = 'Transcribing audio...';
            conversation.stopRecording().then(() => {
                // Update the conversation display after processing
                displayConversation(conversation.conversationHistory, transcriptionResult);
                updateResetButtonText(conversation.conversationHistory, resetButton);
            });
            clearInterval(timerInterval);
            recordingIndicator.style.display = 'none';
        }
    });
    // Initialize the reset button state
    updateResetButtonText(conversation.conversationHistory, resetButton);



});
