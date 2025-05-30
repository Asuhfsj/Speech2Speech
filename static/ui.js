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

document.addEventListener('DOMContentLoaded', function () {
    const startButton = document.getElementById('startRecording');
    const stopButton = document.getElementById('stopRecording');
    const recordingStatus = document.getElementById('recordingStatus');
    const recordingIndicator = document.getElementById('recordingIndicator');
    const recordingTimer = document.getElementById('recordingTimer');
    const transcriptionStatus = document.getElementById('transcriptionStatus');
    const transcriptionResult = document.getElementById('transcriptionResult');
    const resetButton = document.getElementById('resetConversation');

    let recordingStartTime;
    let timerInterval;


    let conversation = new Conversation();
    conversation.initialize();
 
    startButton.disabled = false;
    stopButton.disabled = true;


    resetButton.addEventListener('click', function () {
        conversation.resetConversation();
        transcriptionStatus.textContent = 'Conversation reset. Ready for new recording.';
        transcriptionResult.textContent = '';
        console.log('Conversation history reset');
        updateResetButtonText(conversationHistory, resetButton);
    });

    startButton.addEventListener('click', function () {
        startButton.disabled = true;
        stopButton.disabled = false;
        recordingStatus.textContent = 'Recording...';
        recordingIndicator.style.display = 'block';
        transcriptionStatus.textContent = 'Recording in progress...';
        transcriptionResult.textContent = '';
        recordingStartTime = new Date();
        timerInterval = setInterval(() => updateTimer(recordingStartTime, recordingTimer), 1000);
        updateTimer(recordingStartTime, recordingTimer);
        conversation.startRecording();
    });

    stopButton.addEventListener('click', function () {
        recordingStatus.textContent = 'Recording stopped. Processing...';
        transcriptionStatus.textContent = 'Transcribing audio...';
        conversation.stopRecording();
        clearInterval(timerInterval);
        recordingIndicator.style.display = 'none';
        startButton.disabled = false;
        stopButton.disabled = true;

    });


    //updateResetButtonText(conversationHistory, resetButton);
    //updateResetButtonText(conversationHistory, resetButton);



});
