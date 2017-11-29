////////////////////////////////////////////////////////////////////////////////
/*global THREE, document, window  */
var camera, scene, renderer, gui;
var cameraControls;

var clock = new THREE.Clock();

var knight;

var translationMatrix = new THREE.Matrix4();
var rotationMatrix   = new THREE.Matrix4();
var scalingMatrix = new THREE.Matrix4();

function fillScene() {
	scene = new THREE.Scene();
	scene.fog = new THREE.Fog( 0x808080, 2000, 4000 );


// Set up gui sliders
	gui = new dat.GUI({
		autoPlace: false,
    height : (32 * 3)- 1
	});

  params = {
    xtrans: 0,
    ytrans: 0,
    ztrans: 0,
  	xrot: 0,
  	yrot: 0,
  	zrot: 0,
    xscale: 1,
    yscale: 1,
    zscale: 1
  };

  gui.add(params, 'xtrans').min(-100).max(100).step(5).name('X translation');
	gui.add(params, 'ytrans').min(-100).max(100).step(5).name('Y translation');
  gui.add(params, 'ztrans').min(-100).max(100).step(5).name('Z translation');
	gui.add(params, 'xrot').min(0).max(180).step(10).name('X rotation');
	gui.add(params, 'yrot').min(0).max(180).step(10).name('Y rotation');
  gui.add(params, 'zrot').min(0).max(180).step(10).name('Z rotation');
  gui.add(params, 'xscale').min(0.5).max(2).step(0.1).name('X scale');
	gui.add(params, 'yscale').min(0.5).max(2).step(0.1).name('Y scale');
  gui.add(params, 'zscale').min(0.5).max(2).step(0.1).name('Z scale');


	gui.domElement.style.position = "relative";
	gui.domElement.style.top = "-400px";
	gui.domElement.style.left = "350px";

	// LIGHTS

	scene.add( new THREE.AmbientLight( 0x222222 ) );

	var light = new THREE.DirectionalLight( 0xffffff, 0.7 );
	light.position.set( 200, 500, 500 );

	scene.add( light );

	light = new THREE.DirectionalLight( 0xffffff, 0.9 );
	light.position.set( -200, -100, -400 );

	scene.add( light );

	//grid xz
	var gridXZ = new THREE.GridHelper(2000, 100,  new THREE.Color(0xCCCCCC), new THREE.Color(0x888888));
	scene.add(gridXZ);

	//axes
	var axes = new THREE.AxisHelper(150);
  axes.scale.set(7,7,7);
	scene.add(axes);

	drawKnight();
}

function drawKnight() {
  // Set up load manager and load image and obj file.
	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) {
		console.log( item, loaded, total );
	};

	var onProgress = function ( xhr ) {
		if ( xhr.lengthComputable ) {
			var percentComplete = xhr.loaded / xhr.total * 100;
			console.log( Math.round(percentComplete, 2) + '% downloaded' );
		}
	};
	var onError = function ( xhr ) {
	};

	var knightTex = new THREE.Texture();

	var loader = new THREE.ImageLoader( manager );
	loader.load( 'KnightTexture2.png', function ( image ) {
		knightTex.image = image;
		knightTex.needsUpdate = true;
	} );

	loader = new THREE.OBJLoader( manager );
		loader.load( 'chessknightexport.obj', function ( object ) {
			object.traverse( function ( child ) {
				if ( child instanceof THREE.Mesh ) {
					child.material.map = knightTex;
				}
			} );
      knight = object;
      knight.matrixAutoUpdate = false;
			scene.add( knight );
		}, onProgress, onError );
}

function init() {
	var canvasWidth = 600;
	var canvasHeight = 400;
	var canvasRatio = canvasWidth / canvasHeight;

	// RENDERER
	renderer = new THREE.WebGLRenderer( { antialias: true } );

	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.setSize(canvasWidth, canvasHeight);
	renderer.setClearColor( 0xAAAAAA, 1.0 );

	// CAMERA
	camera = new THREE.PerspectiveCamera( 45, canvasRatio, 1, 4000 );
	// CONTROLS
	cameraControls = new THREE.OrbitControls(camera, renderer.domElement);
	camera.position.set( -1200, 1000, 1200);
	cameraControls.target.set(250,-50,250);
}

function addToDOM() {
    var canvas = document.getElementById('canvas');
    canvas.appendChild(renderer.domElement);
    canvas.appendChild(gui.domElement);
}

function animate() {
  if (knight) {
    knight.matrix.identity();

    /*
    Single matrices for translation and scaling are relatively
    straighforward:
    */
    translationMatrix.set(
        1, 0, 0, params.xtrans,
        0, 1, 0, params.ytrans,
        0, 0, 1, params.ztrans,
        0, 0, 0, 1
       );

    scalingMatrix.set(
        params.xscale, 0, 0, 0,
        0, params.yscale, 0, 0,
        0, 0, params.zscale, 0,
        0, 0, 0, 1
       );

    var cosx = Math.cos(params.xrot * THREE.Math.DEG2RAD);
    var sinx = Math.sin(params.xrot * THREE.Math.DEG2RAD);
    var cosy = Math.cos(params.yrot * THREE.Math.DEG2RAD);
    var siny = Math.sin(params.yrot * THREE.Math.DEG2RAD);
    var cosz = Math.cos(params.zrot * THREE.Math.DEG2RAD);
    var sinz = Math.sin(params.zrot * THREE.Math.DEG2RAD);

    /*
    To get a single rotation matrix, we'll need to multiply the three
    axes rotation matrices.

    For reference, the axes' rotation matrices from the previous
    assignment:
    xRotMatrix.set(
        1,    0,    0,  0,
        0, cosx, -sinx, 0,
        0, sinx,  cosx, 0,
        0,    0,     0, 1
       );
    yRotMatrix.set(
        cosy, 0, -siny, 0,
        0,    1,     0, 0,
        siny, 0,  cosy, 0,
        0,    0,     0, 1
        );
    zRotMatrix.set(
        cosz, -sinz, 0, 0,
        sinz,  cosz, 0, 0,
        0,        0, 1, 0,
        0,        0, 0, 1
       );

    Start with xRotMatrix times yRotMatrix, row by row.
    First row:
    [1, 0, 0, 0] . [cosy, 0, siny, 0] = cosy
    [1, 0, 0, 0] . [0, 1, 0, 0] = 0
    [1, 0, 0, 0] . [-siny, 0 cosy, 0] = -siny
    [1, 0, 0, 0] . [0, 0, 0, 1] = 0

    Second row:
    [0, cosx, -sinx, 0] . [cosy, 0, siny, 0] = siny * -sinx
    [0, cosx, -sinx, 0] . [0, 1, 0, 0] = cosx
    [0, cosx, -sinx, 0] . [-siny, 0, cosy, 0] = -sinx * cosy
    [0, cosx, -sinx, 0] . [0, 0, 0, 1] = 0

    Third row:
    [0, sinx, cosx, 0] . [cosy, 0, siny, 0] = siny * cosx
    [0, sinx, cosx, 0] . [0, 1, 0, 0] = sinx
    [0, sinx, cosx, 0] . [-siny, 0, cosy, 0] = cosx * cosy
    [0, sinx, cosx, 0] . [0, 0, 0, 1] = 0

    Fourth row:
    [0, 0, 0, 1] . [cosy, 0, siny, 0] = 0
    [0, 0, 0, 1] . [0, 1, 0, 0] = 0
    [0, 0, 0, 1] . -siny, 0, cosy, 0] = 0
    [0, 0, 0, 1] . [0, 0, 0, 1] = 1

    Result for x and y rotations:
    cosy,             0,          -siny,     0,
    siny * -sinx,  cosx,   -sinx * cosy,     0,
    siny * cosx,   sinx,    cosx * cosy,     0,
    0,                0,              0,     1

    Then we multiply the result by zRotMatrix.
    First row:
    [cosy, 0, -siny, 0] . [cosz, sinz, 0, 0] = cosy * cosz
    [cosy, 0, -siny, 0] . [-sinz, cosz, 0, 0] = cosy * -sinz
    [cosy, 0, -siny, 0] . [0, 0, 1, 0]  = -siny
    [cosy, 0, -siny, 0] . [0, 0, 0 , 1] = 0

    Second row:
    [siny * -sinx, cosx, -sinx * cosy, 0] . [cosz, sinz, 0, 0] =  cosz * (siny * -sinx) + cosx * sinz
    [siny * -sinx, cosx, -sinx * cosy, 0] . [-sinz, cosz, 0, 0] =  -sinz * (siny * -sinx) + cosx * cosz
    [siny * -sinx, cosx, -sinx * cosy, 0] . [0, 0, 1, 0] =  -sinx * cosy
    [siny * -sinx, cosx, -sinx * cosy, 0] . [0, 0, 0 , 1]  = 0

    Third row:
    [siny * cosx,  sinx, cosx * cosy,  0] . [cosz, sinz, 0, 0] = cosz * (siny * cosx) + sinx * sinz
    [siny * cosx,  sinx, cosx * cosy,  0] . [-sinz, cosz, 0, 0] = -sinz * (siny * cosx) + sinx * cosz
    [siny * cosx,  sinx, cosx * cosy,  0] . [0, 0, 1, 0] = cosx * cosy
    [siny * cosx,  sinx, cosx * cosy,  0] . [0, 0, 0 , 1]  = 0

    Fourth row:
    [0, 0, 0 , 1] . [cosz, sinz, 0, 0] = 0
    [0, 0, 0 , 1] . [sinz, cosz, 0, 0] = 0
    [0, 0, 0 , 1] . [0, 0, 1, 0]  = 0
    [0, 0, 0 , 1] . [0, 0, 0 , 1]  = 1
    */
    rotationMatrix.set(
                              cosy * cosz,                          cosy * -sinz,        -siny, 0,
      cosz * (siny * -sinx) + cosx * sinz,  -sinz * (siny * -sinx) + cosx * cosz, -sinx * cosy, 0,
       cosz * (siny * cosx) + sinx * sinz,   -sinz * (siny * cosx) + cosz * sinx,  cosx * cosy, 0,
                                        0,                                     0,            0, 1
      );

    knight.matrix.multiply(translationMatrix)
                  .multiply(rotationMatrix)
                  .multiply(scalingMatrix);

  }
	window.requestAnimationFrame(animate);
	render();
}

function render() {
	var delta = clock.getDelta();
	cameraControls.update(delta);
	renderer.render(scene, camera);
}

try {
  init();
  fillScene();
  addToDOM();
  animate();
} catch(error) {
    console.log("Your program encountered an unrecoverable error, can not draw on canvas. Error was:");
    console.log(error);
}
