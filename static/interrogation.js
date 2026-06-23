let activeSuspect = 'A';
let currentSessionId = null;

const chatHistories = {
    'A': [{sender: 'system', text: "The Rookie sits rigidly. He looks terrified."}],
    'B': [{sender: 'system', text: "The General glares at you as you enter. He looks annoyed to be here."}],
    'C': [{sender: 'system', text: "The Lieutenant is perfectly still, staring blankly ahead."}]
};

const storyText = "Date: October 24th.\nTime: 04:00 AM.\n\nThe Chief Inspector was found poisoned.\nYou have been called in. Three suspects are waiting in the interrogation rooms.\n\nYou have exactly 3 hours before the Feds arrive and take over the case.\nEvery question you ask consumes 3 minutes of the clock.\n\nFind the killer before 7:00 AM, or the case goes cold.";
let typeInterval;

window.onload = () => {
    const token = sessionStorage.getItem('jwt_token');
    if (!token) { window.location.href = '/index.html'; return; }
    
    currentSessionId = sessionStorage.getItem('currentSessionId');
    document.getElementById('badge-display').innerText = `Detective: ${sessionStorage.getItem('username')}`;
    
    let qCount = sessionStorage.getItem('questionCount');
    if (!qCount || qCount === '0') {
        sessionStorage.setItem('questionCount', 0);
        openOverlay();
    }
    
    updateClockUI();
    renderChat();
};

function openOverlay() {
    document.getElementById('story-overlay').classList.remove('hidden');
    document.getElementById('typewriter-text').innerText = "";
    let i = 0;
    clearInterval(typeInterval);
    
    typeInterval = setInterval(() => {
        if (i < storyText.length) {
            if (storyText.charAt(i) === '\n') {
                document.getElementById('typewriter-text').innerHTML += "<br>";
            } else {
                document.getElementById('typewriter-text').innerHTML += storyText.charAt(i);
            }
            i++;
        } else {
            clearInterval(typeInterval);
        }
    }, 35); // typing speed (to change)
}

function closeOverlay() {
    document.getElementById('story-overlay').classList.add('hidden');
    clearInterval(typeInterval);
}

function updateClockUI() {
    let qCount = parseInt(sessionStorage.getItem('questionCount') || 0);
    let minutesAdded = qCount * 3;
    let hours = Math.floor(4 + (minutesAdded / 60));
    let mins = minutesAdded % 60;
    
    document.getElementById('game-clock').innerText = 
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} AM`;

    if (hours >= 7) {
        alert("07:00 AM. Time is up! The Feds just walked into the precinct.");
        sessionStorage.setItem('timeoutLoss', 'true');
        window.location.href = '/results.html';
    }
}

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
            window.location.href = '/index.html'; return;
        }

        const data = await response.json();
        chatHistories[activeSuspect].push({sender: 'suspect', text: data.reply});
        
        let currentQ = parseInt(sessionStorage.getItem('questionCount') || 0);
        sessionStorage.setItem('questionCount', currentQ + 1);
        updateClockUI();
        
        renderChat();
    } catch (err) {
        chatHistories[activeSuspect].push({sender: 'system', text: "[COMMUNICATION ERROR]"});
        renderChat();
    }
}

function goToAccusalView() { window.location.href = '/results.html'; }