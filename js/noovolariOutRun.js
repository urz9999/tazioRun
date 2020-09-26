// =============================================================
// Noovolari OutRun - copyright 2019 Alessandro Gaggia - beSharp
// main: contains game loop and play mechanics
// note: for more information this is the site I used for learning 
// how to code the street: http://www.extentofthejam.com/pseudo/
// =============================================================
window.noovolariOutRun = window.noovolariOutRun || {};

// We generate the map outside the init function 
// as some sort of preloaded function! This way 
// when the game starts we have the map already generated
noovolariOutRun.map = noovolariOutRunHelper.genMap();

// Game Time deltaTime after
let then = noovolariOutRunHelper.timestamp();
// Audio object
let audio;
// Variables
let inGame, start, playerX, speed, scoreVal, pos, cloudOffset, sectionProg, mapIndex, countDown;
let lines = [];
let cars = [];
let fuel;

// Reset all the game to its original state
noovolariOutRun.reset = function() {
  // no more in game
  inGame = false;
  // define our coutdown to initial value
  start = noovolariOutRunHelper.timestamp();
  // one is for special so length-2 instead of length-1
  countDown = noovolariOutRun.map[noovolariOutRun.map.length - 2].to / 130 - 20;
  // Reset everything
  playerX = 0;
  speed = 0;
  scoreVal = 0;
  pos = 0;
  cloudOffset = 0;
  sectionProg = 0;
  mapIndex = 0;
  km.innerText = `0/${mapLength}`;

  fuel = maxFuel;

  // Make the street empty and straight again
  for(let line of lines) 
	line.curve = line.y = 0;
  
  // Show blinking phrase
  text.innerText = noovolariOutRun.ASSETS.TEXTS.thePhrase;
  text.classList.add('blink');
  
  // A bit of style for everything
  road.style.opacity = .4;
  hud.style.display = 'none';
  home.style.display = 'block';
  tacho.style.display = 'block';
  fueltank.style.display = 'block';
};

// game loop, it accepts a fixed timestamp and a map name taken from asset file 
// if we want to extend the game further to make it multilevel
noovolariOutRun.update = function(step, mapName) {

  // prepare this iteration
  pos += speed;
  while (pos >= N * segL) pos -= N * segL;
  while (pos < 0) pos += N * segL;

  var startPos = (pos / segL) | 0;
  let endPos = (startPos + N - 1) % N;

  scoreVal += speed*step;
  countDown -= step;
  
  fuel -= (speed*step/300);

  km.innerText = `${Math.floor(Math.min(mapLength / 100, scoreVal / 100))}/${mapLength / 100}`;
  
  noovolariOutRunHelper.drawReserve(Math.floor(fuel));
  
  // left / right position
  playerX -= lines[startPos].curve / 5000 * step * speed;

  if(noovolariOutRunHelper.KEYS.ArrowRight) tazio.style.backgroundPosition = '-' + noovolariOutRun.ASSETS.IMAGE.TAZIO.width/3*2 +'px 0', playerX+=.007*step*speed;
  else if(noovolariOutRunHelper.KEYS.ArrowLeft) tazio.style.backgroundPosition = '0 0', playerX-=.007*step*speed;
  else tazio.style.backgroundPosition = '-' + noovolariOutRun.ASSETS.IMAGE.TAZIO.width/3 +'px 0';

  playerX = playerX.clamp(-3, 3);

  // speed

  if(inGame && noovolariOutRunHelper.KEYS.ArrowUp) speed = noovolariOutRunHelper.accelerate(speed, accel, step);
  else if(noovolariOutRunHelper.KEYS.ArrowDown) speed = noovolariOutRunHelper.accelerate(speed, breaking, step);
  else speed = noovolariOutRunHelper.accelerate(speed, decel, step);

  if(Math.abs(playerX) > 0.55 && speed >= maxOffSpeed) {
    speed = noovolariOutRunHelper.accelerate(speed, offDecel, step);
  }

  speed = speed.clamp(0, maxSpeed);

  // update map
  let current = noovolariOutRun.map[mapIndex];
  let use = current.from < scoreVal && current.to > scoreVal;
  if(use) 
	sectionProg += speed*step;

  lines[endPos].curve = use ? current.curve(sectionProg) : 0;
  lines[endPos].y = use ? current.height(sectionProg) : 0;
  lines[endPos].special = null;
  lines[endPos].ltree = current.ltree;
  lines[endPos].rtree = current.rtree;
  lines[endPos].lpanel = current.lpanel;
  lines[endPos].rpanel = current.rpanel;
  lines[endPos].fuelorcar = current.fuelorcar;

  if(current.to <= scoreVal) {
    mapIndex++;
    sectionProg = 0;
    lines[endPos].special = noovolariOutRun.map[mapIndex].special;
  }

  // win / lose + UI
  if(!inGame) {

    speed = noovolariOutRunHelper.accelerate(speed, breaking, step);
    speed = speed.clamp(0, maxSpeed);
  } else if(countDown <= 0 || lines[startPos].special || fuel <= 0) {
	// Times up or finish
	tacho.style.display = 'none';
	fueltank.style.display = 'none';
	home.style.display = 'block';
	road.style.opacity = .4;
	text.innerText = noovolariOutRun.ASSETS.TEXTS.thePhrase;
	// Hall of fame!
	highscores.push(lap.innerText);
	highscores.sort();
	noovolariOutRun.updateHighscore();
	// No more in game
    inGame = false;
  } else {
	// we use the pad prototype for texting purposes
    time.innerText = (countDown|0).pad(3); 
    score.innerText = (scoreVal|0).pad(8);
    tacho.innerText = speed | 0;
	
    // We create the lap time
    let cT = new Date(noovolariOutRunHelper.timestamp() - start);
    lap.innerText = `${cT.getMinutes()}'${cT.getSeconds().pad(2)}"${cT.getMilliseconds().pad(3)}`;
  }

  // sound: play engine if our speed is more than 0
  if(speed > 0) 
	  audio.play('engine', speed * 4);

  // draw cloud: we use the | method to ensure the value is clamped when needed
  cloud.style.backgroundPosition = `${ (cloudOffset -= lines[startPos].curve * step * speed * .13) | 0}px 0`;

  // other cars
  let ind = cars.length;
  while (ind--) {
    let car = cars[ind]; 
    car.pos = (car.pos + enemy_speed * step) % N;

    // respawn
    if( (car.pos|0) === endPos) {
      if(speed < 30) 
		car.pos = startPos;
      else
		car.pos = endPos - 2;

      car.lane = noovolariOutRunHelper.randomProperty(LANE);
    }

    // collision
    const offsetRatio = 5;
    if((car.pos|0) === startPos && noovolariOutRunHelper.isCollide(playerX * offsetRatio + LANE.B, .5, car.lane, .5)) {
      if(car instanceof Car) {
        speed = Math.min(hitSpeed, speed);
        if(inGame) 
          audio.play('honk');
      } else {
		if(inGame) {  
			fuel += car.getFuel();
			fuel = Math.min(maxFuel, fuel);
			audio.play('powerup');
		}
      }
    }

  }

  // draw road
  let maxy = height;
  let camH = H + lines[startPos].y;
  let x = 0;
  let dx = 0;

  for (let n = startPos; n < startPos + N; n++) {

    let l = lines[n % N];
    let level = N * 2 - n;

    // update view
    l.project(playerX * roadW - x, camH, startPos * segL - (n >= N ? N * segL : 0));
    x += dx;
    dx += l.curve;

    // clear assets
    l.clearSprites();

    // first draw section assets
    if(n % 10 === 0) {
      if(l.ltree)
        l.drawSprite(level, 0, noovolariOutRun.ASSETS.IMAGE.TREE[mapName], -2.2);
      else
        l.drawSprite(level, 0, 
          (l.lpanel ? noovolariOutRun.ASSETS.IMAGE.PANEL : noovolariOutRun.ASSETS.IMAGE.PANEL2),
           -2.2);
    }
    if((n + 5) % 10 === 0) {
      if(l.rtree)
        l.drawSprite(level, 0, noovolariOutRun.ASSETS.IMAGE.TREE[mapName], 1.3);
      else
        l.drawSprite(level, 0, 
          (l.rpanel ? noovolariOutRun.ASSETS.IMAGE.PANEL : noovolariOutRun.ASSETS.IMAGE.PANEL2),
          1.3);
    }

    if(l.special) 
		  l.drawSprite(level, 0, l.special, l.special.offset||0);

    for(let car of cars) 
      if((car.pos|0) === n % N) 
        l.drawSprite(level, car.element, car.type, car.lane);

    // update road
    if (l.Y >= maxy ) 
	  	continue;
    maxy = l.Y;

    let even = ((n / 2) | 0) % 2;
    let grass = noovolariOutRun.ASSETS.COLOR[mapName].GRASS[even * 1];
    let rumble = noovolariOutRun.ASSETS.COLOR[mapName].RUMBLE[even * 1];
    let tar = noovolariOutRun.ASSETS.COLOR[mapName].TAR[even * 1];

    let p = lines[(n - 1) % N];

    noovolariOutRunHelper.drawQuad(l.elements[0], level, grass, width / 4, p.Y, halfWidth + 2, width / 4, l.Y, halfWidth);
    noovolariOutRunHelper.drawQuad(l.elements[1], level, grass, width / 4 * 3, p.Y, halfWidth + 2, width / 4 * 3, l.Y, halfWidth);

    noovolariOutRunHelper.drawQuad(l.elements[2], level, rumble, p.X, p.Y, p.W * 1.15, l.X, l.Y, l.W * 1.15);
    noovolariOutRunHelper.drawQuad(l.elements[3], level, tar, p.X,p.Y, p.W, l.X, l.Y, l.W);

    if(!even) {
      noovolariOutRunHelper.drawQuad(l.elements[4], level, noovolariOutRun.ASSETS.COLOR[mapName].RUMBLE[1], p.X, p.Y, p.W * .4, l.X, l.Y, l.W * .4);
      noovolariOutRunHelper.drawQuad(l.elements[5], level, tar, p.X, p.Y, p.W * .35, l.X, l.Y, l.W * .35);
    }

  }

};

/** We use this to update our Hall of Fame */
noovolariOutRun.updateHighscore = function() {
  let hN = Math.min(12, highscores.length); // basically we create an array up to a maximum of 12 scores
  for(let i = 0; i < hN; i++) {
	// ...aaaand set the score!
    highscore.children[i].innerHTML = `${(i+1).pad(2, '&nbsp;')}. ${highscores[i]}`;
  }
};

/** We can listen with more than a single function per event */ 
window.addEventListener('keyup', function(e){
	// Toggle mute on/off
	if(e.code === 'KeyM') {
		e.preventDefault();
		audio.volume = (audio.volume === 0) ? 1 : 0;
		return;
  }
  
  // Select Level
  if(e.code === 'KeyL') {
    e.preventDefault();
    window.location.reload();
		return;
  }
  
   // Start the game!
	if(e.code === 'KeyB') {
		e.preventDefault();

		if(inGame) return; // if already in game do nothing

		// This is fun! We use multiple concatenation of promises of sleep 
		// to define an animation of timer countdown before start
		// the _ => {} is an ES6 notation for function() {}, i've added 
		// it here for compatting the code and for your interest
		noovolariOutRunHelper.sleep(0).then(_ => {
			text.classList.remove('blink');
			text.innerText = 3;
			audio.play('beep');
			return noovolariOutRunHelper.sleep(1000);
		}).then(_ => {
			text.innerText = 2;
			audio.play('beep');
			return noovolariOutRunHelper.sleep(1000);
		}).then(_ => {
			// We reset all ingame variables to default values
			noovolariOutRun.reset();
			// We remove the curtain and make the game fully visible
			home.style.display = 'none';
			road.style.opacity = 1;
			tazio.style.display = 'block';
			hud.style.display = 'block';
			audio.play('beep', 500);
			inGame = true;
		});
		return;
  }

  if(e.code === 'Escape') {
	// Just reset and exit
    e.preventDefault();
    noovolariOutRun.reset();
  }

});

/** Init function for the game: we define everything we need in order to make it work correctly */
noovolariOutRun.init = function(mapName) {

  // Our game 'canvas'
  game.style.width = width + 'px';
  game.style.height = height + 'px';
  
  // Our fearless hero: Tazio with his noovolari special!
  tazio.style.top = height - 105 + 'px';
  tazio.style.left = halfWidth - noovolariOutRun.ASSETS.IMAGE.TAZIO.width / 6 + 'px';
  tazio.style.background = `url(${noovolariOutRun.ASSETS.IMAGE.TAZIO.src})`;
  tazio.style.width = `${noovolariOutRun.ASSETS.IMAGE.TAZIO.width/3}px`;
  tazio.style.height = `${noovolariOutRun.ASSETS.IMAGE.TAZIO.height}px`;
  
  // Background
  cloud.style.backgroundImage = `url(${noovolariOutRun.ASSETS.IMAGE.SKY[mapName].src})`;
  // Audio engine, we are preloading all the sound objects
  audio = new Audio(mapName);
  Object.keys(noovolariOutRun.ASSETS.AUDIO[mapName]).forEach(key => audio.load(noovolariOutRun.ASSETS.AUDIO[mapName][key], key, _=>0));
  
  // Some extra cars to be spawned at precise time of the track
  cars.push(new Car(0, noovolariOutRun.ASSETS.IMAGE[mapName].CAR, LANE.C));
  cars.push(new Car(10, noovolariOutRun.ASSETS.IMAGE[mapName].CAR2, LANE.B));
  cars.push(new Fuel(20, noovolariOutRun.ASSETS.IMAGE[mapName].CAR, LANE.C));
  cars.push(new Car(35, noovolariOutRun.ASSETS.IMAGE[mapName].CAR2, LANE.C));
  cars.push(new Car(50, noovolariOutRun.ASSETS.IMAGE[mapName].CAR4, LANE.A));
  cars.push(new Fuel(60, noovolariOutRun.ASSETS.IMAGE[mapName].CAR3, LANE.B));
  cars.push(new Car(70, noovolariOutRun.ASSETS.IMAGE[mapName].CAR3, LANE.A));
  cars.push(new Car(80, noovolariOutRun.ASSETS.IMAGE[mapName].CAR4, LANE.B));
  cars.push(new Fuel(90, noovolariOutRun.ASSETS.IMAGE.FUEL, LANE.A));
  
  // Create the actual track: we prepare a basic track with 'empty object' 
  for (let i = 0; i < N; i++) {
	// Please leave the number as is as some of them are made by test and trials
    var line = new Line;
	// basically as we are going away the z is increased to make 
	// sure that every new element is over the previous one, giving
	// the illusion of a continuous lane
    line.z = i * segL + 270;

	// prepare the road and line object with 8 elements 
	// that define the possible objects in a viewing 
	// frustrum: the idea is that we add and remove line 
	// out of our view and we use update to fill them with
    // effects and objects
    for (let j = 0; j < 8; j++) {
      var element = document.createElement('div');
      road.appendChild(element);
      line.elements.push(element);
    }

    // Save the line
    lines.push(line);
  }

  // We have the classic twelve element scoreboard...aaaah feels so '80!
  for(let i = 0; i < 12; i++) {
    var element = document.createElement('p');
    highscore.appendChild(element);
  }
  
  // Update the score and reset
  noovolariOutRun.updateHighscore();
  noovolariOutRun.reset();

  // START GAME LOOP === this is interesting we call a self invoking function with a 
  ;(function loop(){
	// this is needed to make animation without canvas, basically we ask the browser to give us priority on the GPU
  	requestAnimationFrame(loop);

  	let now = noovolariOutRunHelper.timestamp();
  	let delta = now - then;
	
    // One important thing here is that now and then are global as we need them throught the entire game
  	if (delta > targetFrameRate) {
		// Get our timestamp for the game loop
  		then = now - (delta % targetFrameRate);
		// Call the map update
  		noovolariOutRun.update(delta / 1000, mapName);
  	}
  })();
};

noovolariOutRun.chooseLevel = function(){
  road.classList.add("hidden");
  home.classList.add("hidden");
  hud.classList.add("hidden");

  level1.addEventListener('click', function(e){
    road.classList.remove("hidden");
    home.classList.remove("hidden");
    hud.classList.remove("hidden");
    levels.classList.add("hidden");
    // Start the game engine!
    noovolariOutRun.init("MAP1");
  });

  level2.addEventListener('click', function(e){
    road.classList.remove("hidden");
    home.classList.remove("hidden");
    hud.classList.remove("hidden");
    levels.classList.add("hidden");
    // Start the game engine!
    noovolariOutRun.init("MAP2");
  });

  level3.addEventListener('click', function(e){
    road.classList.remove("hidden");
    home.classList.remove("hidden");
    hud.classList.remove("hidden");
    levels.classList.add("hidden");
    // Start the game engine!
    noovolariOutRun.init("MAP3");
  });

  level4.addEventListener('click', function(e){
    road.classList.remove("hidden");
    home.classList.remove("hidden");
    hud.classList.remove("hidden");
    levels.classList.add("hidden");
    // Start the game engine!
    noovolariOutRun.init("MAP4");
  });
};

noovolariOutRun.chooseLevel();