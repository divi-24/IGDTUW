import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import gsap from 'gsap';

// Scene, Camera, Renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 20, 50);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.25;
controls.enableZoom = true;

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(10, 20, 10);
scene.add(ambientLight, directionalLight);

// Grid Helper for Debugging
const gridHelper = new THREE.GridHelper(100, 100);
scene.add(gridHelper);

// Create "Coming Soon" text
const fontLoader = new FontLoader();
let textMesh;

fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function(font) {
    const textGeometry = new TextGeometry('Coming Soon', {
        font: font,
        size: 10,
        height: 2,
    });
    
    const textMaterial = new THREE.MeshBasicMaterial({ 
        color: 'white'
    });
    
    textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textGeometry.center();
    textMesh.position.set(0, 20, 0); // Position the text above the map
    scene.add(textMesh);
});

// GLTF Model Loader
const gltfLoader = new GLTFLoader();
gltfLoader.load(
    'models/igdtuw.glb',
    (gltf) => {
        const campus = gltf.scene;
        scene.add(campus);
        document.getElementById('loading-screen').style.display = 'none';
    },
    undefined,
    (error) => {
        console.error('Error loading GLTF model:', error);
        // If model fails to load, still hide loading screen
        document.getElementById('loading-screen').style.display = 'none';
    }
);

// Responsive Window Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
    requestAnimationFrame(animate);
    
    if (textMesh) {
        textMesh.rotation.y += 0.01; // Rotate the text
    }
    
    controls.update();
    renderer.render(scene, camera);
}

animate();

// Building and Navigation Data
const buildings = [
    { name: 'Library', position: { x: 10, y: 0, z: 15 } },
    { name: 'Hostel', position: { x: -10, y: 0, z: -15 } },
    { name: 'Main Gate', position: { x: 0, y: 0, z: 0 } },
    { name: 'Academic Block', position: { x: 5, y: 0, z: -5 } },
];

const paths = [
    { from: 'Main Gate', to: 'Library', waypoints: [{ x: 5, y: 0, z: 10 }] },
    { from: 'Main Gate', to: 'Hostel', waypoints: [{ x: -5, y: 0, z: -10 }] },
    { from: 'Library', to: 'Academic Block', waypoints: [{ x: 7, y: 0, z: 10 }] },
];

// Highlight Buildings
function highlightBuilding(building) {
    const buildingObject = scene.getObjectByName(building.name);
    if (buildingObject) {
        buildingObject.material.emissive.set(0x00ff00);
        setTimeout(() => buildingObject.material.emissive.set(0x000000), 1000);
    }
}

// Search and Suggestion Functionality
document.getElementById('search-box').addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const suggestions = buildings.filter((b) => b.name.toLowerCase().includes(query));
    const suggestionList = document.getElementById('search-suggestions');
    suggestionList.innerHTML = '';
    suggestions.forEach((suggestion) => {
        const li = document.createElement('li');
        li.textContent = suggestion.name;
        li.addEventListener('click', () => highlightBuilding(suggestion));
        suggestionList.appendChild(li);
    });
});

// Draw Navigation Path
function drawPath(waypoints) {
    const points = waypoints.map((wp) => new THREE.Vector3(wp.x, wp.y, wp.z));
    const pathGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const pathMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
    const pathLine = new THREE.Line(pathGeometry, pathMaterial);
    scene.add(pathLine);
}

// Live Navigation with Arrow
function showLiveNavigation(waypoints) {
    let currentIndex = 0;
    const arrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(waypoints[currentIndex].x, waypoints[currentIndex].y, waypoints[currentIndex].z),
        5,
        0xff0000
    );
    scene.add(arrow);

    const navigate = () => {
        if (currentIndex < waypoints.length - 1) {
            const nextPoint = waypoints[currentIndex + 1];
            gsap.to(arrow.position, {
                x: nextPoint.x,
                y: nextPoint.y,
                z: nextPoint.z,
                duration: 2,
                onComplete: () => {
                    currentIndex++;
                    if (waypoints[currentIndex + 1]) {
                        arrow.setDirection(
                            new THREE.Vector3(
                                waypoints[currentIndex + 1].x - nextPoint.x,
                                waypoints[currentIndex + 1].y - nextPoint.y,
                                waypoints[currentIndex + 1].z - nextPoint.z
                            ).normalize()
                        );
                    }
                    navigate();
                },
            });
        } else {
            scene.remove(arrow);
        }
    };
    navigate();
}

// Reset Navigation
document.getElementById('reset-navigation').addEventListener('click', () => {
    scene.children = scene.children.filter((child) => !(child instanceof THREE.Line || child instanceof THREE.ArrowHelper));
    alert('Navigation reset.');
});

// Feedback Form Handling
document.getElementById('submit-feedback').addEventListener('click', () => {
    const feedbackText = document.getElementById('feedback-text').value;
    if (feedbackText.trim()) {
        // Here you would typically send the feedback to a server
        alert('Thank you for your feedback!');
        document.getElementById('feedback-text').value = '';
    } else {
        alert('Please enter some feedback before submitting.');
    }
});