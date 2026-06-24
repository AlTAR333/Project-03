async function handleRegister() {
    const user = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-password').value.trim();
    const errorDiv = document.getElementById('reg-error');
    const successDiv = document.getElementById('reg-success');
    
    // Reset messages
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
        
        // Show success message and clear inputs
        successDiv.innerText = "Badge issued successfully! Redirecting to login...";
        document.getElementById('reg-username').value = "";
        document.getElementById('reg-password').value = "";
        
        // Automatically send them back to the login page after 2 seconds
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 2000);
        
    } catch (err) {
        errorDiv.innerText = err.message;
    }
}