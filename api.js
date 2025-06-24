import { CONFIG } from './config.js';

// Generic GraphQL fetch function
async function fetchGraphQL(query) {
    const token = sessionStorage.getItem('jwt');
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(CONFIG.GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        throw new Error(`GraphQL error: ${result.errors[0]?.message || 'Unknown error'}`);
    }

    return result.data;
}

// Fetch user data
export async function fetchUserData(query) {
    try {
        console.log('Fetching user data...');
        const data = await fetchGraphQL(query);
        console.log('User data response:', data);
        return data;
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

// Fetch project data
export async function fetchProjectData(query) {
    try {
        console.log('Fetching project data...');
        const data = await fetchGraphQL(query);
        console.log('Project data response:', data);
        return data;
    } catch (error) {
        console.error('Error fetching project data:', error);
        throw error;
    }
}

// Fetch skills data
export async function fetchSkillsData(query) {
    try {
        console.log('Fetching skills data...');
        const data = await fetchGraphQL(query);
        console.log('Skills data response:', data);
        return data;
    } catch (error) {
        console.error('Error fetching skills data:', error);
        throw error;
    }
}