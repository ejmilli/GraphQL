import { CONFIG } from './config.js';

// Authentication utilities
export function parseJwt(token) {
    try {
        token = token.replace(/^Bearer\s+/i, '');
        const base64Url = token.split('.')[1];
        if (!base64Url) throw new Error('Invalid JWT structure');

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padLength = 4 - (base64.length % 4);
        const paddedBase64 = padLength < 4 ? base64 + '='.repeat(padLength) : base64;

        return JSON.parse(atob(paddedBase64));
    } catch (err) {
        console.error('Failed to parse JWT:', err);
        throw new Error('Invalid token format');
    }
}

export async function login(identifier, password) {
    const response = await fetch(CONFIG.SIGNIN_URL, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${btoa(`${identifier}:${password}`)}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid credentials');
    }

    const result = await response.json().catch(() => response.text());
    const token = result.token || result;

    if (!token) throw new Error('No token received');

    // Verify token can be parsed
    parseJwt(token);
    
    return token;
}

export function logout() {
    sessionStorage.removeItem('jwt');
    window.location.href = 'index.html';
}

export function isAuthenticated() {
    const token = sessionStorage.getItem('jwt');
    if (!token) return false;
    
    try {
        parseJwt(token);
        return true;
    } catch {
        sessionStorage.removeItem('jwt');
        return false;
    }
}

export function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}