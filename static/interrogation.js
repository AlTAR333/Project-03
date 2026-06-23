let activeSuspect = 'A';
let currentSessionId = null;

// Hardcoded for now
const chatHistories = {
    'A': [{sender: 'system', text: "Suspect A is sitting quietly, looking at their hands."}],
    'B': [{sender: 'system', text: "Suspect B glares at you as you enter."}],
    'C': [{sender: 'system', text: "Suspect C looks nervous and avoids eye contact."}]
};

window.onload = () => {
    const token = sessionStorage.getItem('jwt_token');
    if (!token) {
        alert("Security Breach: No valid token found. You must log in first.");
        window.location.href = '/index.html';
        return;
    }
    
    const username = sessionStorage.getItem('username') || "Unknown";
    currentSessionId = sessionStorage.getItem('currentSessionId');
    
    document.getElementById('badge-display').innerText = `Detective: ${username}`;
    renderChat();
};

function switchSuspect(suspectId) {
    activeSuspect = suspectId;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${suspectId}`).classList.add('active');
    
    renderChat();
}

function renderChat() {
    const chatBox = document.getElementById('chat-box');
    chatBox.innerHTML = '';
    chatHistories[activeSuspect].forEach(msg => {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${msg.sender}-msg`;
        msgDiv.innerText = msg.text;
        chatBox.appendChild(msgDiv);
    });
    // an autoscroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendQuestion() {
    const inputEl = document.getElementById('player-input');
    const questionText = inputEl.value.trim();
    if(!questionText) return;

    chatHistories[activeSuspect].push({sender: 'player', text: questionText});
    renderChat();
    inputEl.value = '';

    const token = sessionStorage.getItem('jwt_token');

    try {
        const response = await fetch('/api/interrogate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                session_id: parseInt(currentSessionId),
                suspect_id: activeSuspect,
                message: questionText
            })
        });
        
        if (response.status === 401) {
            alert("Your session expired. Please log in again.");
            window.location.href = '/index.html';
            return;
        }

        const data = await response.json();
        chatHistories[activeSuspect].push({sender: 'suspect', text: data.reply});
        renderChat();
        
    } catch (err) {
        console.error("Network interrogation failure", err);
        chatHistories[activeSuspect].push({sender: 'system', text: "[COMMUNICATION ERROR - TRY AGAIN]"});
        renderChat();
    }
}

function goToAccusalView() {
    window.location.href = '/results.html';
}