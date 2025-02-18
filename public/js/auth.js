// Initialize Firebase Auth
const auth = firebase.auth();

// Auth state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in
        console.log('User is signed in:', user.email);
        updateUIForAuthenticatedUser(user);
    } else {
        // User is signed out
        console.log('User is signed out');
        window.location.href = '/login.html';
    }
});

// Sign up function
async function signUp(email, password) {
    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Sign up failed');
        }

        // Automatically log in after successful signup
        await signIn(email, password);
    } catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
}

// Sign in function
async function signIn(email, password) {
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Sign in failed');
        }

        window.location.href = '/index.html';
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}

// Sign out function
async function signOut() {
    try {
        await fetch('/api/logout', { method: 'POST' });
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Error signing out:', error);
    }
}

// Update UI for authenticated user
function updateUIForAuthenticatedUser(user) {
    const userEmail = document.querySelector('.user-email');
    if (userEmail) {
        userEmail.textContent = user.email;
    }
}

// Add event listener for sidebar sign out link
document.addEventListener('DOMContentLoaded', () => {
    const signOutLink = document.querySelector('a[href="login.html"]');
    if (signOutLink) {
        signOutLink.addEventListener('click', async (e) => {
            e.preventDefault();
            await signOut();
        });
    }
}); 