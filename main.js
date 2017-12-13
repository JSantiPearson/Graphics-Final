var camera, scene, renderer, controls;
var whiteFace, spriteFace;
var redLight, counter = 0, countUp = true;
var mouse = new THREE.Vector2(), INTERSECTED;
var collide = [];

			var raycaster;

			var keyboard = new KeyboardState();

			var blocker = document.getElementById( 'blocker' );
			var instructions = document.getElementById( 'instructions' );
			var carText = document.getElementById( 'carText' );
			carText.style.display = 'none';
			lockText.style.display = 'none';

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
				camera.position.y = 3;

				scene = new THREE.Scene();
				scene.background = new THREE.Color( 0x000000 );
				scene.fog = new THREE.Fog( 0x000000, 0, 175 );

				var light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.5 );
				light.position.set( 0.5, 1, 0.75 );
				scene.add( light );

				redLight = new THREE.PointLight( 0xff0000, 2, 15 );
				redLight.position.y = 13;
				redLight.position.x = -40;
				redLight.position.z = 24;
				scene.add( redLight );

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

				//walls
				var wallGeometry = new THREE.PlaneGeometry( 500, 500, 100, 100 );
				var wallTexture = new THREE.TextureLoader().load( "textures/wall.jpg" );
				wallTexture.wrapS = THREE.RepeatWrapping;
				wallTexture.wrapT = THREE.RepeatWrapping;
				wallTexture.repeat.set( 4, 4 );

				var wallMaterial = new THREE.MeshLambertMaterial( { map: wallTexture,  side: THREE.DoubleSide } );

				var wall1 = new THREE.Mesh( wallGeometry, wallMaterial );
				wall1.position.z = -220;
				scene.add( wall1 );

				var wall2 = new THREE.Mesh( wallGeometry, wallMaterial );
				wall2.rotation.x = THREE.Math.degToRad(180);
				wall2.position.z = 220;
				wall2.position.x = 180;
				scene.add( wall2 );

				var wall5 = new THREE.Mesh( wallGeometry, wallMaterial );
				wall5.rotation.x = THREE.Math.degToRad(180);
				wall5.position.z = 220;
				wall5.position.x = -380;
				scene.add( wall5 );

				var wall6 = new THREE.Mesh( wallGeometry, wallMaterial );
				wall6.rotation.y = THREE.Math.degToRad(90);
				wall6.position.z = 470;
				wall6.position.x = -70;
				scene.add( wall6 );

				var wall7 = new THREE.Mesh( wallGeometry, wallMaterial );
				wall7.rotation.y = THREE.Math.degToRad(90);
				wall7.position.z = 470;
				wall7.position.x = -130;
				scene.add( wall7 );

				var wall3 = new THREE.Mesh( wallGeometry, wallMaterial );
				wall3.rotation.y = THREE.Math.degToRad(90);
				wall3.position.x = 250;
				scene.add( wall3 );

				var wall4 = new THREE.Mesh( wallGeometry, wallMaterial );
				wall4.rotation.y = THREE.Math.degToRad(90);
				wall4.position.x = -250;
				scene.add( wall4 );

				var gateGeometry = new THREE.PlaneGeometry( 60, 100, 100, 100 );
				var gateTexture = new THREE.TextureLoader().load( "textures/Gate.jpg" );
				var gateMaterial = new THREE.MeshLambertMaterial( { map: gateTexture, side: THREE.DoubleSide, transparent: true } );
				var gate = new THREE.Mesh( gateGeometry, gateMaterial );
				//gate.rotation.y = THREE.Math.degToRad(-90);
				gate.position.z = 320;
				gate.position.x = -100;

				scene.add( gate );

				//ceiling

				var ceilingGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
				var ceilingTexture = new THREE.TextureLoader().load( "textures/ceiling.jpg" );
				ceilingTexture.wrapS = THREE.RepeatWrapping;
				ceilingTexture.wrapT = THREE.RepeatWrapping;
				ceilingTexture.repeat.set( 11, 11 );

				var ceilingMaterial = new THREE.MeshLambertMaterial( { map: ceilingTexture,  side: THREE.DoubleSide } );

				var ceiling = new THREE.Mesh( ceilingGeometry, ceilingMaterial );
				ceiling.rotation.x = THREE.Math.degToRad(90);
				ceiling.position.y = 40;
				scene.add( ceiling );


				//pillars
				var pillarGeometry = new THREE.BoxGeometry( 30, 80, 15 );
				var pillarTexture = new THREE.TextureLoader().load( "textures/pillar.png" );
				pillarTexture.wrapS = THREE.RepeatWrapping;
				pillarTexture.wrapT = THREE.RepeatWrapping;

				var pillarMaterial = new THREE.MeshLambertMaterial( { map: pillarTexture } );

				var pillar1 = new THREE.Mesh( pillarGeometry, pillarMaterial );
				var pillar2 = new THREE.Mesh( pillarGeometry, pillarMaterial );
				var pillar3 = new THREE.Mesh( pillarGeometry, pillarMaterial );
				var pillar4 = new THREE.Mesh( pillarGeometry, pillarMaterial );
				var pillar5 = new THREE.Mesh( pillarGeometry, pillarMaterial );
				var pillar6 = new THREE.Mesh( pillarGeometry, pillarMaterial );

				pillar1.position.z = 80;
				pillar1.position.x = -10;

				pillar2.position.z = 80;
				pillar2.position.x = 170;

				pillar3.position.z = 80;
				pillar3.position.x = -190;

				pillar4.position.z = -100;
				pillar4.position.x = -10;

				pillar5.position.z = -100;
				pillar5.position.x = 170;

				pillar6.position.z = -100;
				pillar6.position.x = -190;

				scene.add( pillar1 );
				scene.add( pillar2 );
				scene.add( pillar3 );
				scene.add( pillar4 );
				scene.add( pillar5 );
				scene.add( pillar6 );

				//arrow
				var arrowGeometry = new THREE.PlaneGeometry( 20, 20, 100, 100 );
				var arrowTexture = new THREE.TextureLoader().load( "textures/arrow.png" );
				var arrowMaterial = new THREE.MeshLambertMaterial( { map: arrowTexture, side: THREE.DoubleSide, transparent: true } );
				var arrow1 = new THREE.Mesh( arrowGeometry, arrowMaterial );
				arrow1.rotation.x = THREE.Math.degToRad(-90);
				arrow1.rotation.z = THREE.Math.degToRad(90);
				arrow1.opacity = 0.1;
				arrow1.position.y = 0.1;
				arrow1.position.z = 280;
				arrow1.position.x = -100;

				scene.add( arrow1 );

				var spriteMap = new THREE.TextureLoader().load( "textures/White_Face.png" );
				var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap, fog: true, side: THREE.DoubleSide, transparent: true,  } );
				whiteFace = new THREE.Sprite( spriteMaterial );
				whiteFace.scale.y = 20;
				whiteFace.scale.x = 15;
				whiteFace.scale.z = 20;
				whiteFace.position.x = 10;
				whiteFace.position.y = 10;
				whiteFace.position.z = 10;
				scene.add( whiteFace );

				var carBoxGeometry = new THREE.BoxBufferGeometry( 55, 30, 30 );
				var carBox = new THREE.Mesh( carBoxGeometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff, transparent: true, opacity: 0 } ) );
				carBox.name = "car box";
				carBox.side = THREE.DoubleSide;
				carBox.position.x = -40;
				carBox.position.z = 24;
				scene.add( carBox );

				var lockBoxGeometry = new THREE.BoxBufferGeometry( 30, 30, 7 );
				var lockBox = new THREE.Mesh( lockBoxGeometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff, transparent: true, opacity: 0 } ) );
				lockBox.name = "lock box";
				lockBox.side = THREE.DoubleSide;
				lockBox.position.z = 318;
				lockBox.position.x = -90;
				lockBox.position.y = 10;
				scene.add( lockBox );

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

	var carobjLoader = new THREE.OBJLoader( manager );
	var mtlLoader = new THREE.MTLLoader();
	mtlLoader.setPath( 'objects/' );
		mtlLoader.load( 'Camaro.mtl', function( materials ) {
			materials.preload();
			carobjLoader.setMaterials( materials );
			// carobjLoader.setMaterials(materials);
			carobjLoader.load( 'objects/Camaro.obj', function ( camaro ) {
			car1 = camaro;
			car1.side = THREE.DoubleSide;
			car1.scale.x = 2.7;
			car1.scale.y = 2.5;
			car1.scale.z = 2.7;
			car1.position.x = -40;
			car1.position.z = 24;
			car1.rotation.y = THREE.Math.degToRad(93);
			scene.add(car1);
			loaded = true;

			//renderer

			renderer = new THREE.WebGLRenderer();
			renderer.setPixelRatio( window.devicePixelRatio );
			renderer.setSize( window.innerWidth, window.innerHeight );
			document.body.appendChild( renderer.domElement );
			//resize

			window.addEventListener( 'resize', onWindowResize, false );

		if (car1) {
		animate();
		}
		}, onProgress, onError );
	});

	/* lock by Rory Vickers on BlendSwap */
	var lockobjLoader = new THREE.OBJLoader( manager );
	mtlLoader = new THREE.MTLLoader();
	mtlLoader.setPath( 'objects/' );
		mtlLoader.load( 'padlock.mtl', function( materials ) {
			materials.preload();
			lockobjLoader.setMaterials( materials );
			lockobjLoader.load( 'objects/padlock.obj', function ( padlock ) {
			lock = padlock;
			lock.position.z = 318;
			lock.position.x = -90;
			lock.position.y = 10;
			lock.scale.x = 0.5;
			lock.scale.y = 0.5;
			lock.scale.z = 0.5;
			scene.add(lock);
			//objects.push(lock);
			loaded = true;

		if (lock && car1) {

			//collide

			collide.push( wall1 );
			collide.push( wall2 );
			collide.push( wall3 );
			collide.push( wall4 );
			collide.push( wall5 );
			collide.push( wall6 );
			collide.push( wall7 );
			collide.push( pillar1 );
			collide.push( pillar2 );
			collide.push( pillar3 );
			collide.push( pillar4 );
			collide.push( pillar5 );
			collide.push( pillar6 );
			collide.push( gate );
			collide.push( carBox );
			collide.push( lockBox );

		animate();
		}
		}, onProgress, onError );
	});
		}

			function onWindowResize() {

				camera.aspect = window.innerWidth / window.innerHeight;
				camera.updateProjectionMatrix();

				renderer.setSize( window.innerWidth, window.innerHeight );

			}

			function animate() {
					keyboard.update();

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

					//enemy follow AI
					var dir = new THREE.Vector3();
					dir.x = controls.getObject().position.x - whiteFace.position.x;
					dir.z = controls.getObject().position.z - whiteFace.position.z;
					dir.y = controls.getObject().position.y - whiteFace.position.y;
					dir.normalize();
					whiteFace.position.x += dir.x * 0.2;
					whiteFace.position.z += dir.z * 0.2;

					//Red light counter
					var limit = 350;

					if (counter <= limit && countUp === true) {
						counter += 2;
					}
					else if (counter > limit) {
						countUp = false;
						redLight.intensity = 0;
						counter--;
					}
					else if (counter >= 0 && countUp === false){
						counter--;
					}
					else if (counter < 0){
						countUp = true;
						redLight.intensity = 2;
						counter++;
					}

					requestAnimationFrame( animate );

					if ( controlsEnabled === true ) {

						raycaster.ray.origin.copy( controls.getObject().position );
						raycaster.ray.origin.y -= 10;

						var time = performance.now();
						var delta = ( time - prevTime ) / 1000;

						velocity.x -= velocity.x * 10.0 * delta;
						velocity.z -= velocity.z * 10.0 * delta;

						velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

						direction.z = Number( moveForward ) - Number( moveBackward );
						direction.x = Number( moveLeft ) - Number( moveRight );
						//direction.normalize(); // this ensures consistent movements in all directions
						if ( moveForward || moveBackward ){
							velocity.z -= direction.z * 400.0 * delta;
						}
						if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

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

					raycaster.setFromCamera( mouse, camera );
					console.log(mouse);
					var intersects = raycaster.intersectObjects( collide );
					if ( intersects.length > 0 ) {
						if ( INTERSECTED != intersects[ 0 ].object ) {
								if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
								INTERSECTED = intersects[ 0 ].object;
								INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
								moveForward = false;
								if (keyboard.pressed("E")){
									if (INTERSECTED.name === "car box") carText.style.display = 'block';
									if (INTERSECTED.name === "lock box") lockText.style.display = 'block';
								}
						}
					} else{
					if (keyboard.pressed("W")) {
						moveForward = true;
					}
						if ( INTERSECTED ){
							if (INTERSECTED.name === "car box") carText.style.display = 'none';
							if (INTERSECTED.name === "lock box") lockText.style.display = 'none';
						}
						INTERSECTED = null;
					}


					renderer.render( scene, camera );
				// }
			}
