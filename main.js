var camera, scene, renderer, controls;
var whiteFace;

			var objects = [];

			var raycaster;

			var keyboard = new KeyboardState();

			var blocker = document.getElementById( 'blocker' );
			var instructions = document.getElementById( 'instructions' );

			// http://www.html5rocks.com/en/tutorials/pointerlock/intro/

			var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

			if ( havePointerLock ) {

				var element = document.body;

				var pointerlockchange = function ( event ) {

					if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

						controlsEnabled = true;
						controls.enabled = true;

						blocker.style.display = 'none';

					} else {

						controls.enabled = false;

						blocker.style.display = 'block';

						instructions.style.display = '';

					}

				};

				var pointerlockerror = function ( event ) {

					instructions.style.display = '';

				};

				// Hook pointer lock state change events
				document.addEventListener( 'pointerlockchange', pointerlockchange, false );
				document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
				document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

				document.addEventListener( 'pointerlockerror', pointerlockerror, false );
				document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
				document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

				instructions.addEventListener( 'click', function ( event ) {

					instructions.style.display = 'none';

					// Ask the browser to lock the pointer
					element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
					element.requestPointerLock();

				}, false );

			} else {

				instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';

			}

			init();

			var controlsEnabled = false;

			var moveForward = false;
			var moveBackward = false;
			var moveLeft = false;
			var moveRight = false;
			var canJump = false;

			var prevTime = performance.now();
			var velocity = new THREE.Vector3();
			var direction = new THREE.Vector3();

			function init() {

				camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1000 );

				scene = new THREE.Scene();
				scene.background = new THREE.Color( 0x000000 );
				scene.fog = new THREE.Fog( 0x000000, 0, 250 );

				var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.75 );
				light.position.set( 0.5, 1, 0.75 );
				scene.add( light );

				controls = new THREE.PointerLockControls( camera );
				scene.add( controls.getObject() );

				raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

				// floor
				var floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
				floorGeometry.rotateX( - Math.PI / 2 );

				var floorTexture = new THREE.TextureLoader().load( "textures/road.jpg" );
				floorTexture.wrapS = THREE.RepeatWrapping;
				floorTexture.wrapT = THREE.RepeatWrapping;
				floorTexture.repeat.set( 11, 11 );

				var floorMaterial = new THREE.MeshBasicMaterial( { map: floorTexture } );

				var floor = new THREE.Mesh( floorGeometry, floorMaterial );
				scene.add( floor );



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

	// var mtlLoader = new THREE.MTLLoader();
	// mtlLoader.load('objects/WhiteFace.mtl', function(materials) {
	// 	materials.preload();
		var objLoader = new THREE.OBJLoader( manager );
		// objLoader.setMaterials(materials);
		objLoader.load( 'objects/WhiteFace.obj', function ( white_face ) {
			whiteFace = white_face;
		 	whiteFace.scale.x = 0.2;
			whiteFace.scale.y = 0.2;
			whiteFace.scale.z = 0.2;

			scene.add(whiteFace);
			objects.push(whiteFace);
			loaded = true;

			//renderer

			renderer = new THREE.WebGLRenderer();
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( window.innerWidth, window.innerHeight );
			document.body.appendChild( renderer.domElement );
			//resize

			window.addEventListener( 'resize', onWindowResize, false );
			animate();
			}, onProgress, onError );

			}

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}

			function animate() {
				if (whiteFace) {
					whiteFace.lookAt(camera.position);

					keyboard.update();

					if (keyboard.down("W")) {
						moveForward = true;
					}
					if (keyboard.down("A")) {
						moveLeft = true;
					}
					if (keyboard.down("S")) {
						moveBackward = true;

					}
					if (keyboard.down("D")) {
						moveRight = true;

					}
					if (keyboard.up("W")) {
						moveForward = false;

					}
					if (keyboard.up("A")) {
						moveLeft = false;

					}
					if (keyboard.up("S")) {
						moveBackward = false;

					}
					if (keyboard.up("D")) {
						moveRight = false;

					}

					requestAnimationFrame( animate );

					if ( controlsEnabled === true ) {

						raycaster.ray.origin.copy( controls.getObject().position );
						raycaster.ray.origin.y -= 10;

						var intersections = raycaster.intersectObjects( objects );

						var onObject = intersections.length > 0;

						var time = performance.now();
						var delta = ( time - prevTime ) / 1000;

						velocity.x -= velocity.x * 10.0 * delta;
						velocity.z -= velocity.z * 10.0 * delta;

						velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

						direction.z = Number( moveForward ) - Number( moveBackward );
						direction.x = Number( moveLeft ) - Number( moveRight );
						direction.normalize(); // this ensures consistent movements in all directions

						if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
						if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

						if ( onObject === true ) {

							velocity.y = Math.max( 0, velocity.y );
							canJump = true;

						}

						controls.getObject().translateX( velocity.x * delta );
						controls.getObject().translateY( velocity.y * delta );
						controls.getObject().translateZ( velocity.z * delta );

						if ( controls.getObject().position.y < 10 ) {

							velocity.y = 0;
							controls.getObject().position.y = 10;

							canJump = true;

						}

						prevTime = time;

					}

					renderer.render( scene, camera );
				}
			}
