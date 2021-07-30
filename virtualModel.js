// preload.js offers the following functions:
// modbus.getCoil, modbus.getHoldingRegister, modbus.setDiscreteInput, 
// modbus.setInputRegister

///////////////////////////////////////////////////////
// Variables and constants for the model-state:
let parkedCarsCount = 0;   // between 0 and 10 (inklisive)
let carAtEntrancePresent = false;
let carAtExitPresent=false;
let carPosEntrance = 0.0;  // between 0.0 and 1.0
let carPosExit = 0.0;      // between 0.0 and 1.0
let barrierPosEntrance = Math.random();// between 0.0 and 1.0
let barrierPosExit = Math.random();    // between 0.0 and 1.0
let motorOverloadTimeEntrance=0; // 0 is cool, 2000 (ms) means overloaded
let motorOverloadTimeExit=0;     // 0 is cool, 2000 (ms) means overloaded

// constants
const TIMER_INTERVAL = 100;
const BARRIER_MIN_HEIGHT = 30;  //from SVG-file
const BARRIER_MAX_HEIGHT = 100; //from SVG-file
const CAR_LEFT_POS = 50;        //from SVG-file
const CAR_RIGHT_POS = 250;      //from SVG-file

////////////////////////////////////////////////////
// Helper-functions for drawing objects in SVG

let svgObject = undefined;

// Hide and show cars and draw them at the right position
function drawCars() {
  let elt = svgObject.getElementById("car_entrance")
  if (carAtEntrancePresent) {
    elt.style.display="";
    elt.transform.baseVal[0].matrix.e =
        CAR_LEFT_POS + (CAR_RIGHT_POS-CAR_LEFT_POS)*carPosEntrance;
  }
  else {
    elt.style.display="none";
    elt.transform.baseVal[0].matrix.e = CAR_LEFT_POS;
  }
  elt = svgObject.getElementById("car_exit")
  if (carAtExitPresent) {
    elt.style.display="";
    elt.transform.baseVal[0].matrix.e =
        CAR_RIGHT_POS + (CAR_LEFT_POS-CAR_RIGHT_POS)*carPosExit;
  }
  else {
    elt.style.display="none";
    elt.transform.baseVal[0].matrix.e = CAR_RIGHT_POS;
  }
}

function drawBarriers() {
  let elt = svgObject.getElementById("barrier_entrance");
  elt.setAttribute("height", 
      BARRIER_MIN_HEIGHT + 
      (BARRIER_MAX_HEIGHT-BARRIER_MIN_HEIGHT)*barrierPosEntrance);
  elt = svgObject.getElementById("barrier_exit");
  elt.setAttribute("height", 
      BARRIER_MIN_HEIGHT + 
      (BARRIER_MAX_HEIGHT-BARRIER_MIN_HEIGHT)*barrierPosExit);
  
  // Check for Motor-Overload
  elt = svgObject.getElementById("smoke_entrance");
  elt.style.display = (motorOverloadTimeEntrance >= 5000) ? "" : "none";
  elt = svgObject.getElementById("smoke_exit");
  elt.style.display = (motorOverloadTimeExit >= 5000) ? "" : "none";
  
  // Check for crash between barrier and car
  elt = svgObject.getElementById("crash_entrance");
  elt.style.display = 
      (0.3 < carPosEntrance && carPosEntrance < 0.7 && barrierPosEntrance >0.1) ?
          "" : "none";
  elt = svgObject.getElementById("crash_exit");
  elt.style.display = 
      (0.3 < carPosExit && carPosExit < 0.7 && barrierPosExit >0.1) ?
          "" : "none";
}

function drawParkedCars() {
  for(let i=1; i<=10; i++) {
    let elt = svgObject.getElementById("parked_car_"+i);
    elt.style.display = (i<=parkedCarsCount) ? "" : "none";
  } 
}

function drawInputLedState(ledNumber, val) {
  let elt = svgObject.getElementById("led_input_" + ledNumber);
  if (elt) elt.style.fill = val ? "#7FFF00" : "#e5ffd5";
}

function drawCoilLedState(ledNumber, val) {
  let elt = svgObject.getElementById("led_coil_" + ledNumber);
  if (elt) elt.style.fill = val ? "#7FFF00" : "#e5ffd5";
}


///////////////////////////////////////////////////////////////
// cyclic functions realising the barrier-movements

function cyclicMoveBarriers() {
  let motEntOp = modbus.getCoil(0);
  let motEntCl = modbus.getCoil(1);

  // Check for Motor running but barrier is already in end-position
  // or both motor-signals are on --> overload
  if ( (barrierPosEntrance <= 0.0 && motEntOp) || 
       (barrierPosEntrance >= 1.0 && motEntCl) ||
       (motEntOp && motEntCl)) {
    motorOverloadTimeEntrance += TIMER_INTERVAL;
  }
  // Open barrier:
  else if (motEntOp && barrierPosEntrance > 0.0) {
    barrierPosEntrance -= TIMER_INTERVAL/3000;
    if (barrierPosEntrance < 0.0) barrierPosEntrance = 0.0; 
    motorOverloadTimeEntrance = 0; // normal movement -> clear overload
  }
  // Close barrier:
  else if (motEntCl && barrierPosEntrance < 1.0) {
    barrierPosEntrance += TIMER_INTERVAL/3000;
    if (barrierPosEntrance > 1.0) barrierPosEntrance = 1.0; 
    motorOverloadTimeEntrance = 0; // normal movement -> clear overload
  }

  //same for other barrier
  let motExtOp = modbus.getCoil(2);
  let motExtCl = modbus.getCoil(3);

  if ( (barrierPosExit <= 0.00 && motExtOp) ||
       (barrierPosExit >= 1.0 && motExtCl) ||
       (motExtOp && motExtCl) ) {
    motorOverloadTimeExit += TIMER_INTERVAL;
  }
  else if (motExtOp && barrierPosExit > 0.0) {
    barrierPosExit -= TIMER_INTERVAL/3000;
    if (barrierPosExit < 0.0) barrierPosExit = 0.0;
    motorOverloadTimeExit = 0; // normal movement -> clear overload
  }
  else if (motExtCl && barrierPosExit < 1.0) {
    barrierPosExit += TIMER_INTERVAL/3000;
    if (barrierPosExit > 1.0) barrierPosExit = 1.0;
    motorOverloadTimeExit = 0; // normal movement -> clear overload
  }

  // Limit-switches
  modbus.setDiscreteInput(6, (barrierPosEntrance <= 0.01)); // LS_ENT_OP
  modbus.setDiscreteInput(7, (barrierPosEntrance >= 0.99)); // LS_ENT_CL
  modbus.setDiscreteInput(8, (barrierPosExit <= 0.01));     // LS_EXT_OP
  modbus.setDiscreteInput(9, (barrierPosExit >= 0.99));     // LS_EXT_CL
  drawInputLedState(6, (barrierPosEntrance <= 0.01));
  drawInputLedState(7, (barrierPosEntrance >= 0.99));
  drawInputLedState(8, (barrierPosExit <= 0.01));
  drawInputLedState(9, (barrierPosExit >= 0.99));
  
  // Draw results:
  drawBarriers();
}

/////////////////////////////////////////
// Functions for car putting, removing/parking, moving
// (Eventhandlers for buttons and sliders)

function onPutCarAtEntrance() {
  // If there is already a car or already 10 cars parked: do nothing
  if ( carAtEntrancePresent || parkedCarsCount==10) return;

  carAtEntrancePresent = true;
  carPosEntrance = 0.0;
  let elt = document.getElementById("sld_car_pos_entrance");
  elt.value = "0";
  elt.disabled = false;
  elt = document.getElementById("btn_put_car_entrance");
  elt.disabled = true;

  drawCars();
}

function onPutCarAtExit() {
  // If there is already a car, or no car has been parked: do nothing
  if ( carAtExitPresent || parkedCarsCount == 0 ) return;

  carAtExitPresent = true;
  carPosExit = 0.0;
  parkedCarsCount--;
  let elt = document.getElementById("sld_car_pos_exit");
  elt.value = "100";
  elt.disabled = false;
  elt = document.getElementById("btn_put_car_exit");
  elt.disabled = true;

  drawCars();
  drawParkedCars();
}

function onCarAtEntranceMoved() {
  
  if ( ! carAtEntrancePresent) return;

  let sliderVal = document.getElementById("sld_car_pos_entrance").value
  carPosEntrance = Number(sliderVal)/100.0;

  //Induction Loops:
  let indLoopBef =  (0.1 <= carPosEntrance && carPosEntrance <= 0.6);
  modbus.setDiscreteInput(0, indLoopBef);
  drawInputLedState(0, indLoopBef);
  let indLoopAft = (0.4 <= carPosEntrance && carPosEntrance <= 0.9);
  modbus.setDiscreteInput(1, indLoopAft);
  drawInputLedState(1, indLoopAft);

  // Enable Button  for Parking / Removing
  let enable = (carPosEntrance > 0.95);
  document.getElementById("btn_remove_car_entrance").disabled = ! enable;

  drawCars();
}

function onCarAtExitMoved() {
  
  if ( ! carAtExitPresent) return;

  let sliderVal = document.getElementById("sld_car_pos_exit").value
  carPosExit = (100 - Number(sliderVal))/100.0;

  //Induction Loops:
  let indLoopBef =  (0.1 <= carPosExit && carPosExit <= 0.6);
  modbus.setDiscreteInput(2, indLoopBef);
  drawInputLedState(2, indLoopBef);
  let indLoopAft = (0.4 <= carPosExit && carPosExit <= 0.9);
  modbus.setDiscreteInput(3, indLoopAft);
  drawInputLedState(3, indLoopAft);

  // Enable Button  for Parking / Removing
  let enable = (carPosExit > 0.95);
  document.getElementById("btn_remove_car_exit").disabled = ! enable;

  drawCars();
}

function onRemoveCarAtEntrance() {
  if (carPosEntrance < 0.95 || parkedCarsCount >= 10) return;

  carAtEntrancePresent = false;
  carPosEntrance = 0.0;

  parkedCarsCount++; 

  let elt = document.getElementById("btn_put_car_entrance");
  elt.disabled = false;
  elt = document.getElementById("sld_car_pos_entrance");
  elt.value="0";
  elt.disabled = true;
  elt = document.getElementById("btn_remove_car_entrance");
  elt.disabled = true; 

  drawCars();
  drawParkedCars();
}

function onRemoveCarAtExit() {
  if (carPosExit < 0.95) return;

  carAtExitPresent = false;
  carPosExit = 0.0;

  let elt = document.getElementById("btn_put_car_exit");
  elt.disabled = false;
  elt = document.getElementById("sld_car_pos_exit");
  elt.value="100";
  elt.disabled = true;
  elt = document.getElementById("btn_remove_car_exit");
  elt.disabled = true; 

  drawCars();
}

///////////////////////////////////////////
// Cyclic Function for Lamps

function cyclicLamps() {
  let lmpFull = modbus.getCoil(4);
  let lmpWarnEntrance = modbus.getCoil(5);
  let lmpWarnExit = modbus.getCoil(6);
  let lmpFree = modbus.getCoil(7);
  drawCoilLedState(4, lmpFull);
  drawCoilLedState(5, lmpWarnEntrance);
  drawCoilLedState(6, lmpWarnExit);
  drawCoilLedState(7, lmpFree);
  let elt = svgObject.getElementById("lamp_full");
  elt.style.fill = lmpFull ? "#ff4500" : "#ffe6d5";
  elt = svgObject.getElementById("lamp_warn_entrance");
  elt.style.fill = lmpWarnEntrance ? "#eeee00" : "#ffffe0";
  elt = svgObject.getElementById("lamp_warn_exit");
  elt.style.fill = lmpWarnExit ? "#eeee00" : "#ffffe0";
  elt = svgObject.getElementById("lamp_free");
  elt.style.fill = lmpFree ? "#7FFF00" : "#e5ffd5"
}

////////////////////////////////////////////
// Functios for Card- and Correcton-Buttons
function onCardEntrance() {
  modbus.setDiscreteInput(4, true);
  drawInputLedState(4, true);
  let elt = svgObject.getElementById("card_entrance");
  elt.style.fill = "#00ff7f"

  setTimeout( ()=> {
    modbus.setDiscreteInput(4, false);
    drawInputLedState(4, false);
    elt.style.fill = "#ffa07a";
  }, 1000);
}

function onCardExit() {
  modbus.setDiscreteInput(5, true);
  drawInputLedState(5, true);
  let elt = svgObject.getElementById("card_exit");
  elt.style.fill = "#00ff7f"

  setTimeout( ()=> { 
    modbus.setDiscreteInput(5, false);
    drawInputLedState(5, false);
    elt.style.fill = "#ffa07a";
  }, 1000);
}

function onCorrectionButtonPlus() {
  modbus.setDiscreteInput(12, true);
  drawInputLedState(12, true);

  setTimeout( ()=> { 
    modbus.setDiscreteInput(12, false);
    drawInputLedState(12, false);
  }, 300);
}

function onCorrectionButtonMinus() {
  modbus.setDiscreteInput(13, true);
  drawInputLedState(13, true);

  setTimeout( ()=> {
    modbus.setDiscreteInput(13, false);
    drawInputLedState(13, false);
  }, 300);
}

///////////////////////////////////////////
// Functions for checkboxes (Key-switch and Gas-Alarm)

function onKeySwitchChanged() {
  let state = document.getElementById("chk_key_switch").checked;
  modbus.setDiscreteInput(10, state);
  drawInputLedState(10, state);
}

function onGasAlarmChanged() {
  let state = document.getElementById("chk_gas_alarm").checked;
  modbus.setDiscreteInput(14, state);
  drawInputLedState(14, state);
}


///////////////////////////////////////////
// Initialize everything

window.onload = () => {
  svgObject = document.getElementById('svg-object').contentDocument;
  
  // initialize shown SVG-Elements and Buttons, Checkboxes, Sliders
  drawCars();
  drawBarriers();
  drawParkedCars();
  document.getElementById("btn_remove_car_entrance").disabled = true;
  document.getElementById("btn_remove_car_exit").disabled = true;
  document.getElementById("sld_car_pos_entrance").value="0";
  document.getElementById("sld_car_pos_entrance").disabled = true; 
  document.getElementById("sld_car_pos_exit").value="100";
  document.getElementById("sld_car_pos_exit").disabled = true;
  
  // Attach handlers to buttons and checkboxes
  document.getElementById("btn_put_car_entrance")
      .addEventListener("click", onPutCarAtEntrance);
  document.getElementById("btn_put_car_exit")
      .addEventListener("click", onPutCarAtExit);
  document.getElementById("sld_car_pos_entrance")
      .addEventListener("input", onCarAtEntranceMoved);
  document.getElementById("sld_car_pos_exit")
      .addEventListener("input", onCarAtExitMoved);
  document.getElementById("btn_remove_car_entrance")
      .addEventListener("click", onRemoveCarAtEntrance);
  document.getElementById("btn_remove_car_exit")
      .addEventListener("click", onRemoveCarAtExit);
  
  document.getElementById("btn_card_entrance")
      .addEventListener("click", onCardEntrance);
  document.getElementById("btn_card_exit")
      .addEventListener("click", onCardExit);
  document.getElementById("btn_cb_plus")
      .addEventListener("click", onCorrectionButtonPlus);
  document.getElementById("btn_cb_minus")
      .addEventListener("click", onCorrectionButtonMinus);

  document.getElementById("chk_key_switch")
      .addEventListener("input", onKeySwitchChanged);
  
      document.getElementById("chk_gas_alarm")
      .addEventListener("input", onGasAlarmChanged);

  // start the cyclic barrier-movement and Lamps
  setInterval(cyclicMoveBarriers, TIMER_INTERVAL); 
  setInterval(cyclicLamps, TIMER_INTERVAL);
}
