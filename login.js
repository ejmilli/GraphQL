import { login } from './auth.js';

// Login page functionality
document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const errorMsg = document.getElementById('error');

    if (!form) {
        console.error('Login form not found');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const identifier = document.getElementById('login-name-text').value.trim();
        const password = document.getElementById('login-password-text').value;

        if (!identifier || !password) {
            if (errorMsg) errorMsg.textContent = 'Please enter both username and password';
            return;
        }

        try {
            const token = await login(identifier, password);
            sessionStorage.setItem('jwt', token);
            window.location.href = 'profile.html';
        } catch (err) {
            if (errorMsg) {
                errorMsg.textContent = err.message;
            }
            console.error('Login error:', err);
        }
    });
});