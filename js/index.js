import * as THREE from "three";
import { OrbitControls } from "OrbitControls";
/**
 * Importing loaders.
 */
import { MTLLoader } from "MTLLoader";
import { OBJLoader } from "OBJLoader";
import { STLLoader } from "STLLoader";
import { FBXLoader } from "FBXLoader";

/*
    Fitting camera to object
*/
export const fitCameraToObject = (camera, object, orbitControls, offset) => {
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(object);

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
        z: camera.position.z,
    };
};

/*
    Loading model
*/
export const loadModel = (filename, id = null) => {
    /**
     * If id argument is defined, then the example model has been clicked.
     * Set the folder to load resources from to: `example-models`.
     * Otherwise, a file has been uploaded to: `upload-temp`.
     */
    const modelDirectory = id ? `example-models` : `upload-temp`;

    // Hiding splash screen and displaying loading model.
    document.querySelector("#splash")?.remove();
    document.querySelector("#loading-model").style.display = "";

    /**
     * Displaying loading icon in meshList.
     */
    const meshList = document.querySelector(`#meshes`);
    meshList.innerHTML = "";
    meshList.insertAdjacentHTML(`beforeend`,
    `<div id="loading-meshes">
        <div class="lds-ripple"><div></div><div></div></div>
        <p>Loading mesh list...</p>
    </div>`);

    // Extracting model extension
    const [file, extension] = getExtension(filename);

    switch(extension){
        case "obj":
            loadOBJ();
            break;
        case "fbx":
            loadFBX();
            break;
        case "stl":
            loadSTL();
            break;
    }

    /**
     * Loading OBJ (with optional MTL).
     */
    async function loadOBJ(){
        /**
         * Checking whether matching MTL file exists.
         */
        fetch(`../${modelDirectory}/${file}.mtl`, {method: "HEAD"})
        .then(response => {
            if (response.ok){
                /**
                 * MTL file exists, load OBJ with MTL.
                 */
                console.log("Found matching MTL file. Loading OBJ with MTL.");
                const mtlLoader = new MTLLoader();
                mtlLoader.load(`../${modelDirectory}/${file}.mtl`, materials => {
                    materials.preload();
                    const objLoader = new OBJLoader();
                    objLoader.setMaterials(materials);
                    objLoader.load(`../${modelDirectory}/${file}.obj`, object => {
                        model = object;
                        afterModelLoad();
                    },
                    xhr => {
                        document.getElementById("model-loaded-percentage").innerText = `${(xhr.loaded / xhr.total) * 100}% loaded...`
                    },
                    error => {
                        document.querySelectorAll(".loading").forEach(elem => elem.style.display = "none");
                        console.log(`Error occured: ${error}`);
                    });
                });
            }
            else {
                throw `WARNING: ${file}.mtl not found. Loading ${file}.obj only.`;
            }
        })
        .catch(error => {
            /**
             * MTL file doesn't exist, load only OBJ.
             */
            console.warn(error);
            const objLoader = new OBJLoader();
            objLoader.load(`../${modelDirectory}/${file}.obj`, object => {
                model = object;
                afterModelLoad();
            },
            xhr => {
                document.getElementById("model-loaded-percentage").innerText = `${(xhr.loaded / xhr.total) * 100}% loaded...`
            },
            error => {
                document.querySelectorAll(".loading").forEach(elem => elem.style.display = "none");
                console.log(`Error occured: ${error}`);
            });
        });
    }

    /**
     * Loading FBX.
     */
    function loadFBX(){
        const fbxLoader = new FBXLoader();
        fbxLoader.load(`../${modelDirectory}/${file}.fbx`, object => {
            model = object;
            afterModelLoad();
        });
    }

    /**
     * Loading STL.
     */
    function loadSTL(){
        const stlLoader = new STLLoader();
        stlLoader.load(`../${modelDirectory}/${file}.stl`, object => {
            const material = object.hasColors ? new THREE.MeshPhongMaterial({opacity: object.alpha, vertexColors: true}) : new THREE.MeshPhongMaterial({color: 0xe5e5e5, specular: 0x111111, shininess: 100});
            model = new THREE.Mesh(object, material);
            afterModelLoad();
        },
        xhr => {
            document.getElementById("model-loaded-percentage").innerText = `${(xhr.loaded / xhr.total) * 100}% loaded...`
        },
        error => {
            document.querySelectorAll(".loading").forEach(elem => elem.style.display = "none");
            console.log(`Error occured: ${error}`);
        });
    }

    function afterModelLoad(){
        // Appending checkbox for each mesh under "Model" section
        const meshesElem = document.querySelector("#meshes");
        meshesElem.innerHTML = "";
        model.traverse(child => {
            if (child instanceof THREE.Mesh){
                meshesElem.insertAdjacentHTML("beforeend", `
                <div class="section-content" style="width: 100%;">
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

        // Initializing meshes checkboxes and color pickers
        initMeshesCheckbox();
        initMeshesColorPicker();

        // Installing JSColor picker after the new pickers have been created dinamically
        jscolor.install();

        // Adding object to the scene
        scene.add(model);
        
        // Start rendering
        animate();
        
        // // Delete uploaded files from temp folder.
        // fetch(`../php/deleteUploaded.php`);

        // Removing model loading icon.
        document.querySelector(`#loading-model`).style.display = 'none';

        // Updating model information
        const [vertices, triangles] = getModelInformation(model);
        document.querySelector(`#vertex-number`).innerText = vertices;
        document.querySelector(`#triangle-number`).innerText = triangles;

        // Updating model list DOM
        const modelDOMElement = document.querySelector("#model-list");
        modelDOMElement.innerHTML = "";
        modelDOMElement.insertAdjacentHTML("beforeend",`Name: <a class="model-list-element">${file}.${extension}</a>`);
    }
}

// System variables
let model = null;
let enableRotationX = false;
let enableRotationY = false;
let enableRotationZ = false;
let rotationSpeedX = parseFloat(document.getElementById("rotationSpeedX").value);
let rotationSpeedY = parseFloat(document.getElementById("rotationSpeedX").value);
let rotationSpeedZ = parseFloat(document.getElementById("rotationSpeedX").value);
let displayAxes = true;
let cameraOffset = {};
let edges = [];
const moduleWrapper = document.querySelector("#model-viewer-container");

/*
    Setting up the scenery
*/
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, moduleWrapper.clientWidth / moduleWrapper.clientHeight, 0.1, 1000);
const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
const pointLight = new THREE.PointLight(0xffffff, 0.8);
const renderer = new THREE.WebGLRenderer();
const controls = new OrbitControls(camera, renderer.domElement);
const axes = new THREE.AxesHelper(10000);
camera.add(pointLight);
controls.update()
document.getElementById("model-viewer-container").appendChild(renderer.domElement);
renderer.setSize(moduleWrapper.clientWidth, moduleWrapper.clientHeight);
renderer.domElement.id = "threejs-canvas";
scene.add(ambientLight);
scene.add(camera);
scene.background = new THREE.Color(document.getElementById("enviroment-color").value);
if (displayAxes){
    scene.add(axes);
}
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

/*
    Axes controls
*/
// Fetching rotation speed X
document.getElementById("rotationSpeedX").addEventListener("input", e => {
    rotationSpeedX = e.target.value === "" ? 0 : parseFloat(e.target.value);
});
// Rotate along X axis
document.getElementById("rotateX").addEventListener("click", e => {
    if (!model) return;

    if (rotationSpeedX != 0) enableRotationX = !enableRotationX;
});
// Resetting rotation on X
document.getElementById("resetRotationX").addEventListener("click", e => {
    if (!model) return;

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
    if (!model) return;

    if (rotationSpeedY != 0) enableRotationY = !enableRotationY;
});
// Resetting rotation on Y
document.getElementById("resetRotationY").addEventListener("click", e => {
    if (!model) return;

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
    if (!model) return;

    if (rotationSpeedZ != 0) enableRotationZ = !enableRotationZ;
});
// Resetting rotation on Z
document.getElementById("resetRotationZ").addEventListener("click", e => {
    if (!model) return;

    model.rotation.z = 0;
    rotationSpeedZ = 0;
    enableRotationZ = false;
    document.getElementById("rotationSpeedZ").value = 0;
});
// Toggling axes
document.getElementById("toggleAxes").addEventListener("click", e => {
    if (!model) return;

    displayAxes = !displayAxes;
    displayAxes ? scene.add(axes) : scene.remove(axes);
});

/*
    Camera perspective controls.
*/
/**
 * Resetting perspective camera.
 */
document.getElementById("resetCamera").addEventListener("click", e => {
    if (!model) return;
    cameraOffset = fitCameraToObject(camera, model, controls);
    perspectiveButtons.forEach(button => {
        button.classList.remove("active");
    });
});
const perspectiveButtons = document.querySelectorAll(".perspective-button");
perspectiveButtons.forEach(perspectiveButton => {
    perspectiveButton.addEventListener("click", e => {
        /**
         * If model is not defined, exit function.
         */
        if (!model) return;

        /**
         * Fetching clicked perspective button.
         */
        const button = e.target;

        /**
         * Removing active class from all buttons,
         * and adding active class to the clicked button.
         * Removing titles of inactive buttons,
         * and adding title to the active button.
         */
        perspectiveButtons.forEach(button => {
            button.classList.remove("active")
            button.removeAttribute("title");
        });
        button.classList.add("active");
        button.setAttribute("title", "Active perspective.");

        /**
         * Setting key value pairs depending on the perspective button clicked.
         */
        const btnValue = {
            isometricView: [cameraOffset.x, cameraOffset.y, cameraOffset.z],
            frontView: [0, 0, cameraOffset.z],
            rearView: [0, 0, -cameraOffset.z],
            leftView: [-cameraOffset.x, 0, 0],
            rightView: [cameraOffset.x, 0, 0],
            topView: [0, cameraOffset.y, 0],
            bottomView: [0, -cameraOffset.y, 0],
        };
        camera.position.set(btnValue[button.id][0], btnValue[button.id][1], btnValue[button.id][2]);
    });
});

/**
 * When orbit controls manually moves with mouse,
 * display updated camera properties.
 */
const cameraSpan = {
    x: document.querySelector("#camera-x"),
    y: document.querySelector("#camera-y"),
    z: document.querySelector("#camera-z"),
    zoom: document.querySelector("#camera-zoom"),

};
controls.addEventListener("change", e => {
    cameraSpan.x.innerText = camera.position.x.toFixed(2);
    cameraSpan.y.innerText = camera.position.y.toFixed(2);
    cameraSpan.z.innerText = camera.position.z.toFixed(2);
    cameraSpan.zoom.innerText = controls.target.distanceTo(controls.object.position).toFixed(2);
});

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
    /**
     * Model is not defined, exit function.
     */
    if (!model) return;

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
                    child.material.color?.setHex(color.replace("#", "0x"));
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
    /**
     * Model is not loaded, exit function.
     */
    if (!model) return;

    const btn = e.target
    let display = btn.getAttribute("data-display") === "true"; // Convert string representation to a boolean

    // Display edges
    if (!display){
        display = true;
        btn.innerText = "Hide edges"

        const EdgesColor = "0x00FFF6";
        model.traverse(child => {
            if (child instanceof THREE.Mesh && child.visible){
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

/**
 * Loading example models.
 */
document.querySelectorAll(".example-model").forEach(link => {
    link.addEventListener("click", e => {
        loadModel(e.target.getAttribute("data-model"), e.target.getAttribute("id"));
    });
});

/**
 * Return file and extension.
 */
export const getExtension = filename => {
    const dotIndex = filename.lastIndexOf(".");
    const file = filename.substr(0, dotIndex);
    const extension = filename.substr(dotIndex + 1, filename.length);
    return [file, extension];
}

/**
 * Displaying model information on load.
 */
export const getModelInformation = object => {
    let vertices = 0;
    let triangles = 0;
    object.traverseVisible(model => {
        if (model.isMesh){
            const geometry = model.geometry;

            vertices += geometry.attributes.position.count;

            if (geometry.index){
                triangles += geometry.index.count / 3;
            }
            else {
                triangles += geometry.attributes.position.count / 3;
            }
        }
    });

    return [vertices, triangles];
}