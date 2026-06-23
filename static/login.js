async function handleLogin() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');
    errorDiv.innerText = "";

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username: user, password: pass})
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || "Unauthorized badge credentials.");
        }
        
        //we save the jwt
        sessionStorage.setItem('jwt_token', data.token);
        sessionStorage.setItem('username', user); 
        sessionStorage.setItem('currentSessionId', data.session_id);     
        //and then redirect
        window.location.href = '/interrogation.html';
        
    } catch (err) {
        errorDiv.innerText = err.message;
    }
}