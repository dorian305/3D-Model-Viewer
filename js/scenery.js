import * as THREE from "three";
import { fitCameraToObject } from "./functions.js";
import { OrbitControls } from "OrbitControls";
import { OBJLoader } from "OBJLoader";
import { MTLLoader } from "MTLLoader";
import { FBXLoader } from "FBXLoader";
import { STLLoader } from "STLLoader";

// System variables
let model = null;
let enableRotationX = false;
let enableRotationY = false;
let enableRotationZ = false;
let rotationSpeedX = 0;
let rotationSpeedY = 0;
let rotationSpeedZ = 0;
let displayAxes = true;
let cameraOffset;
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
const axes = new THREE.AxesHelper(1000000000);

camera.add(pointLight);
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
    '../models/gun.obj',
    object => {
        // Fitting camera to the object and saving camera offsets
        fitCameraToObject(camera, object, controls);
        cameraOffset = {
            x: camera.position.x,
            y: camera.position.y,
            z: camera.position.z
        };

        // Traversing object meshes
        object.traverse(child => {
            if (child instanceof THREE.Mesh){
                // Adding mesh checkboxes for toggling
                let elem1 = document.createElement("div");
                elem1.classList.add("section-content-item");
                let elem2 = document.createElement("label");
                elem2.innerText = `Mesh ID: ${child.id}`;
                let elem3 = document.createElement("input");
                elem3.setAttribute("type", "checkbox");
                elem3.setAttribute("checked", "checked");
                elem3.addEventListener("change", toggleMesh);
                elem3.id = child.id;
                let elem4 = document.createElement("input");
                elem4.setAttribute("type", "text");
                elem4.setAttribute("data-id", child.id);
                elem4.classList.add("mesh-color-picker");
                elem4.setAttribute("value", "#FFFFFF");
                elem4.setAttribute("data-jscolor", `{
                    position: 'right', width: 200, height: 100,
                    padding: 10, sliderSize: 25,
                    borderColor: '#000', controlBorderColor: '#CCC', backgroundColor: '#242424'
                }`);
                elem4.addEventListener("input", updateMeshColor);
                elem1.appendChild(elem2);
                elem1.appendChild(elem3);
                elem1.appendChild(elem4);
                document.querySelector("#parts").appendChild(elem1);
            }
        });

        // Installing JSColor picker after the new pickers have been created dinamically
        jscolor.install();

        // Adding object to the scene
        scene.add(object);
        model = object;
    },
    xhr => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
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
document.getElementById("isometricView").addEventListener("click", e => camera.position.set(cameraOffset.x, cameraOffset.y, cameraOffset.z));
document.getElementById("frontView").addEventListener("click", e => camera.position.set(0, 0, cameraOffset.z));
document.getElementById("rearView").addEventListener("click", e => camera.position.set(0, 0, -cameraOffset.z));
document.getElementById("leftView").addEventListener("click", e => camera.position.set(-cameraOffset.x, 0, 0));
document.getElementById("rightView").addEventListener("click", e => camera.position.set(cameraOffset.x, 0, 0));
document.getElementById("topView").addEventListener("click", e => camera.position.set(0, cameraOffset.y, 0));
document.getElementById("bottomView").addEventListener("click", e => camera.position.set(0, -cameraOffset.y, 0));

/*
    Model controls
*/
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
const updateMeshColor = e => {
    const meshID = e.target.getAttribute("data-id");
    const color = e.target.value;
    
    model.traverse(child => {
        if (child instanceof THREE.Mesh && child.material && child.id == meshID){
            child.material.color.setHex(color.replace("#", "0x"));
        }
    });
}
// Toggle meshes
const toggleMesh = e => {
    const meshID = e.target.id;

    model.traverse(child => {
        if (child instanceof THREE.Mesh && child.id == meshID){
            child.visible = e.target.checked;
        }
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
                    linewidth: 10
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
document.getElementById("enviroment-color").addEventListener("input", e => scene.background = e.target.value === "" ? "#000000" : new THREE.Color(e.target.value));