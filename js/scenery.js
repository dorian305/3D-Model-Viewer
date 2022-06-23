import * as THREE from "three";
import { OrbitControls } from "OrbitControls";
import { OBJLoader } from "OBJLoader";
import { MTLLoader } from "MTLLoader";
import { FBXLoader } from "FBXLoader";
import { STLLoader } from "STLLoader";

const centerObject = object => {
    const box = new THREE.Box3().setFromObject(object);
    const center = new THREE.Vector3();
    box.getCenter(new THREE.Vector3());
    object.position.sub(center);
}

// System variables
let model = null;
let enableRotationX = false;
let enableRotationY = false;
let enableRotationZ = false;
let rotationSpeedX = 0;
let rotationSpeedY = 0;
let rotationSpeedZ = 0;
let displayAxes = true;

/*
    Setting up the scenery
*/
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
const pointLight = new THREE.PointLight(0xffffff, 0.8);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);
const axes = new THREE.AxesHelper();

camera.add(pointLight);
camera.position.set(1, 1, 1);
controls.update()

document.body.appendChild(renderer.domElement);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.domElement.id = "threejs-canvas";

scene.add(ambientLight);
scene.add(camera);
if (displayAxes) scene.add(axes);

/*
    Model loading
*/
const loader = new OBJLoader();
loader.load(
    '../models/camion.obj',
    object => {
        // Centering the model to the scene origin
        centerObject(object);

        // Reading whether model contains child meshes
        // If so, append the parts to the panel
        object.traverse(child => {
            if (child instanceof THREE.Mesh){
                const checkbox = document.createElement('input');
                const label = document.createElement('label');
                checkbox.setAttribute("type", "checkbox");
                label.innerText = `Mesh ID: ${child.id}`;
                document.getElementById("parts").appendChild(checkbox);
                document.getElementById("parts").appendChild(label);
            }
        });

        // Adding object to the scene
        scene.add(object);
        model = object;
    },
    xhr => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded')
    },
    error => {
        console.log(`Error occured: ${error}`);
    }
);

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
// Isometric view
document.getElementById("isometricView").addEventListener("click", e => {
    camera.position.set(0.5, 0.5, 0.5);
});
// Front view
document.getElementById("frontView").addEventListener("click", e => {
    camera.position.set(0, 0.1, 0.5);
});
// Rear view
document.getElementById("rearView").addEventListener("click", e => {
    camera.position.set(0, 0.1, -0.75);
});
// Left view
document.getElementById("leftView").addEventListener("click", e => {
    camera.position.set(0.5, 0.1, 0);
});
// Right view
document.getElementById("rightView").addEventListener("click", e => {
    camera.position.set(-0.5, 0.1, 0);
});
// Top view
document.getElementById("topView").addEventListener("click", e => {
    camera.position.set(0, 1, 0);
});
// Bottom view
document.getElementById("bottomView").addEventListener("click", e => {
    camera.position.set(0, -1, 0);
});

/*
    Model controls
*/
// Updating model color
const updateModelColor = (model, color) => {
    model.traverse(child => {
        if (child instanceof THREE.Mesh && child.material) child.material.color.setHex(color.replace("#", "0x"));
    });
}
document.getElementById("model-color").addEventListener("input", e => {
    e.target.value === "" ? updateModelColor(model, "#FFFFFF") : updateModelColor(model, e.target.value);
});

/*
    Enviroment controls
*/
// Updating enviroment background color
document.getElementById("enviroment-color").addEventListener("input", e => {
    scene.background = e.target.value === "" ? "#000000" : new THREE.Color(e.target.value);
});