async function handleRegister() {
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value.trim();
    const errorDiv = document.getElementById('reg-error');
    const successDiv = document.getElementById('reg-success');
    
    errorDiv.innerText = "";
    successDiv.innerText = "";

    if (!user || !pass) {
        errorDiv.innerText = "Both fields are required to issue a badge.";
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: user, password: pass})
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || "Database error occurred.");
        }
        
        successDiv.innerText = "Badge issued successfully! Redirecting to login...";
        document.getElementById('reg-username').value = "";
        document.getElementById('reg-password').value = "";
        
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
        
    } catch (err) {
        errorDiv.innerText = err.message;
    }
}