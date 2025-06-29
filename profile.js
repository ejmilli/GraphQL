import { requireAuth, logout } from './auth.js';
import { QUERIES } from './config.js';
import { fetchUserData, fetchProjectData, fetchSkillsData } from './api.js';
import { insertData } from './utils.js';
import { drawXPOverTimeGraph, drawXpTable, drawAuditRatioGraph, drawSkillsDistributionGraph } from './charts.js';

// Global state
let userData = null;

// Initialize profile page
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!requireAuth()) return;

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Load and render profile data
    renderProfile();
});

async function renderProfile() {
    const errorMsg = document.getElementById('error-msg');
    
    try {
        console.log('Loading profile data...');

        // Fetch user data
        const userResult = await fetchUserData(QUERIES.USER_INFO);
        console.log('User data:', userResult);

        if (!userResult?.user?.[0]) {
            throw new Error('User data not found in response');
        }

        const user = userResult.user[0];
        const wip = userResult.wip || [];
        userData = user;

        // Display user info
        displayUserInfo(user);

        // Get event ID for project queries
        const eventId = wip.length > 0 ? wip[0].eventId : 0;
        console.log('Using eventId:', eventId);

        // Fetch project and skills data
        const [projectResult, skillsResult] = await Promise.all([
            fetchProjectData(QUERIES.USER_PROJECT(eventId)),
            fetchSkillsData(QUERIES.USER_SKILLS)
        ]);

        console.log('Project data:', projectResult);
        console.log('Skills data:', skillsResult);

        const xpData = projectResult?.xp_view || [];
        const audits = projectResult?.audits || [];
        const skills = skillsResult?.skills || [];

        // Render all charts and tables
        drawXPOverTimeGraph(xpData);
        drawXpTable(xpData);
        drawAuditRatioGraph(userData);
        drawSkillsDistributionGraph(skills);

        console.log('Profile rendered successfully!');
    } catch (err) {
        console.error('Profile rendering error:', err);
        if (errorMsg) {
            errorMsg.textContent = `Failed to load data: ${err.message}`;
            errorMsg.style.display = 'block';
        }
    }
}

function displayUserInfo(user) {
    // Basic info
    insertData('campus', `[${user.campus || 'N/A'}:${user.labels?.[0]?.labelName || 'N/A'}]`);
    insertData('id', `${user.id}`);
    insertData('login', `${user.login}`);

    // User attributes
    if (user.attrs) {
        const fullName = `${user.attrs.firstName || ''} ${user.attrs.lastName || ''}`.trim();
        insertData('name', fullName || 'N/A');
        insertData('email', user.attrs.email || 'N/A');
        insertData('gender', user.attrs.gender || 'N/A');
        insertData('nationality', user.attrs.nationality || 'N/A');
    } else {
        console.warn('User.attrs is null or undefined');
    }
}