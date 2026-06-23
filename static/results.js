window.onload = () => {
    const token = sessionStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/index.html';
    }
};

async function submitFinalAccusation(suspectId) {
    const sessionId = sessionStorage.getItem('currentSessionId');
    const token = sessionStorage.getItem('jwt_token');
    
    try {
        const response = await fetch('/api/accuse', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                session_id: parseInt(sessionId),
                accused_suspect: suspectId
            })
        });
        
        if (response.status === 401) {
            alert("Session expired.");
            window.location.href = '/index.html';
            return;
        }

        const data = await response.json();
        
        document.getElementById('accusal-selection-zone').style.display = 'none';
        
        let outcomeHTML = `
            <h3 class="${data.outcome}">${data.outcome.toUpperCase()}</h3>
            <p>${data.summary}</p>
            <p class="score-display" style="font-size: 1.2em; margin-top: 20px;">
                Final Case Score: <strong style="color: #ffcc00;">${data.score} Points</strong>
            </p>
        `;
        document.getElementById('result-outcome').innerHTML = outcomeHTML;
        
        document.getElementById('retry-btn').classList.remove('hidden');
        
    } catch (err) {
         console.error("Error processing judgement", err);
         document.getElementById('result-outcome').innerHTML = "<p style='color:#ff3333;'>Error filing paperwork. Try again.</p>";
    }
}