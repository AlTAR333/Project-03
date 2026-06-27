let activeSuspect = 'A';
let currentSessionId = null;

const chatHistories = {
    'A': [{sender: 'system', text: "The Rookie sits rigidly. He looks terrified."}],
    'B': [{sender: 'system', text: "The General glares at you as you enter. He looks annoyed to be here."}],
    'C': [{sender: 'system', text: "The Lieutenant is perfectly still, staring blankly ahead."}]
};

// overlay story text
const storyText = "Date: October 27th 2026.\nTime: 04:00 AM.\n\nYou are merely a detective of modest rank, a position you have held for far longer than you can tolerate.\n\nThe agency known as \"Scotland Yards,\" where you are employed, concurs: the time has come for you to seek alternative employment.\n\nCaptain Miller called you into his office, the air thick with stale cigar smoke and quiet disappointment. He didn’t even look up from his paperwork as he slid a thin manila folder across the desk. \"You're a liability these days,\" he grunted, finally meeting your eyes. \"Your clearance rate is in the gutter, your last three cases ended with the culprits walking free because of your sloppy footwork, and the brass is breathing down my neck to trim the fat. I've defended you for years because you used to be a good cop, but my patience is officially gone. Consider this your final exam.\"\n\nYou only had time for a short briefing before you were sent on the road:\n\n\"We just got a frantic call from a secretary, explaining to us how she found her boss, the Chief, dead sitting by his desk. No blood, no forced entry, no obvious signs of a struggle. He was just slumped over his paperwork like he dozed off working late. The local uniforms have secured the perimeter, but because this involves high-ranking brass, the FBI is already suiting up to take the glory. This is your last chance.\ If by 7 AM you still don't know what happened and who did it, you will have proven yourself useless one final time.\"\n\nThe drive to the precinct was a cold blur of neon reflections on wet asphalt. By the time you flashed your badge at the heavily guarded gates, the whispers had already infected the base. The night-shift soldiers stood in huddled groups, eyes darting nervously in the rain—the rumor of the Chief's sudden demise had spread through the barracks like a plague. \n\nYou pushed past the yellow tape and entered his office. The air was stale, but as you leaned over the Chief's rigid body, you caught a faint, sharp scent lingering near a half-empty glass on his desk. It was unmistakable. He was poisoned. Based on the initial rigor mortis and the state of the room, you estimate the lethal dose was ingested right around 10:00 PM last night, and someone had to make him ingest it. \n\nYou walked back out to the bullpen. Out of a precinct of hundreds, three individuals stand out. They have been rounded up and are currently waiting for you in the interrogation rooms down the hall.\n\nYou have exactly 3 hours before the Feds arrive and take over what will be your last case.\nEvery question you ask consumes 3 minutes of the clock.\n\nGood luck, Detective.";
let typeInterval;

const sfx = {
    buzz: new Audio('/sounds/neon-buzz.mp3'),
    zap: new Audio('/sounds/zap.mp3'),
    type: new Audio('/sounds/typewriter.mp3'),
    tick: new Audio('/sounds/tick.mp3'),
    alarm: new Audio('/sounds/alarm.mp3'),
};

sfx.buzz.loop = true;
sfx.buzz.volume = 0.2;
sfx.zap.volume = 0.6;
sfx.type.volume = 0.5;
sfx.tick.volume = 0.2;
sfx.alarm.volume = 0.8;

// document.body.addEventListener('click', () => {
//     if (sfx.buzz.paused) sfx.buzz.play();
// }, { once: true });

let flickerStarted = false;

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

function openOverlay(instant = false) {
    const overlay = document.getElementById('story-overlay');
    const contentBox = overlay.querySelector('.overlay-content');
    const textTarget = document.getElementById('typewriter-text');
    
    overlay.classList.remove('hidden');
    clearInterval(typeInterval);
    
    if (instant) {
        textTarget.innerHTML = storyText.replace(/\n/g, "<br>");
        contentBox.scrollTop = 0; 
    } else {
        textTarget.innerHTML = "";
        let i = 0;
        
        typeInterval = setInterval(() => {
            if (i < storyText.length) {
                const isScrolledToBottom = (contentBox.scrollHeight - contentBox.clientHeight) - contentBox.scrollTop <= 5;

                if (storyText.charAt(i) === '\n') {
                    textTarget.innerHTML += "<br>";
                } else {
                    textTarget.innerHTML += storyText.charAt(i);
                    if (storyText.charAt(i) !== ' ') {
                        sfx.type.currentTime = 0; 
                        sfx.type.play();
                    }
                }
                i++;

                if (isScrolledToBottom) {
                    contentBox.scrollTop = contentBox.scrollHeight;
                }
            } else {
                clearInterval(typeInterval);
            }
        }, 30);
    }
}

function closeOverlay() {
    document.getElementById('story-overlay').classList.add('hidden');
    clearInterval(typeInterval);

    if (sfx.buzz.paused) {
        sfx.buzz.play().catch(err => console.log("Audio blocked by browser:", err));
    }
    
    if (!flickerStarted) {
        startRandomFlicker();
        flickerStarted = true;
    }
}

function updateClockUI() {
    let qCount = parseInt(sessionStorage.getItem('questionCount') || 0);
    let minutesAdded = qCount * 3;
    let hours = Math.floor(4 + (minutesAdded / 60));
    let mins = minutesAdded % 60;
    
    document.getElementById('game-clock').innerText = 
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} AM`;

    if (qCount > 0) {
        sfx.tick.currentTime = 0;
        sfx.tick.play();
    }

    if (hours >= 7) {
        sfx.alarm.play();
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

function logout() {
    sessionStorage.clear();
    window.location.href = '/index.html';
}

function startRandomFlicker() {
    const bulb = document.querySelector('.bulb');
    if (!bulb) return;

    setInterval(() => {
        if (Math.random() > 0.90) {
            bulb.style.opacity = '0.2';
            sfx.zap.currentTime = 0;
            sfx.zap.play();
            
            setTimeout(() => {
                bulb.style.opacity = '1';
            }, 100 + Math.random() * 300);
        }
    }, 2000);
}