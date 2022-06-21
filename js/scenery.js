requirejs(['js/three'], function(THREE) {
    'use strict';

    // Setting some variables
    const rotationCoefficient = 0.05; // How fast will the model rotate on the given axis

    // Model rotation variables
    let rotationX = 0; // Model rotation on X axis in degrees
    let rotationY = 0; // Model rotation on Y axis in degrees
    let oldX = 0; // Mouse last X position
    let oldY = 0; // Mouse last Y position
    let mouseDown = false; // Grabbed a model by mouse down event

    // Camera variables
    let cameraZoom = 5; // Camera zoom level
    let cameraZoomIncrement = 0.25; // Zooming step

    // Model variables
    let modelColor = "purple";

    // Geometry edges variables
    let geometryEdgesColor = "white"; // Color of the geometry edges
    let showGeometryEdges = false; // Show or hide model geometry edges

    // Wireframe variables
    let wireframeOpacity = 1;
    let showWireframe = true;
    
    /*
        Scenery setup
    */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.position.z = cameraZoom; // Camera zoom level
    document.body.appendChild(renderer.domElement); // Appending renderer element to the document

    /*
        Model creation
    */
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({color: modelColor});
    const model = new THREE.Mesh(geometry, material);
    scene.add(model); // Adding model to the scene

    /*
        Geometry edges
    */
    const edges = new THREE.EdgesGeometry(geometry);
    const geometryEdges = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({color: geometryEdgesColor}));
    if (showGeometryEdges){
        scene.add(geometryEdges);
    }

    /*
        Wireframe
    */
    const wireframe = new THREE.WireframeGeometry(geometry);
    const wireframeLines = new THREE.LineSegments(wireframe);
    wireframeLines.material.depthTest = false;
    wireframeLines.material.opacity = wireframeOpacity;
    wireframeLines.material.transparent = true;
    if (showWireframe){
        scene.add(wireframeLines);
    }

    /*
        Model manipulation
    */
    renderer.domElement.addEventListener('mousedown', e => mouseDown = true);
    renderer.domElement.addEventListener('mouseup', e => mouseDown = false);
    renderer.domElement.addEventListener("mouseleave", e => mouseDown = false);

    // Toggling model properties
    window.addEventListener("keypress", e => {

        // Geometry edges
        if (e.key.toLowerCase() === "e"){
            showGeometryEdges = !showGeometryEdges;
            showGeometryEdges ? scene.add(geometryEdges) : scene.remove(geometryEdges);
        }

        // Wireframe
        if (e.key.toLowerCase() === "w"){
            showWireframe = !showWireframe;
            showWireframe ? scene.add(wireframeLines) : scene.remove(wireframeLines);
        }
    });

    // Zoomming in / out the model
    renderer.domElement.addEventListener("wheel", e => {
        // Mouse wheel scroll Down (Zoom in)
        if (Math.sign(e.deltaY) > 0){
            cameraZoom += cameraZoomIncrement;
        }
        // Mouse wheel scroll Up (Zoom out)
        else if (Math.sign(e.deltaY) < 0){
            // Allow zooming in up to the distance of 1
            if (cameraZoom > 1){
                cameraZoom -= cameraZoomIncrement;
            }
        }

        // Update new camera position
        camera.position.z = cameraZoom;
    });

    // Rotating model with mouse while left click is pressed
    renderer.domElement.addEventListener('mousemove', e => {
        // Rotation happens only if the mouse is pressed down
        if (mouseDown){

            // ROTATION AROUND THE Y AXIS WHEN MOUSE MOVES LEFT AND RIGHT
            if (e.pageX > oldX){
                model.rotation.y += rotationCoefficient;
                geometryEdges.rotation.y += rotationCoefficient;
                wireframeLines.rotation.y += rotationCoefficient;
                
                rotationX = model.rotation.x;
            }
            else if (e.pageX < oldX){
                model.rotation.y -= rotationCoefficient;
                geometryEdges.rotation.y -= rotationCoefficient;
                wireframeLines.rotation.y -= rotationCoefficient;
                
                rotationX = model.rotation.x;
            }
            
            // ROTATION AROUND THE x AXIS WHEN MOUSE MOVES UP AND DOWN
            if (e.pageY > oldY){
                model.rotation.x += rotationCoefficient;
                geometryEdges.rotation.x += rotationCoefficient;
                wireframeLines.rotation.x += rotationCoefficient;
                
                rotationY = model.rotation.y;
            }
            else if (e.pageY < oldY){
                model.rotation.x -= rotationCoefficient;
                geometryEdges.rotation.x -= rotationCoefficient;
                wireframeLines.rotation.x -= rotationCoefficient;

                rotationY = model.rotation.y;
            }

            oldX = e.pageX;
            oldY = e.pageY;
        }
    });

    // Scene rendering
    const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);

        // console.log(`Zoom level: ${cameraZoom}`);
        // console.log(`Rotation X: ${rotationX}rad`);
        // console.log(`Rotation Y: ${rotationY}rad`);
    }
    animate(); // Start rendering
});