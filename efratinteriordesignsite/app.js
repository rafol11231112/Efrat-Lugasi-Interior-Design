// Initialize Forge Viewer
let viewer;

async function initializeViewer() {
    try {
        await new Promise((resolve, reject) => {
            Autodesk.Viewing.Initializer(
                {
                    env: 'AutodeskProduction',
                    api: 'derivativeV2',
                    getAccessToken: getForgeToken
                },
                () => resolve(),
                (error) => reject(error)
            );
        });
        
        viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('forge-viewer'));
        viewer.start();
        console.log('Viewer initialized successfully');
    } catch (error) {
        console.error('Failed to initialize viewer:', error);
    }
}

// Hero section 3D animation using Three.js
function initHero3D() {
    const container = document.getElementById('hero-3d');
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Create a sample 3D object (can be replaced with your own model)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshPhongMaterial({ color: 0x009ffd });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    function animate() {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
    }

    animate();

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', async () => {
    initHero3D();
    loadModels();
    initFloatingModels();

    // Smooth scroll for navigation links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    console.log('DOM Content Loaded, setting up viewers...');
});

// Form submission
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form data
    const formData = {
        name: this.querySelector('input[type="text"]').value,
        email: this.querySelector('input[type="email"]').value,
        service: this.querySelector('select').value,
        message: this.querySelector('textarea').value
    };
    
    // Send to serverless function
    fetch('/api/send-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.innerHTML = `
                <i class="fas fa-check-circle"></i>
                <h3>Thank you for reaching out!</h3>
                <p>We'll get back to you within 24 hours to schedule your consultation.</p>
            `;
            
            // Replace form with success message
            this.style.display = 'none';
            this.parentNode.appendChild(successMessage);
            
            this.reset();
        } else {
            throw new Error(data.message || 'Failed to send message');
        }
    })
    .catch(error => {
        alert('Sorry, there was an error sending your message. Please try again later.');
        console.error('Error:', error);
    });
});

// Smooth scroll for all buttons with schedule-btn class
document.querySelectorAll('.schedule-btn, .cta-button').forEach(button => {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId) {
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Animation for service cards on scroll
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate');
        }
    });
}, observerOptions);

document.querySelectorAll('.service-card').forEach(card => {
    observer.observe(card);
});

// Handle Revit file upload
document.getElementById('upload-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    const fileInput = document.getElementById('revit-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a file');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            alert('File uploaded successfully!');
            // Refresh the works grid or add the new model to it
            loadModel(file.name);
        } else {
            throw new Error('Upload failed');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to upload file');
    }
});

// Function to load a model into a work card
function loadModel(modelId) {
    const options = {
        env: 'AutodeskProduction',
        api: 'derivativeV2',
    };

    // Initialize viewer for the specific card
    const container = document.querySelector(`[data-model-id="${modelId}"]`);
    if (!container) return;

    const viewer = new Autodesk.Viewing.GuiViewer3D(container, options);
    viewer.start();

    // Load the model (you'll need to implement this part with your Forge API credentials)
    const documentId = 'your-forge-document-id';
    Autodesk.Viewing.Document.load(documentId, function(doc) {
        const viewables = doc.getRoot().getDefaultGeometry();
        viewer.loadDocumentNode(doc, viewables);
    });
}

window.addEventListener('load', () => {
    console.log('DOM Content Loaded, setting up viewers...');
    
    // Initialize the view button
    const viewButton = document.getElementById('view-3d-btn');
    console.log('View button found:', !!viewButton);
    
    if (viewButton) {
        viewButton.addEventListener('click', () => {
            console.log('View button clicked');
            const modelPreview = document.getElementById('preview-project');
            console.log('Model preview element:', modelPreview);
            console.log('Model data:', modelPreview?.dataset?.model);
            
            if (modelPreview && modelPreview.dataset.model) {
                console.log('Loading model:', modelPreview.dataset.model);
                loadFullModel(`/models/${modelPreview.dataset.model}`);
            } else {
                console.error('No model data found');
            }
        });
    }

    // Initialize all model previews
    document.querySelectorAll('.model-preview').forEach(preview => {
        const modelFile = preview.dataset.model;
        console.log('Initializing preview for:', modelFile);
        if (modelFile) {
            initPreview(`/models/${modelFile}`, preview.id);
        }
    });

    console.log('Window loaded, checking Three.js:', typeof THREE !== 'undefined');
    console.log('FBXLoader available:', typeof THREE?.FBXLoader !== 'undefined');
    initFloatingModels();
});

function initPreview(modelPath, containerId) {
    console.log('Initializing preview for:', modelPath, 'in container:', containerId);
    const container = document.getElementById(containerId);
    
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    // Check if Three.js and FBXLoader are available
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        container.innerHTML = '<div style="color: red; padding: 20px;">Error: Three.js not loaded</div>';
        return;
    }
    
    if (typeof THREE.FBXLoader === 'undefined') {
        console.error('FBXLoader not loaded');
        console.log('Available THREE components:', Object.keys(THREE));
        container.innerHTML = '<div style="color: red; padding: 20px;">Error: FBXLoader not loaded</div>';
        return;
    }

    try {
        const scene = new THREE.Scene();
        scene.background = null;
        const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 2000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        
        renderer.setClearColor(0x000000, 0);
        const width = container.clientWidth || 300;
        const height = container.clientHeight || 300;
        console.log('Setting renderer size to:', width, 'x', height);
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        camera.position.set(10, 10, 10);
        camera.lookAt(0, 0, 0);

        // Load FBX model
        const loader = new THREE.FBXLoader();
        console.log('Starting to load model from:', modelPath);
        
        loader.load(
            modelPath,
            (object) => {
                console.log('Model loaded successfully:', object);
                // Center the model
                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                console.log('Model center:', center);
                object.position.sub(center);
                
                // Scale to fit
                const size = box.getSize(new THREE.Vector3());
                console.log('Model size:', size);
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 4 / maxDim;
                console.log('Applying scale:', scale);
                object.scale.multiplyScalar(scale);
                
                scene.add(object);
                
                // Animate preview
                function animate() {
                    requestAnimationFrame(animate);
                    object.rotation.y += 0.005;
                    renderer.render(scene, camera);
                }
                animate();
            },
            (xhr) => {
                const percent = (xhr.loaded / xhr.total * 100).toFixed(2);
                console.log(`${percent}% loaded`);
            },
            (error) => {
                console.error('Error loading model:', error);
                container.innerHTML = `<div style="color: red; padding: 20px;">Error loading 3D model: ${error.message}</div>`;
            }
        );
    } catch (error) {
        console.error('Error initializing Three.js scene:', error);
        container.innerHTML = `<div style="color: red; padding: 20px;">Error: ${error.message}</div>`;
    }
}

function loadFullModel(modelPath) {
    console.log('loadFullModel called with:', modelPath);
    const modalViewer = document.getElementById('modal-viewer');
    const modalOverlay = document.getElementById('modal-overlay');
    const viewerContent = document.getElementById('viewer-content');
    
    // Show loading indicator
    viewerContent.innerHTML = '<div class="loading">Loading 3D Model...</div>';
    
    // Check if Three.js and FBXLoader are available
    if (typeof THREE === 'undefined') {
        console.error('Three.js not loaded');
        viewerContent.innerHTML = '<div class="loading">Error: Three.js not loaded</div>';
        return;
    }
    
    if (typeof THREE.FBXLoader === 'undefined') {
        console.error('FBXLoader not loaded');
        viewerContent.innerHTML = '<div class="loading">Error: FBXLoader not loaded. Try refreshing the page.</div>';
        return;
    }

    if (!modalViewer || !modalOverlay || !viewerContent) {
        console.error('Required elements not found');
        return;
    }

    modalViewer.classList.add('active');
    modalOverlay.classList.add('active');

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    const camera = new THREE.PerspectiveCamera(75, viewerContent.clientWidth / viewerContent.clientHeight, 0.1, 2000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    
    renderer.setSize(viewerContent.clientWidth, viewerContent.clientHeight);
    viewerContent.appendChild(renderer.domElement);

    // Handle window resize
    window.addEventListener('resize', () => {
        camera.aspect = viewerContent.clientWidth / viewerContent.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(viewerContent.clientWidth, viewerContent.clientHeight);
    });

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Remove loading indicator when starting to load model
    viewerContent.querySelector('.loading').remove();

    const loader = new THREE.FBXLoader();
    console.log('Loading full model from:', modelPath);
    loader.load(modelPath, 
        (object) => {
            console.log('Full model loaded successfully:', object);
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            object.position.sub(center);
            
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 4 / maxDim;
            object.scale.multiplyScalar(scale);
            
            scene.add(object);
            
            currentControls = new THREE.OrbitControls(camera, renderer.domElement);
            currentControls.enableDamping = true;
            currentControls.dampingFactor = 0.05;
            currentControls.minDistance = 2;
            currentControls.maxDistance = 10;
            
            function animate() {
                requestAnimationFrame(animate);
                currentControls.update();
                renderer.render(scene, camera);
            }
            animate();
        },
        (progress) => {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            const loadingEl = viewerContent.querySelector('.loading');
            if (loadingEl) {
                loadingEl.textContent = `Loading: ${percent}%`;
            }
        },
        (error) => {
            console.error('Error loading full model:', error);
            viewerContent.innerHTML = `
                <div class="loading">
                    Error loading 3D model: ${error.message}<br>
                    <small>Make sure the file exists and is a valid FBX file.</small>
                </div>`