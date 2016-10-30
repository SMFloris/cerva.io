/********************************************************************************
	MAIN SCRIPT
********************************************************************************/

include("app/scripts/cube/mybox")

Class("MyGame", {

	MyGame: function() {
		App.call(this);
	},

	onCreate: function() {
		
		//any three.js geometry
		var scale= {"x":1,"y":1,"z":1};
		scale.x = Math.random();
		scale.y = Math.random();
		scale.z = Math.random();
		var geometry = new THREE.CubeGeometry(
			Math.floor((scale.x * 20) + 10), 
			Math.floor((scale.y * 20) + 10), 
			Math.floor((scale.z * 20) + 10));
		var material = new THREE.MeshBasicMaterial({
			color: 0x00ff00,
			wireframe : true
		});

		player.scale = scale;
		var cube = new Mesh(geometry, material, {script : "mybox", dir : "cube"});
		

		console.log("Inside onCreate method");

		document.addEventListener( 'mousemove', app.onDocumentMouseMove, false );
		document.addEventListener( 'touchstart', app.onDocumentTouchStart, false );
		document.addEventListener( 'touchmove', app.onDocumentTouchMove, false );
		document.addEventListener( 'mousewheel', app.onDocumentMouseWheel, false);

		

		//example for camera movement
		app.camera.addScript("cameraScript", "camera");

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

		var geometry = new THREE.CubeGeometry(
			Math.floor((newPlayer.scale.x * 20) + 10), 
			Math.floor((newPlayer.scale.y * 20) + 10), 
			Math.floor((newPlayer.scale.z * 20) + 10));
		var material = new THREE.MeshBasicMaterial({
			color: 0x00ff00,
			wireframe : true
		});
		var cube = new Mesh(geometry, material);

		
		cube.mesh.position.set(newPlayer.x, newPlayer.y, newPlayer.z);
		cube.mesh.rotation.set(newPlayer.rot.x, newPlayer.rot.x, newPlayer.rot.x);

		otherPlayers[newPlayer.id].mesh = cube.mesh;
	},

	onPlayerMove: function(other) {
		if(other && other.id == player.id) return;
		var otherPlayer = otherPlayers[other.id];
		var mesh = otherPlayer.mesh;
		otherPlayers[other.id] = other;
		otherPlayers[other.id].mesh = mesh;
		
		mesh.position.set(otherPlayer.x, otherPlayer.y, otherPlayer.z);
		mesh.rotation.set(otherPlayer.rot.x, otherPlayer.rot.y, otherPlayer.rot.z);

	},

	onPlayerRemove: function(id) {
		app.scene.remove(otherPlayers[id].mesh);
		delete otherPlayers[id];
		$('#incomingChatMessages').append($('<li></li>').text("#"+id+" Disconnected. "));
	}

})._extends("App");
