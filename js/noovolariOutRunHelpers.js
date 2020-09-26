// ============================================================
// NoovolariOutRun: copyright 2019 Alessandro Gaggia - beSharp
// helper functions: some helper functions to make things work
// ============================================================

/**
* Pad function that add lead characters with a default of 0.
* In this case is added as a prototype of Number for easy of 
* use as this is a game and we don't interfere with anything else
**/
Number.prototype.pad = function(numZeros, char = 0) {
    let n = Math.abs(this); // When we use prototype the number became the context itself
    let zeros = Math.max(0, numZeros - Math.floor(n).toString().length );
    let zeroString = Math.pow(10, zeros).toString().substr(1).replace(0, char);
    return zeroString + n;
};

/** Just clamp between two numbers to be sure the value is between boundaries */
Number.prototype.clamp = function(min, max) {
  return Math.max(min, Math.min(this, max));
};

window.noovolariOutRunHelper = window.noovolariOutRunHelper || {};

/** Random Number Generator */
noovolariOutRunHelper.getRand = function (min, max) { return Math.random() * (max - min) + min | 0; }

/** Get a timestamp of the current time */
noovolariOutRunHelper.timestamp = function() { return new Date().getTime(); }

/** Accelerate function: we all know vt = v0 + at, right? */
noovolariOutRunHelper.accelerate = function(v, accel, dt) { return v + (accel * dt); }

/** Colliding function */
noovolariOutRunHelper.isCollide = function(x1,w1,x2,w2) { return (x1 - x2) ** 2 <= (w2 + w1) ** 2; }

/** Return a random property of a map object */
noovolariOutRunHelper.randomProperty = function(obj) {
    let keys = Object.keys(obj);
    return obj[keys[ keys.length * Math.random() << 0]];
};

/** 
* Draw an object as a clip path with simplecss properties, 
* remeber that object coordinates and screen coordinates are 
* reversed so we need to invert y1 and y2 
**/
noovolariOutRunHelper.drawQuad = function(element, layer, color, x1, y1, w1, x2, y2, w2) {
  element.style.zIndex = layer; // we use z-index as a 3d z index in a sense
  element.style.background = color;
  element.style.top = y2 + `px`;
  element.style.left = x1 - w1 / 2 - w1 + `px`;
  element.style.width = w1 * 3 + `px`;
  element.style.height = y1 - y2 + `px`;

  let leftOffset = w1 + x2 - x1 + Math.abs(w2/2 - w1/2);
  // the ` symbol allow use to use ${} to inject value in strings like in Ruby!
  element.style.clipPath = `polygon(${leftOffset}px 0, ${leftOffset + w2}px 0, 66.66% 100%, 33.33% 100%)`;
};

/** A simple promise that calls for a setTimeout to mimic a sleep waiter */
noovolariOutRunHelper.sleep = function(ms) {
    return new Promise(function(resolve, reject) {
		// we basically call resolve of promise (to make it returns) when tot ms are passed!
        setTimeout(function(){ resolve(); }, ms);
    })
};

noovolariOutRunHelper.getFun = function(val) {
  return i => val; // What it does? :D, it can be expanded as function i() { return val; }
}

/** We generate a map of section based on the global value mapLength */
noovolariOutRunHelper.genMap = function() {

  let map = []; // we define a map as an array of sections

  // We use our random function to give the iterator a more random nature
  // A big WTF: we can't use let in for loop init, we still need var...
  for(var i = 0; i < mapLength; i += noovolariOutRunHelper.getRand(0, 50)) {
	  // We define a section object that as a starting and an ending point
    let section = {
      from: i,
      to: (i = i + noovolariOutRunHelper.getRand(300, 600))
    };

	  // Random party values :P!!!
    let randHeight = noovolariOutRunHelper.getRand(-5, 5)
    let randCurve = noovolariOutRunHelper.getRand(5, 30) * ((Math.random() >= .5) ? 1 : -1); // One direction or the other in a 50% possibility
    let randInterval = noovolariOutRunHelper.getRand(20, 40)
  	let ltree = noovolariOutRunHelper.getRand(1, 40) > 10;
    let rtree = noovolariOutRunHelper.getRand(1, 50) > 15;
    let lpanel = noovolariOutRunHelper.getRand(1, 10) > 5;
    let rpanel = noovolariOutRunHelper.getRand(1, 10) > 5; 
    let fuelorcar = noovolariOutRunHelper.getRand(1, 10) > 8; 

    if(Math.random() > .9) Object.assign(section, {curve: _ => randCurve, height: _ => randHeight, ltree: ltree, rtree: rtree, lpanel: lpanel, rpanel: rpanel, fuelorcar: fuelorcar });
    else if(Math.random() > .8) Object.assign(section, {curve: _ => 0, height: i => Math.sin(i/randInterval)*1000, ltree: ltree, rtree: rtree, lpanel: lpanel, rpanel: rpanel, fuelorcar: fuelorcar});
    else if(Math.random() > .8) Object.assign(section, {curve: _ => 0, height: _ => randHeight, ltree: ltree, rtree: rtree, lpanel: lpanel, rpanel: rpanel, fuelorcar: fuelorcar});
    else Object.assign(section, {curve: _ => randCurve, height: _ => 0, ltree: ltree, rtree: rtree, lpanel: lpanel, rpanel: rpanel, fuelorcar: fuelorcar});

    map.push(section);
  }

  map.push({from: i, to: i + N, curve: _ => 0, height: _ => 0, special: noovolariOutRun.ASSETS.IMAGE.FINISH, ltree: true, rtree: true, lpanel: true, rpanel: true, fuelorcar: false});
  map.push({from: Infinity});
  return map;

}

/** This helpers make and keep updated a map of keys status that can be called everywhere */
noovolariOutRunHelper.KEYS = {};
noovolariOutRunHelper.keyUpdate = function(e) {
  noovolariOutRunHelper.KEYS[e.code] = e.type === 'keydown';
  e.preventDefault();
};

noovolariOutRunHelper.drawReserve = function(value) {
	fueltank.innerHTML = '';
	let step = 8; // 200 / 25 if we have 200px and we want it divided in 25 steps of 6px color and 2px black
	// 100 : maxFuel = x : value
	let x = 200 * value / maxFuel;
	let ticks = x / step;
	for(let i = 0; i < ticks; i++) {
		var fuelbar = document.createElement('span');
		fuelbar.classList.add('fuelreserve');
		fuelbar.style.bottom = `${i*step + 2}px`;
		fueltank.appendChild(fuelbar);
	}
};

/**  We add event listener to the window object as we want to listen from the whole page */
window.addEventListener('keydown', noovolariOutRunHelper.keyUpdate);
window.addEventListener('keyup', noovolariOutRunHelper.keyUpdate);