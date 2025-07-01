import { requireAuth, logout } from './auth.js';
import { QUERIES } from './config.js';
import { fetchUserData, fetchProjectData, fetchSkillsData } from './api.js';
import { insertData, formatDate } from './utils.js';
import { drawAuditRatioGraph, drawSkillsDistributionGraph } from './charts.js';

// Global state
let userData = null;
let projectData = null;
let skillsData = null;

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

        // Display user info sections
        displayBasicInfo(user);
        displayPersonalInfo(user);
        displayAcademicProgress(user);

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

        projectData = projectResult;
        skillsData = skillsResult?.skills || [];

        // Display projects section
        displayProjectsInfo(projectResult, wip);

        // Render all charts
        drawAuditRatioGraph(userData);
        drawSkillsDistributionGraph(skillsData);
      

        console.log('Profile rendered successfully!');
    } catch (err) {
        console.error('Profile rendering error:', err);
        if (errorMsg) {
            errorMsg.textContent = `Failed to load data: ${err.message}`;
            errorMsg.style.display = 'block';
        }
    }
}

// Section 1: Basic Information
function displayBasicInfo(user) {
    insertData('id', `${user.id}`);
    insertData('login', `${user.login}`);
    insertData('campus', `[${user.campus}]`);
    
    if (user.createdAt) {
        const createdDate = new Date(user.createdAt);
        insertData('createdAt', formatDate(createdDate));
    }
    
    if (user.updatedAt) {
        const updatedDate = new Date(user.updatedAt);
        insertData('updatedAt', formatDate(updatedDate));
    }
}

// Section 2: Personal Information  
function displayPersonalInfo(user) {
    if (user.attrs) {
        const fullName = `${user.attrs.firstName || ''} ${user.attrs.lastName || ''}`.trim();
        insertData('name', fullName || 'N/A');
        insertData('email', user.attrs.email || 'N/A');
        insertData('gender', user.attrs.gender || 'N/A');
        insertData('nationality', user.attrs.nationality || 'N/A');
    } else {
        console.warn('User.attrs is null or undefined');
        insertData('name', 'N/A');
        insertData('email', 'N/A');
        insertData('gender', 'N/A');
        insertData('nationality', 'N/A');
    }
}

// Section 3: Academic Progress
function displayAcademicProgress(user) {
    insertData('auditRatio', user.auditRatio ? user.auditRatio.toFixed(2) : 'N/A');
    insertData('totalUp', user.totalUp || 0);
    insertData('totalUpBonus', user.totalUpBonus || 0);
    insertData('totalDown', user.totalDown || 0);
  
   
}

// Section 4: Projects & Activities
function displayProjectsInfo(projectResult, wip) {
    const completed = projectResult?.completed || [];
    const wipCount = wip?.length || 0;
    
    insertData('completedCount', completed.length);
    insertData('wipCount', wipCount);
    
    if (completed.length > 0) {
        const latestProject = completed[0].path.split('/').pop();
        insertData('latestProject', latestProject);
    } else {
        insertData('latestProject', 'None');
    }
}