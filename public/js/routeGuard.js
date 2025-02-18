// Check if we're on the login page
const isLoginPage = window.location.pathname.includes('login.html');

// Function to check authentication
async function checkAuthStatus() {
    try {
        const response = await fetch('/api/user');
        const isAuthenticated = response.ok;

        if (!isAuthenticated && !isLoginPage) {
            // Not authenticated and not on login page - redirect to login
            window.location.href = '/login.html';
        } else if (isAuthenticated && isLoginPage) {
            // Authenticated and on login page - redirect to index
            window.location.href = '/index.html';
        }
    } catch (error) {
        if (!isLoginPage) {
            window.location.href = '/login.html';
        }
    }
}

// Check auth status when page loads
document.addEventListener('DOMContentLoaded', checkAuthStatus); 