async function checkAuth() {
    try {
        const response = await fetch('/api/user');
        if (!response.ok) {
            window.location.href = '/login.html';
        }
    } catch (error) {
        window.location.href = '/login.html';
    }
}

// Call this when the page loads
document.addEventListener('DOMContentLoaded', checkAuth); 