// Main graph visualization and interaction logic
// Uses three-force-graph for 3D force-directed graph simulation

let Graph;
let selectedNode = null;
let currentGraphData = null;
let wasdKeys = { w: false, a: false, s: false, d: false };
const cameraSpeed = 1;

/**
 * Initialize the 3D graph visualization
 */
async function initializeGraph() {
    const container = document.getElementById('graph-container');
    
    // Initialize graph data from API (or seed data)
    currentGraphData = await API.initializeGraphData();
    
    // Create three-force-graph instance
    Graph = ForceGraph3D()
        (container)
        .graphData(currentGraphData)
        .nodeLabel('label')
        .nodeAutoColorBy('category')
        .nodeThreeObject(node => createNodeMesh(node))
        .onNodeClick(handleNodeClick)
        .linkThreeObjectExtend(true)
        .linkThreeObject(link => createLinkMesh(link))
        .linkPositionUpdate((linkObject, { start, end }) => {
            Object.assign(linkObject.position, start);
            Object.assign(linkObject.lookAt(end));
        })
        .d3Force('charge', null) // Disable default charge
        .d3Force('charge', 
            require('d3-force').forceManyBody()
                .strength(CONFIG.GRAPH.PHYSICS_STRENGTH)
        )
        .d3Force('link',
            require('d3-force').forceLink()
                .distance(CONFIG.GRAPH.PHYSICS_DISTANCE)
        )
        .nodeOpacity(0.95)
        .linkOpacity(CONFIG.GRAPH.LINK_OPACITY)
        .linkColor(() => `#${CONFIG.COLORS.LINK.toString(16).padStart(6, '0')}`)
        .enableNodeDrag(true)
        .enableNavigationControls(true)
        .showNavInfo(false);

    // Set initial camera position
    Graph.cameraPosition({
        x: 0,
        y: 0,
        z: CONFIG.GRAPH.CAMERA_DISTANCE
    });

    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Graph initialized with', currentGraphData.nodes.length, 'nodes and', currentGraphData.links.length, 'links');
}

/**
 * Create 3D mesh for node visualization
 */
function createNodeMesh(node) {
    const size = (node.size || 1) * CONFIG.GRAPH.NODE_SCALE;
    
    // Create sphere geometry
    const geometry = new THREE.IcosahedronGeometry(size / 2, 4);
    
    // Parse color (handle both hex string and number)
    let colorValue;
    if (typeof node.color === 'string') {
        colorValue = new THREE.Color(node.color);
    } else {
        colorValue = new THREE.Color(node.color || CONFIG.COLORS.TERRACOTTA);
    }
    
    const material = new THREE.MeshStandardMaterial({
        color: colorValue,
        emissive: colorValue,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.3,
        wireframe: false
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    
    // Store original material for highlighting
    mesh.userData.originalMaterial = material.clone();
    mesh.userData.nodeId = node.id;
    
    return mesh;
}

/**
 * Create mesh for link visualization
 */
function createLinkMesh(link) {
    const geometry = new THREE.CylinderGeometry(
        CONFIG.GRAPH.LINK_WIDTH * 0.5,
        CONFIG.GRAPH.LINK_WIDTH * 0.5,
        1
    );
    
    const material = new THREE.MeshLine.MeshLineMaterial({
        color: 0xcccccc,
        lineWidth: CONFIG.GRAPH.LINK_WIDTH,
        opacity: CONFIG.GRAPH.LINK_OPACITY
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.linkType = link.type;
    
    return mesh;
}

/**
 * Handle node click for selection and info display
 */
function handleNodeClick(node) {
    selectedNode = node;
    
    // Update info panel
    const infoPanel = document.getElementById('nodeInfo');
    infoPanel.innerHTML = API.formatNodeInfo(node);
    
    // Highlight selected node
    highlightNode(node);
    
    // Pan camera to node
    Graph.cameraPosition(
        {
            x: node.x,
            y: node.y,
            z: node.z + 80
        },
        {
            x: node.x,
            y: node.y,
            z: node.z
        },
        1000 // animation duration
    );
}

/**
 * Highlight selected node by changing its appearance
 */
function highlightNode(node) {
    // Reset previous selection
    Graph.nodeThreeObject().children.forEach(mesh => {
        if (mesh.userData.originalMaterial) {
            mesh.material = mesh.userData.originalMaterial.clone();
        }
    });
    
    // Highlight new selection
    if (node && node.__threeObj) {
        const highlightMaterial = new THREE.MeshStandardMaterial({
            color: CONFIG.COLORS.HIGHLIGHT,
            emissive: CONFIG.COLORS.HIGHLIGHT,
            emissiveIntensity: 0.5,
            roughness: 0.3,
            metalness: 0.4,
            wireframe: false
        });
        
        node.__threeObj.material = highlightMaterial;
    }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    let searchTimeout;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.trim();
            if (query.length > 0) {
                handleSearch(query);
            } else {
                clearSearch();
            }
        }, CONFIG.SEARCH.DEBOUNCE_MS);
    });

    // Keyboard controls for WASD navigation
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w') wasdKeys.w = true;
        if (key === 'a') wasdKeys.a = true;
        if (key === 's') wasdKeys.s = true;
        if (key === 'd') wasdKeys.d = true;
    });

    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key === 'w') wasdKeys.w = false;
        if (key === 'a') wasdKeys.a = false;
        if (key === 's') wasdKeys.s = false;
        if (key === 'd') wasdKeys.d = false;
    });

    // WASD camera movement loop
    setInterval(() => {
        if (!Graph) return;
        
        const camera = Graph.camera();
        const moveDistance = cameraSpeed;
        
        // Get camera direction vectors
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        
        const right = new THREE.Vector3();
        right.crossVectors(camera.up, direction).normalize();
        
        // Apply movement
        if (wasdKeys.w) {
            camera.position.addScaledVector(direction, moveDistance);
        }
        if (wasdKeys.s) {
            camera.position.addScaledVector(direction, -moveDistance);
        }
        if (wasdKeys.a) {
            camera.position.addScaledVector(right, moveDistance);
        }
        if (wasdKeys.d) {
            camera.position.addScaledVector(right, -moveDistance);
        }
    }, 30);
}

/**
 * Handle search input and display results
 */
function handleSearch(query) {
    const results = API.searchGraphNodes(query);
    const resultsContainer = document.getElementById('searchResults');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p class="search-result-item" style="color: #999;">No results found</p>';
        return;
    }
    
    resultsContainer.innerHTML = results.map(node => `
        <div class="search-result-item" data-node-id="${node.id}">
            <div class="search-result-category">${node.category}</div>
            <div>${node.label}</div>
        </div>
    `).join('');
    
    // Add click handlers to results
    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const nodeId = item.getAttribute('data-node-id');
            const node = currentGraphData.nodes.find(n => n.id === nodeId);
            if (node) {
                handleNodeClick(node);
            }
        });
    });
}

/**
 * Clear search results
 */
function clearSearch() {
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchInput').value = '';
}

/**
 * Initialize on page load
 */
document.addEventListener('DOMContentLoaded', () => {
    initializeGraph();
});
