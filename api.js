// YouTube API Integration
// This file contains utility functions for fetching and processing YouTube data
// Currently uses seed data; Claude Code can replace these with real API calls

let currentGraphData = JSON.parse(JSON.stringify(seedGraphData)); // Deep copy seed data

/**
 * Fetch videos from YouTube based on search terms and hashtags
 * TODO: Replace with real YouTube API call once API key is added to config.js
 */
async function fetchVideosFromYouTube(hashtags, keywords) {
    // If no API key, use seed data
    if (!isYouTubeApiKeyValid() || !CONFIG.FEATURES.USE_YOUTUBE_API) {
        console.log('📚 Using seed data (no YouTube API key configured)');
        return currentGraphData;
    }

    try {
        console.log('🎥 Fetching from YouTube API...');
        
        // This is where Claude Code will add the actual YouTube API logic:
        // 1. Build search query from hashtags + keywords
        // 2. Call YouTube Search API
        // 3. Fetch video details (views, date, etc.)
        // 4. Transform results into graph nodes/links
        
        // For now, return seed data as fallback
        return currentGraphData;
        
    } catch (error) {
        console.error('❌ Error fetching YouTube data:', error);
        return currentGraphData; // Fallback to seed data on error
    }
}

/**
 * Build initial graph with curated hashtags
 * Returns data ready for three-force-graph
 */
async function buildInitialGraph() {
    const curatedHashtags = [
        '#MediaPipe',
        '#XR', '#AR', '#VR', '#WebXR',
        '#InteractiveArt',
        '#CreativeCoding',
        '#ThreeJS',
        '#BodyTracking', '#HandTracking',
        '#TouchDesigner',
        '#GenerativeArt'
    ];

    const result = await fetchVideosFromYouTube(curatedHashtags, ['vibe coding', 'interactive web']);
    return result;
}

/**
 * Search graph for nodes matching query
 */
function searchGraphNodes(query) {
    if (!query || query.length < CONFIG.SEARCH.MIN_MATCH_LENGTH) {
        return [];
    }

    const lowerQuery = query.toLowerCase();
    const matches = currentGraphData.nodes.filter(node => {
        const matchLabel = node.label.toLowerCase().includes(lowerQuery);
        const matchDescription = node.description && node.description.toLowerCase().includes(lowerQuery);
        return matchLabel || matchDescription;
    });

    return matches.slice(0, CONFIG.SEARCH.MAX_RESULTS);
}

/**
 * Get connections for a specific node
 */
function getNodeConnections(nodeId) {
    return currentGraphData.links.filter(
        link => link.source === nodeId || link.source.id === nodeId || 
                 link.target === nodeId || link.target.id === nodeId
    );
}

/**
 * Format node data for display in info panel
 */
function formatNodeInfo(node) {
    let html = `
        <div class="node-title">${node.label}</div>
        <div class="node-category">${node.category}</div>
    `;

    if (node.description) {
        html += `<div class="node-description">${node.description}</div>`;
    }

    if (node.category === 'tutorial') {
        html += `
            <div class="node-stats">
                <div class="stat-line">📊 Views: ${node.views || 'N/A'}</div>
                <div class="stat-line">⏱️ Duration: ${node.duration || 'N/A'}</div>
            </div>
        `;
    }

    // Show connected nodes
    const connections = getNodeConnections(node.id);
    if (connections.length > 0) {
        html += `<div class="node-stats"><strong>Connections:</strong> ${connections.length} nodes</div>`;
    }

    return html;
}

/**
 * Initialize graph data on page load
 */
async function initializeGraphData() {
    currentGraphData = await buildInitialGraph();
    return currentGraphData;
}

// Export for use in graph.js
window.API = {
    fetchVideosFromYouTube,
    buildInitialGraph,
    searchGraphNodes,
    getNodeConnections,
    formatNodeInfo,
    initializeGraphData,
    getCurrentGraphData: () => currentGraphData
};
