import * as THREE from "three";
import { OrbitControls } from "OrbitControls";
// Importing loaders
import { OBJLoader } from "OBJLoader";
import { MTLLoader } from "MTLLoader";
import { FBXLoader } from "FBXLoader";
import { STLLoader } from "STLLoader";

/*
    Fitting camera to object
*/
export const fitCameraToObject = (camera, object, orbitControls, offset) => {
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject( object );

    const size = new THREE.Vector3();
    boundingBox.getSize(size);

    const fov = camera.fov * (Math.PI / 180);
    const fovh = 2 * Math.atan(Math.tan(fov / 2) * camera.aspect);
    const dx = size.z / 2 + Math.abs(size.x / 2 / Math.tan(fovh / 2));
    const dy = size.z / 2 + Math.abs(size.y / 2 / Math.tan(fov / 2));
    const cameraX = Math.max(dx, dy);
    const cameraY = Math.max(dx, dy);
    const cameraZ = Math.max(dx, dy);

    // Offset the camera, if desired (to avoid filling the whole canvas)
    if (offset !== undefined && offset !== 0){
        cameraZ *= offset;
    }

    camera.position.set(cameraX, cameraY, cameraZ);

    // Set the far plane of the camera so that it easily encompasses the whole object
    const minZ = boundingBox.min.z;
    const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ;

    camera.far = cameraToFarEdge * 3;
    camera.updateProjectionMatrix();

    if (orbitControls !== undefined){
        // Set camera to rotate around the center
        orbitControls.target = new THREE.Vector3(0, 0, 0);

        // Prevent camera from zooming out far enough to create far plane cutoff
        orbitControls.maxDistance = cameraToFarEdge * 2;
    }

    return {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    };
};

/*
    Loading model
*/
const loadModel = () => {
    const loader = new OBJLoader();
    loader.load(
        '../models/gun.obj',
        object => {
            // Saving loaded model into variable
            model = object;

            // Appending checkbox for each mesh under "Model" section
            model.traverse(child => {
                if (child instanceof THREE.Mesh){
                    document.querySelector("#meshes").insertAdjacentHTML("beforeend", `
                    <div class="section-content" style="width: 95%;">
                        <div>
                            <label class="mesh-name">${child.name}</label>
                            <input type="checkbox" id="${child.id}" class="meshes-checkbox" checked="checked">
                        </div>
                        <input type="text" class="mesh-color-picker" data-id="${child.id}" value="#FFFFFF" data-jscolor="{
                            position: 'right', width: 200, height: 100,
                            padding: 10, sliderSize: 25,
                            borderColor: '#000', controlBorderColor: '#CCC', backgroundColor: '#242424'
                        }">
                    </div>
                    `);
                }
            });

            // Fitting camera to the object
            cameraOffset = fitCameraToObject(camera, model, controls);
    
            // Removing loading elements
            document.getElementById("loading-model").remove();
            document.getElementById("loading-meshes").remove();
    
            // Initializing meshes checkboxes and color pickers
            initMeshesCheckbox();
            initMeshesColorPicker();
    
            // Installing JSColor picker after the new pickers have been created dinamically
            jscolor.install();
    
            // Adding object to the scene
            scene.add(model);
        },
        xhr => {
            document.getElementById("model-loaded-percentage").innerText = `${(xhr.loaded / xhr.total) * 100}% loaded...`
        },
        error => {
            document.querySelectorAll(".loading").forEach(elem => elem.remove());
            console.log(`Error occured: ${error}`);
        }
    );
}

// System variables
let model = null;
let enableRotationX = false;
let enableRotationY = false;
let enableRotationZ = false;
let rotationSpeedX = parseFloat(document.getElementById("rotationSpeedX").value);
let rotationSpeedY = parseFloat(document.getElementById("rotationSpeedX").value);
let rotationSpeedZ = parseFloat(document.getElementById("rotationSpeedX").value);
let displayAxes = false;
let cameraOffset = {};
let edges = [];

/*
    Setting up the scenery
*/
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
const pointLight = new THREE.PointLight(0xffffff, 0.8);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);
const axes = new THREE.AxesHelper(500);
camera.add(pointLight);
controls.update()
document.getElementById("model-viewer-container").appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.id = "threejs-canvas";
scene.add(ambientLight);
scene.add(camera);

/*
    Model loading
*/
loadModel();

// Rendering
const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);

    // Rotating the model on X Y and Z axes
    if (enableRotationX) model.rotation.x += rotationSpeedX;
    if (enableRotationY) model.rotation.y += rotationSpeedY;
    if (enableRotationZ) model.rotation.z += rotationSpeedZ;
}
animate(); // Start rendering

/*
    Axes controls
*/
// Fetching rotation speed X
document.getElementById("rotationSpeedX").addEventListener("input", e => {
    rotationSpeedX = e.target.value === "" ? 0 : parseFloat(e.target.value);
});
// Rotate along X axis
document.getElementById("rotateX").addEventListener("click", e => {
    if (rotationSpeedX != 0) enableRotationX = !enableRotationX;
});
// Resetting rotation on X
document.getElementById("resetRotationX").addEventListener("click", e => {
    model.rotation.x = 0;
    rotationSpeedX = 0;
    enableRotationX = false;
    document.getElementById("rotationSpeedX").value = 0;
});
// Fetching rotation speed Y
document.getElementById("rotationSpeedY").addEventListener("input", e => {
    rotationSpeedY = e.target.value === "" ? 0 : parseFloat(e.target.value);
});
// Rotate along Y axis
document.getElementById("rotateY").addEventListener("click", e => {
    if (rotationSpeedY != 0) enableRotationY = !enableRotationY;
});
// Resetting rotation on Y
document.getElementById("resetRotationY").addEventListener("click", e => {
    model.rotation.y = 0;
    rotationSpeedY = 0;
    enableRotationY = false;
    document.getElementById("rotationSpeedY").value = 0;
});
// Fetching rotation speed Z
document.getElementById("rotationSpeedZ").addEventListener("input", e => {
    rotationSpeedZ = e.target.value === "" ? 0 : parseFloat(e.target.value);
});
// Rotate along Z axis
document.getElementById("rotateZ").addEventListener("click", e => {
    if (rotationSpeedZ != 0) enableRotationZ = !enableRotationZ;
});
// Resetting rotation on Z
document.getElementById("resetRotationZ").addEventListener("click", e => {
    model.rotation.z = 0;
    rotationSpeedZ = 0;
    enableRotationZ = false;
    document.getElementById("rotationSpeedZ").value = 0;
});
// Toggling axes
document.getElementById("toggleAxes").addEventListener("click", e => {
    displayAxes = !displayAxes;
    displayAxes ? scene.add(axes) : scene.remove(axes);
});

/*
    Perspective controls
*/
document.getElementById("isometricView").addEventListener("click", e => camera.position.set(cameraOffset.x, cameraOffset.y, cameraOffset.z));
document.getElementById("frontView").addEventListener("click", e => camera.position.set(0, 0, cameraOffset.z));
document.getElementById("rearView").addEventListener("click", e => camera.position.set(0, 0, -cameraOffset.z));
document.getElementById("leftView").addEventListener("click", e => camera.position.set(-cameraOffset.x, 0, 0));
document.getElementById("rightView").addEventListener("click", e => camera.position.set(cameraOffset.x, 0, 0));
document.getElementById("topView").addEventListener("click", e => camera.position.set(0, cameraOffset.y, 0));
document.getElementById("bottomView").addEventListener("click", e => camera.position.set(0, -cameraOffset.y, 0));
document.getElementById("resetCamera").addEventListener("click", e => cameraOffset = fitCameraToObject(camera, model, controls));

/*
    Configuration panel
*/
// Toggle CP visibility
const cp = document.getElementById("configuration-panel-container");
document.getElementById("toggle-configuration-panel-btn").addEventListener("click", e => {
    const btn = e.target;

    // Hide panel
    if (parseInt(window.getComputedStyle(cp).getPropertyValue("left")) === 0){
        cp.style.left = `${-cp.clientWidth}px`;
        btn.innerText = ">>";
        btn.style.right = `${-btn.clientWidth}px`;
    }
    
    // Show panel
    else {
        cp.style.left = `0px`;
        btn.innerText = "<<";
        btn.style.right = `0px`;
    }
});

// Toggle wireframe
document.getElementById("display-wireframe").addEventListener("click", e => {
    const btn = e.target;
    let display = btn.getAttribute("data-display") === "true"; // Convert string representation to a boolean

    // Display wireframe
    if (!display){
        display = true;
        btn.innerText = "Hide wireframe";

        if (model instanceof THREE.Mesh){
            model.material.wireframe = true;
        }
        else {
            model.traverse(child => {
                if (child instanceof THREE.Mesh){
                    child.material.wireframe = true;
                }
            });
        }
    }
    // Hide wireframe
    else {
        display = false;
        btn.innerText = "Show wireframe";

        if (model instanceof THREE.Mesh){
            model.material.wireframe = false;
        }
        else {
            model.traverse(child => {
                if (child instanceof THREE.Mesh){
                    child.material.wireframe = false;
                }
            });
        }
    }
    btn.setAttribute("data-display", display);
});
// Updating meshes color
const initMeshesColorPicker = () => {
    document.querySelectorAll(".mesh-color-picker").forEach(elem => {
        elem.addEventListener("input", e => {
            const meshID = e.target.getAttribute("data-id");
            const color = e.target.value;
            
            model.traverse(child => {
                if (child instanceof THREE.Mesh && child.material && child.id == meshID){
                    child.material.color.setHex(color.replace("#", "0x"));
                }
            });
        });
    });
}
// Toggle meshes
const initMeshesCheckbox = () => {
    document.querySelectorAll(".meshes-checkbox").forEach(elem => {
        elem.addEventListener("change", e => {
            const meshID = e.target.id;
    
            model.traverse(child => {
                if (child instanceof THREE.Mesh && child.id == meshID){
                    child.visible = e.target.checked;
                }
            });
        });
    });
}
// Toggle Edges
document.getElementById("display-edges").addEventListener("click", e => {
    const btn = e.target
    let display = btn.getAttribute("data-display") === "true"; // Convert string representation to a boolean

    // Display edges
    if (!display){
        display = true;
        btn.innerText = "Hide edges"

        const EdgesColor = "0x00FFF6";
        model.traverse(child => {
            if (child instanceof THREE.Mesh){
                const EdgeGeometry = new THREE.EdgesGeometry(child.geometry);
                const EdgesMaterial = new THREE.LineBasicMaterial({
                    color: parseInt(EdgesColor),
                    linewidth: 1
                });
                const edge = new THREE.LineSegments(EdgeGeometry, EdgesMaterial);
                
                edges.push(edge);
                model.add(edge);
            }
        });
    }
    // Hide edges
    else {
        display = false;
        btn.innerText = "Show edges"

        edges.forEach(edge => model.remove(edge));
        edges = [];
    }
    btn.setAttribute("data-display", display);
});

/*
    Enviroment controls
*/
document.getElementById("enviroment-color").addEventListener("input", e => scene.background = e.target.value === "" ? new THREE.Color("#000000") : new THREE.Color(e.target.value));