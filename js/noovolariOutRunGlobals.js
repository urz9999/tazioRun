// ============================================================
// NoovolariOutRun: copyright Alessandro Gaggia 2019 - beSharp
// global variables: used for various dynamics of the game
// ============================================================
const width = 1280;
const height = 700;
const maxSpeed = 240;
const mapLength = 30000;
const maxFuel = 50;
const tankBonus = 3;

// =========== BELOW VARIABLES MUST NOT BE MODIFIED =============
// These values where put with trials and error so is at your own 
// risk if you change them
// ==============================================================
const halfWidth = width / 2;
const highscores = [];
const roadW = 4000;
const segL = 200;
const camD = 0.2;
const H = 1500;
const N = 70;
const accel = 38;
const breaking = -80;
const decel = -40;
const maxOffSpeed = 40;
const offDecel = -70;
const enemy_speed = 8;
const hitSpeed = 20;

const LANE = {
  A: -2.3,
  B: -.5,
  C: 1.2
};

// Loop
const targetFrameRate = 1000 / 25; // in ms