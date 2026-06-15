// Seed data for the graph - works immediately without API key
// Replace this data with real YouTube API calls once you add your key to config.js

const seedGraphData = {
    nodes: [
        // Creators (Category: creator)
        {
            id: 'zach_lieberman',
            label: 'Zach Lieberman',
            category: 'creator',
            description: 'Founder of Coding Train\'s creative coding movement. Masters of hand tracking and interactive installations.',
            color: '#9C4A24',
            size: 2
        },
        {
            id: 'blankensmith',
            label: 'Blankensmith',
            category: 'creator',
            description: 'Interactive art and generative design. Creates immersive web experiences with three.js.',
            color: '#9C4A24',
            size: 1.8
        },
        {
            id: 'dom_scott',
            label: 'Dom Scott',
            category: 'creator',
            description: 'WebGL and shader tutorials. Focus on 3D graphics programming for web.',
            color: '#9C4A24',
            size: 1.6
        },
        {
            id: 'patt_vira',
            label: 'Patt Vira',
            category: 'creator',
            description: 'TouchDesigner and real-time graphics. Creating interactive installations.',
            color: '#9C4A24',
            size: 1.6
        },
        {
            id: 'kyle_getty',
            label: 'Kyle Getty',
            category: 'creator',
            description: 'Three.js tutorials and 3D web experiences.',
            color: '#9C4A24',
            size: 1.5
        },

        // Videos/Tutorials (Category: tutorial)
        {
            id: 'video_mediapipe_hands',
            label: 'MediaPipe Hand Tracking Basics',
            category: 'tutorial',
            description: 'Getting started with hand detection and tracking using MediaPipe.',
            color: '#d4a574',
            size: 1.5
        },
        {
            id: 'video_threejs_intro',
            label: 'Three.js for Beginners',
            category: 'tutorial',
            description: 'Introduction to 3D graphics on the web with Three.js.',
            color: '#d4a574',
            size: 1.5
        },
        {
            id: 'video_vibe_coding',
            label: 'Vibe Coding: AI + Creative Code',
            category: 'tutorial',
            description: 'Using AI to assist in creative coding workflows.',
            color: '#d4a574',
            size: 1.4
        },
        {
            id: 'video_ar_mobile',
            label: 'AR on Mobile with WebAR',
            category: 'tutorial',
            description: 'Building augmented reality experiences for phones.',
            color: '#d4a574',
            size: 1.4
        },
        {
            id: 'video_ml5_pose',
            label: 'Pose Detection with ml5.js',
            category: 'tutorial',
            description: 'Using machine learning for body pose estimation.',
            color: '#d4a574',
            size: 1.3
        },
        {
            id: 'video_touchdesigner',
            label: 'Real-Time Motion Graphics in TouchDesigner',
            category: 'tutorial',
            description: 'Creating responsive visual installations.',
            color: '#d4a574',
            size: 1.3
        },
        {
            id: 'video_webgl_shaders',
            label: 'WebGL Shaders Deep Dive',
            category: 'tutorial',
            description: 'Advanced shader programming for the web.',
            color: '#d4a574',
            size: 1.3
        },
        {
            id: 'video_p5js_intro',
            label: 'p5.js Creative Coding',
            category: 'tutorial',
            description: 'Generative art and interactive sketches with p5.js.',
            color: '#d4a574',
            size: 1.3
        },

        // Topics/Concepts (Category: concept)
        {
            id: 'concept_hand_tracking',
            label: '#HandTracking',
            category: 'concept',
            description: 'Detecting and tracking human hands in 3D space.',
            color: '#c9b8a8',
            size: 1.2
        },
        {
            id: 'concept_body_tracking',
            label: '#BodyTracking',
            category: 'concept',
            description: 'Full body pose and skeleton detection.',
            color: '#c9b8a8',
            size: 1.2
        },
        {
            id: 'concept_webxr',
            label: '#WebXR',
            category: 'concept',
            description: 'Immersive web experiences: VR and AR in the browser.',
            color: '#c9b8a8',
            size: 1.2
        },
        {
            id: 'concept_generative_art',
            label: '#GenerativeArt',
            category: 'concept',
            description: 'Art created through code and algorithmic processes.',
            color: '#c9b8a8',
            size: 1.2
        },
        {
            id: 'concept_interactive_install',
            label: '#InteractiveInstallation',
            category: 'concept',
            description: 'Physical or digital installations that respond to user input.',
            color: '#c9b8a8',
            size: 1.1
        }
    ],

    links: [
        // Creator -> Videos (created)
        { source: 'zach_lieberman', target: 'video_mediapipe_hands', type: 'created' },
        { source: 'zach_lieberman', target: 'video_vibe_coding', type: 'created' },
        { source: 'blankensmith', target: 'video_threejs_intro', type: 'created' },
        { source: 'blankensmith', target: 'video_generative', type: 'created' },
        { source: 'dom_scott', target: 'video_webgl_shaders', type: 'created' },
        { source: 'patt_vira', target: 'video_touchdesigner', type: 'created' },
        { source: 'kyle_getty', target: 'video_threejs_intro', type: 'created' },

        // Videos -> Concepts (relates_to)
        { source: 'video_mediapipe_hands', target: 'concept_hand_tracking', type: 'relates_to' },
        { source: 'video_ml5_pose', target: 'concept_body_tracking', type: 'relates_to' },
        { source: 'video_ar_mobile', target: 'concept_webxr', type: 'relates_to' },
        { source: 'video_threejs_intro', target: 'concept_generative_art', type: 'relates_to' },
        { source: 'video_vibe_coding', target: 'concept_generative_art', type: 'relates_to' },
        { source: 'video_touchdesigner', target: 'concept_interactive_install', type: 'relates_to' },

        // Video -> Video (similar_topic)
        { source: 'video_mediapipe_hands', target: 'video_ml5_pose', type: 'similar_topic' },
        { source: 'video_threejs_intro', target: 'video_webgl_shaders', type: 'similar_topic' },
        { source: 'video_ar_mobile', target: 'video_threejs_intro', type: 'similar_topic' },
        { source: 'video_vibe_coding', target: 'video_p5js_intro', type: 'similar_topic' },

        // Creator -> Concept (expertise)
        { source: 'zach_lieberman', target: 'concept_hand_tracking', type: 'expertise' },
        { source: 'blankensmith', target: 'concept_generative_art', type: 'expertise' },
        { source: 'dom_scott', target: 'concept_webxr', type: 'expertise' },
        { source: 'patt_vira', target: 'concept_interactive_install', type: 'expertise' }
    ]
};
