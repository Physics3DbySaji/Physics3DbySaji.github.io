import * as THREE from '../../build/three.module.js';
import { GLTFLoader } from '../../jsm/loaders/GLTFLoader.js';
import { OrbitControls } from '../../jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from '../../jsm/renderers/CSS2DRenderer.js';
import  Stats  from '../../jsm/libs/stats.module.js';
import { GUI } from '../../jsm/libs/lil-gui.module.min.js';

let scene, camera, gui, controls, stats, clock, delta, renderer, labelRenderer;
let model, mixer, car, scaleHorizontal, scaleVertical, Wempty;
let move = true;
let modelReady = false;
let actions;
let WAction, circularAction;
let group =new THREE.Group();
let axis = new THREE.Vector3( 0.6, 0, 0 );
let labelgroup = new THREE.Group();
let Wlabel, Nlabel, velocity, weight, force, normal, Flabel, Vlabel;
const animations = {
    Force: false,
    Weight: false,
    Normal: false,
    Pause: function() {
        pauseContinue();
        console.log('pause');
    },

    slow: 1

   
}

let messageEl = document.getElementById('message-el');

function init() {

    let container;
    container = document.getElementById('container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set( -10, 20, 15 ) ;
    camera.rotation.set( -0.52, 0, 0);
    scene.add(camera);

    const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
    light1.position.set(1, 1, 1);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(0xffffff, 0.5);
    light2.position.set(- 1, - 1, 1);
    scene.add(light2);


    stats = new Stats();
    clock = new THREE.Clock();
   

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    //

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = true;
    controls.enableZoom = true;
    
    controls.target.set(5, 5, -3);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = 0.1;
    controls.minDistance = .1;
    controls.maxDistance = 5000;
    
    scaleHorizontal =new THREE.GridHelper(60, 60);
    scaleVertical = new THREE.GridHelper(60, 60);
    scaleVertical.rotation.x = 1.57;
    scene.add( scaleHorizontal, scaleVertical );
    
    scaleVertical.visible = false;
    
    window.addEventListener('resize', onWindowResize);

   

}

function createModel () {
    const loader = new GLTFLoader();
    loader
    .setPath('../model/')
    .load('circularMotion.glb', function(gltf) {
        model = gltf.scene;
        car = model.getObjectByName( 'car' );
        Wempty = model.getObjectByName( 'Wempty' );
        model.scale.set(5,5,5);
        
        scene.add( model);
        modelReady = true;
        mixer = new THREE.AnimationMixer(model);
        console.log(car);
        const animations = gltf.animations;

		mixer = new THREE.AnimationMixer( model );

		circularAction = mixer.clipAction( animations[ 0 ] );
		WAction = mixer.clipAction( animations[ 1 ] );
		actions = [ circularAction, WAction ];
        
        actions[0].play();
        actions[1].play();
        gltf.scene.traverse((child) => {
            if ( child.type == 'SkinnedMesh' ) {
              child.frustumCulled = false;
            }
        });
    }); 
    // add vectorial representation of forces
    weight = addVectors(new THREE.Vector3( 0, -1, 0 ), 'mg', 0x00FF00).vector;
    Wlabel = addVectors(new THREE.Vector3( 0, -1, 0 ), 'mg', 0x00FF00).label;
    force = addVectors( new THREE.Vector3( 1, 0, 0 ), 'a (centripetal force)', 0xFF0000 ).vector;
    Flabel = addVectors( new THREE.Vector3( 1, 0, 0 ), 'a (centripetal force)', 0xFF0000 ).label;
    velocity = addVectors( new THREE.Vector3( 0, 0, -1 ), 'v (velocity)',  0x0000FF).vector;
    Vlabel = addVectors( new THREE.Vector3( 0, 0, -1 ), 'v (velocity)',  0x0000FF).label;
    normal = addVectors( new THREE.Vector3( 1, 0, 0 ), 'Normal',  0xFFFFFF).vector;
    Nlabel = addVectors( new THREE.Vector3( 1, 0, 0 ), 'N (Normal)',  0xFFFFFF).label;
}


window.onload = function() {
    init();
    animate();
    createModel();
    guiControls();
    
    scene.add(new THREE.AmbientLight(0xffffff));
 
}

function animate() {   
    requestAnimationFrame( animate );
    delta = clock.getDelta();

    // mixer.update(delta);
    if (modelReady) mixer.update(delta);
    controls.update();

    stats.update();
    
	render();
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    render();

}

function render() {
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

function guiControls() {
    let gui = new GUI();

    let animationsFolder = gui.addFolder('Animations');
    
    animationsFolder.add(animations, 'Pause'). name('Pause/Continue');
    animationsFolder.add(animations, 'slow', 0.0, 1.5, 0.005 ).onChange( slowMotion ). name('Modify time');
    let indicatorFolder = gui.addFolder('Labels');
    indicatorFolder.add(animations, 'Force') .onChange(() => {
    //    addArrows();
       car.add(force, Flabel);
       car.add(velocity, Vlabel);
       showHide(animations.Force, force, Flabel);
       showHide(animations.Force, velocity, Vlabel)
    });

    indicatorFolder.add(animations, 'Weight') .onChange(() => {
        // addWeight();
        Wempty.add( weight, Wlabel);
        showHide(animations.Weight, weight, Wlabel)
     });
    
     indicatorFolder.add(animations, 'Normal').onChange(() => {
        // addWeight();
        car.add( normal, Nlabel);
        normal.setLength(.8)
        showHide(animations.Normal, normal, Nlabel);
        normalMagnitude()
        
     });
     
    
}

function pauseContinue() {
    if (move) {
        actions[0].paused = true;
        actions[1].paused = true;
        
        move = false;
    }else {
        actions[0].paused =false;
        actions[1].paused =false;
        move = true;
    }
    
}

function slowMotion( speed ) {
    
    mixer.timeScale = speed;
    
}

function addVectors(dir, name, color) {
    let vector = new THREE.ArrowHelper( dir, new THREE.Vector3( 0, 0, 0 ), 1, color );
   
    let text= document.createElement('div');
    text.className = 'label';
    text.textContent =  name;
    
    let label= new CSS2DObject(text);       
    label.position.copy( dir);
    labelgroup.add(label);
    group.add(vector);
    return {vector, label}
}


function showHide(value, vector, label) {
    if (value) {
        let Vector = vector;
        let Label = label;
        label.visible = true;
        vector.visible = true;
        // Flabel.visible = true;
    } else {
        let Vector = vector;
        let Label = label;
        label.visible = false;
        vector.visible = false;
        // Flabel.visible = false;
        // cancelAnimationFrame( normalMagnitude )
    }
}

function normalMagnitude() {
    // console.log(car.position.y)
    let  A = Math.abs((car.position.x)/1.4);
    let  B = Math.abs(car.position.y); 
    if (   A <= .9  && B > 1.2 ) {
        normal.setLength(Math.sin(A))
        Nlabel.position.copy( axis);
       
    } else  {
        normal.setLength(.8)
    }
    requestAnimationFrame( normalMagnitude );
}
