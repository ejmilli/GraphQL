import { CONFIG } from './config.js';
import { parseJwt } from './auth.js';

export async function queryGraphQL(query) {
    const token = sessionStorage.getItem('jwt');
    if (!token) {
        throw new Error('Not authenticated');
    }

    try {
        parseJwt(token);
    } catch (err) {
        console.error('Invalid JWT:', err);
        sessionStorage.removeItem('jwt');
        throw new Error('Session expired. Please log in again.');
    }

    const response = await fetch(CONFIG.GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (data.errors) {
        console.error('GraphQL Errors:', data.errors);
        throw new Error(data.errors[0].message);
    }

    return data.data;
}

export async function fetchUserData(query) {
    return await queryGraphQL(query);
}

export async function fetchProjectData(query) {
    return await queryGraphQL(query);
}

export async function fetchSkillsData(query) {
    return await queryGraphQL(query);
}