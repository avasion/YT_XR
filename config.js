// Configuration file for API keys and application settings
// This is where you'll add your YouTube API key from Google Cloud Console

const CONFIG = {
    // YouTube API Key - Get this from Google Cloud Console
    // https://console.cloud.google.com
    YOUTUBE_API_KEY: '', // TODO: Replace with your actual API key
    
    // Backend API URL (if using a backend server to fetch YouTube data)
    // Leave empty if using seed data only
    BACKEND_URL: '', // e.g., 'http://localhost:3000' or 'https://your-api.com'
    
    // Graph settings
    GRAPH: {
        NODE_SCALE: 30,
        LINK_WIDTH: 0.5,
        LINK_OPACITY: 0.6,
        PHYSICS_STRENGTH: -30,
        PHYSICS_DISTANCE: 100,
        CAMERA_DISTANCE: 300,
    },
    
    // Search settings
    SEARCH: {
        MIN_MATCH_LENGTH: 1,
        MAX_RESULTS: 8,
        DEBOUNCE_MS: 300,
    },
    
    // Color settings
    COLORS: {
        TERRACOTTA: 0x9C4A24,
        CREATOR: 0x9C4A24,
        TUTORIAL: 0xd4a574,
        CONCEPT: 0xc9b8a8,
        HIGHLIGHT: 0xff6b6b,
        LINK: 0xcccccc,
    },
    
    // Feature flags
    FEATURES: {
        USE_YOUTUBE_API: false, // Set to true once you add API key
        SHOW_DEBUG_INFO: false,
        AUTO_ROTATE_CAMERA: false,
    }
};

// Check if API key is provided
function isYouTubeApiKeyValid() {
    return CONFIG.YOUTUBE_API_KEY && CONFIG.YOUTUBE_API_KEY.length > 0;
}

// Log configuration status
console.log('🎬 XR Graph Search Configuration:');
console.log('YouTube API Key:', isYouTubeApiKeyValid() ? '✓ Set' : '✗ Not set (using seed data)');
console.log('Backend URL:', CONFIG.BACKEND_URL || '✗ Not set');
