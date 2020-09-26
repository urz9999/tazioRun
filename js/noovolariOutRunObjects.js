// ============================================================
// NoovolariOutRun: copyright 2019 Alessandro Gaggia - beSharp
// objects: class objects that can be spawned in the map.
// ============================================================

/** 
* Line is an object that represent a line of the road, 
* ideally with its outside border object.
**/
class Line {

  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;

    this.X = 0;
    this.Y = 0;
    this.W = 0;

    this.curve = 0; // this value is used for curving the road
    this.scale = 0; // this is used to simulate perspective
	  this.ltree = true;
		this.rtree = true;
		this.lpanel = true;
	  this.rpanel = true;
		this.fuelorcar = false;
		
    this.elements = []; // elements inside the lines, like trees, you, the cars...
    this.special = null;

  }

  // This is a little complex, after we have defined a 'camera view' 
  // we use the matrix values to change the scale
  // And the viewing frustrum end in the viewmatrix
  project(camX, camY, camZ) {
    this.scale = camD / (this.z - camZ); // the scale is given by the dimension of the forward vector in relation to camera dimension
    this.X = (1 + this.scale * (this.x - camX)) * halfWidth;
    this.Y = Math.ceil( (1 - this.scale * (this.y - camY)) * height / 2 );
    this.W = this.scale * roadW * halfWidth;
  }
  
  // We 'clean' all the elements child of line!
  clearSprites() {
    for(let e of this.elements) 
		e.style.background = 'transparent';
  }

  // We draw the road 
  drawSprite(depth, layer, sprite, offset, offsetY) {

    let destX = this.X + this.scale * halfWidth * offset;
    let destY = this.Y + 4;
	
	if(offsetY !== undefined) { destY += offsetY; }
	
    let destW = sprite.width * this.W / 265;
    let destH = sprite.height * this.W / 265;

    destX += destW * offset;
    destY += destH * -1;

	// Draw the quad, note that we use basic css properties to do that
    let obj = (layer instanceof Element) ? layer : this.elements[layer + 6];
    obj.style.background = `url('${sprite.src}') no-repeat`;
    obj.style.backgroundSize = `${destW}px ${destH}px`;
    obj.style.left = destX + `px`;
    obj.style.top = destY + `px`;
    obj.style.width = destW + `px`;
    obj.style.height = destH + `px`;
    obj.style.zIndex = depth;
  }

}

/** A simple car object */
class Car {

  constructor(pos, type, lane) {

    this.pos = pos; // its position
    this.type = type; // the sprite of car
    this.lane = lane; // the lane we want the car to appear in

    var element = document.createElement('div'); // we hold the car in a div
    road.appendChild(element); // road is a global object
    this.element = element; // we set element as part of the object

  }

}

/** A simple fuel object */
class Fuel {

  constructor(pos, type, lane) {

    this.pos = pos; // its position
    this.type = type; // the sprite of fuel
    this.lane = lane; // the lane we want the car to appear in

    var element = document.createElement('div'); // we hold the car in a div
    road.appendChild(element); // road is a global object
    this.element = element; // we set element as part of the object

  }

	getFuel() {
		return tankBonus; // is global
	}
}

/** Audio CLass for managing audio in the game, very simple */
class Audio {

	constructor(mapName) {
		this.audioCtx = new AudioContext();
		this.mapName = mapName;
		// volume
		this.destination = this.audioCtx.createGain();
		this.volume = 1;
		this.destination.connect( this.audioCtx.destination );

		this.files = {};

		let _self = this;
		this.load(noovolariOutRun.ASSETS.AUDIO[this.mapName].theme, `theme-${mapName}`, function(key) {
			// We create a sound buffer for our theme song
			let source = _self.audioCtx.createBufferSource();
			source.buffer = _self.files[key];
			// We set common sound properties, note that this is pretty standard, so feel free to note and copy/paste anytime you need it
			let gainNode = _self.audioCtx.createGain();
			gainNode.gain.value = .6;
			source.connect(gainNode);
			gainNode.connect(_self.destination);
			// ...aaaand we loop the theme
			source.loop = true;
			source.start(0);
		});
	}
	
	// Volume levels
	get volume() { return this.destination.gain.value; }
	set volume(level) { this.destination.gain.value = level; }

	// Stop Audio
	stop() {
		this.audioCtx.close();
	}

	// Play audio
	play(key, pitch) {
		if (this.files[key]) {
			let source = this.audioCtx.createBufferSource();
			source.buffer = this.files[key];
			source.connect(this.destination);
			if(pitch) 
				source.detune.value = pitch;
			source.start(0);
		} else 
			this.load(key, () => this.play(key));
	}
	// Load an audio file and call a callback when ready
	load(src, key, callback) {
		let _self = this;
		let request = new XMLHttpRequest();
		request.open('GET', src, true);
		request.responseType = 'arraybuffer';
		request.onload = function() {
			_self.audioCtx.decodeAudioData(request.response, function(beatportBuffer) {
				_self.files[key] = beatportBuffer;
				callback(key);
			}, function() {})
		}
		request.send();
	}
}