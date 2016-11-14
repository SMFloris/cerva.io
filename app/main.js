/********************************************************************************
	MAIN SCRIPT
********************************************************************************/

include("app/scripts/cube/mybox")

Class("MyGame", {



	MyGame: function() {
		App.call(this);
	},

	onCreate: function() {
		//init clock
		clock = new THREE.Clock();
		
		//any three.js geometry
		var scale= {"x":1,"y":1,"z":1};
		player.scale = scale;
		player.x = 0;
		player.y = 0;
		player.z = 0;


		var gridHelper = new THREE.GridHelper( 100, 10, 0x303030, 0x303030 );
		gridHelper.position.set( 0, - 0.04, 0 );
		app.scene.add( gridHelper );
		

		console.log("Inside onCreate method");

		document.addEventListener( 'mousemove', app.onDocumentMouseMove, false );
		document.addEventListener( 'touchstart', app.onDocumentTouchStart, false );
		document.addEventListener( 'touchmove', app.onDocumentTouchMove, false );
		document.addEventListener( 'mousewheel', app.onDocumentMouseWheel, false);

		document.addEventListener( 'keydown', app.onKeyDown, false );
		document.addEventListener( 'keyup', app.onKeyUp, false );

		element = document.getElementById( 'body' );
		var container = document.getElementById( 'gameContainer' );
				container.addEventListener( 'click', function ( event ) {
					// Ask the browser to lock the pointer
					element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
					if ( /Firefox/i.test( navigator.userAgent ) ) {
						var fullscreenchange = function ( event ) {
							if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
								document.removeEventListener( 'fullscreenchange', fullscreenchange );
								document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
								element.requestPointerLock();
							}
						};
						document.addEventListener( 'fullscreenchange', fullscreenchange, false );
						document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
						element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
						element.requestFullscreen();
					} else {
						element.requestPointerLock();
					}
				}, false );

		//example for camera movement
		//app.camera.addScript("cameraScript", "camera");
		//init controls
		controls = new THREE.PointerLockControls( app.camera.object );
		controls.enabled = true;
		app.scene.add( controls.getObject() );

		//send object details
		iosocket.emit("playerMeshCreate", player);

		//connect events
		iosocket.on('newPlayer', this.onNewPlayer);
		iosocket.on('playerMove', this.onPlayerMove);
		iosocket.on('playerRemove', this.onPlayerRemove);
	},

	onNewPlayer: function(newPlayer) {
		otherPlayers[newPlayer.id] = newPlayer;
		$('#incomingChatMessages').append($('<li></li>').text("Connected #"+newPlayer.id));

		// model
		var manager = new THREE.LoadingManager();
		manager.onProgress = function( item, loaded, total ) {
			console.log( item, loaded, total );
		};
		var onProgress = function( xhr ) {
			if ( xhr.lengthComputable ) {
				var percentComplete = xhr.loaded / xhr.total * 100;
				console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
			}
		};
		var onError = function( xhr ) {
		};
		var loader = new THREE.FBXLoader( manager );
		loader.load( '/assets/models/xsi_man/xsi_man_skinning.fbx', function( object ) {
			object.traverse( function( child ) {
				if ( child instanceof THREE.Mesh ) {
					// pass
				}
				if ( child instanceof THREE.SkinnedMesh ) {
					if ( child.geometry.animations !== undefined || child.geometry.morphAnimations !== undefined ) {
						child.mixer = new THREE.AnimationMixer( child );
						if(otherPlayers[newPlayer.id].mixers == undefined) {
							otherPlayers[newPlayer.id].mixers = [];
						}
						otherPlayers[newPlayer.id].mixers.push( child.mixer );
						var action = child.mixer.clipAction( child.geometry.animations[ 0 ] );
						action.play();
					}
				}
			} );
			otherPlayers[newPlayer.id].obj = object;
			otherPlayers[newPlayer.id].obj.position.set(newPlayer.x, newPlayer.y, newPlayer.z);
			otherPlayers[newPlayer.id].obj.rotation.set(newPlayer.rot.x, newPlayer.rot.x, newPlayer.rot.x);
			app.scene.add( object );
		}, onProgress, onError );

		
		
	},

	onKeyDown: function ( event ) {
		switch ( event.keyCode ) {
			case 38: // up
			case 87: // w
				moveForward = true;
				break;
			case 37: // left
			case 65: // a
				moveLeft = true; break;
			case 40: // down
			case 83: // s
				moveBackward = true;
				break;
			case 39: // right
			case 68: // d
				moveRight = true;
				break;
			case 32: // space
				if ( canJump === true ) velocity.y += 350;
				canJump = false;
				break;
		}
	},
	onKeyUp : function ( event ) {
		switch( event.keyCode ) {
			case 38: // up
			case 87: // w
				moveForward = false;
				break;
			case 37: // left
			case 65: // a
				moveLeft = false;
				break;
			case 40: // down
			case 83: // s
				moveBackward = false;
				break;
			case 39: // right
			case 68: // d
				moveRight = false;
				break;
		}
	},

	onPlayerMove: function(other) {
		if(other && otherPlayers[other.id] && other.id == player.id) return;
		var otherPlayer = otherPlayers[other.id];
		var obj = otherPlayer.obj;
		otherPlayers[other.id] = other;
		otherPlayers[other.id].obj = obj;
		
		if(otherPlayers[other.id].obj!==undefined){
			otherPlayers[other.id].obj.position.set(otherPlayer.x, otherPlayer.y, otherPlayer.z);
			otherPlayers[other.id].obj.rotation.set(otherPlayer.rot.x, otherPlayer.rot.y, otherPlayer.rot.z);
		}
	},

	onPlayerRemove: function(id) {
		app.scene.remove(otherPlayers[id].obj);
		delete otherPlayers[id];
		$('#incomingChatMessages').append($('<li></li>').text("#"+id+" Disconnected. "));
	},

	animate: function() {

		//animate player
		if ( mixers.length > 0 ) {
			for ( var i = 0; i < mixers.length; i ++ ) {
				mixers[ i ].update( clock.getDelta() );
			}
		}
	},

	animateOthers: function() {

		for ( var j = 0; j < otherPlayers.length; j ++ ) {
			if(otherPlayers[j].mixers!==undefined && otherPlayers[j].mixers.length >0){
				for ( var i = 0; i < otherPlayers[j].mixers.length; i ++ ) {
					otherPlayer.mixers[ i ].update( clock.getDelta() );
				}
			}
		}
	}

})._extends("App");

Game.update = function() {
	//app.animate();
	//app.animateOthers();
	if(controls!== undefined) {
		var delta = clock.getDelta();
		velocity.x -= velocity.x * 10.0 * delta;
		velocity.z -= velocity.z * 10.0 * delta;
		velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass
		if ( moveForward ) velocity.z -= 400.0 * delta;
		if ( moveBackward ) velocity.z += 400.0 * delta;
		if ( moveLeft ) velocity.x -= 400.0 * delta;
		if ( moveRight ) velocity.x += 400.0 * delta;

		controls.getObject().translateX( velocity.x * delta );
		controls.getObject().translateY( velocity.y * delta );
		controls.getObject().translateZ( velocity.z * delta );
		if ( controls.getObject().position.y < 10 ) {
			velocity.y = 0;
			controls.getObject().position.y = 10;
			canJump = true;
		}

		player.rot.x = controls.getObject().rotation.x;
		player.rot.y = controls.getObject().rotation.y;
		player.rot.z = controls.getObject().rotation.z;

		player.x = controls.getObject().position.x;
		player.y = controls.getObject().position.y;
		player.z = controls.getObject().position.z;
		iosocket.emit("playerMove",player);
	}
};