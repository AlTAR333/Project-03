window.onload = () => {
    const token = sessionStorage.getItem('jwt_token');
    if (!token) {
        window.location.href = '/index.html';
        return;
    }

    if (sessionStorage.getItem('timeoutLoss') === 'true') {
        sessionStorage.removeItem('timeoutLoss');
        submitFinalAccusation('TIMEOUT');
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
        
        if (response.status === 401) { window.location.href = '/index.html'; return; }

        const data = await response.json();
        
        document.getElementById('accusal-selection-zone').style.display = 'none';
        
        let outcomeHTML = `
            <h3 class="${data.outcome}" style="font-size: 2em; margin-bottom: 10px;">${data.outcome.toUpperCase()}</h3>
            <p style="font-size: 1.2em; max-width: 80%; margin: 0 auto; line-height: 1.5;">${data.summary}</p>
            
            <div style="background: #222; padding: 20px; border: 1px solid #444; border-radius: 8px; margin-top: 30px; display: inline-block; min-width: 300px;">
                <p style="margin: 5px 0; font-size: 1.1em;">Case Closed At: <strong style="color: #ffcc00; font-family: monospace; font-size: 1.3em;">${data.time}</strong></p>
                <p style="margin: 5px 0; font-size: 1.1em;">Total Interrogation Time: <strong>${data.questions * 3} Minutes</strong></p>
                <p style="margin: 5px 0; color: #888; font-size: 0.9em;">(Questions Asked: ${data.questions} / 60)</p>
            </div>
        `;
        document.getElementById('result-outcome').innerHTML = outcomeHTML;
        
        document.getElementById('retry-btn').classList.remove('hidden');
        
    } catch (err) {
         document.getElementById('result-outcome').innerHTML = "<p style='color:#ff3333;'>Error filing paperwork. Try again.</p>";
    }
}