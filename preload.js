const ModbusRTU = require("modbus-serial");
const { contextBridge } = require("electron");

//global constants
const MODBUS_PORT = process.env.MODBUS_PORT ? Number(process.env.MODBUS_PORT) : 1502;
const MODBUS_DEBUG = process.env.MODBUS_DEBUG ? true : false;
const MODBUS_TABLE_LENGTH = process.env.MODBUS_TABLE_LENGTH ? Number(process.env.MODBUS_TABLE_LENGTH) : 32;


////////////////////////////////////////////////////////////////////////////////////
// The Modubus-Server, original-code  is from here, and is only slightly modified:
// https://github.com/yaacov/node-modbus-serial/wiki/Example:--server

// The four Tables of the modbus-Server. They are Arrayss with a length of
// `MODBUS_TABLE_LENGTH` and an initial value of false or zero.
modbusTables = {
  discreteInputs :   Array.from( {length: MODBUS_TABLE_LENGTH} ).map( x => false ),
  coils :            Array.from( {length: MODBUS_TABLE_LENGTH} ).map( x => false ),
  inputRegisters :   Array.from( {length: MODBUS_TABLE_LENGTH} ).map( x => 0 ),
  holdingRegisters : Array.from( {length: MODBUS_TABLE_LENGTH} ).map( x => 0 )
};

// These callbacks are called by the Modbus-Server to get the values ist has
// to return to the modbus-client, or to set values sent from the client.
let modbusServerCallbacks = {

  getCoil: (addr, unitID) => {
    let val = modbusTables.coils[addr];
    if (MODBUS_DEBUG) console.debug(`Modbus-Server: Get Coil: addr=${addr}, unitID=${unitID}, returning ${val}`);
    if (val == undefined) val = false;
    return val; 
  },

  getDiscreteInput: (addr, unitID) => {
    let val = modbusTables.discreteInputs[addr];
    if (MODBUS_DEBUG) console.debug(`Modbus-Server: Get Discrete Input: addr=${addr}, unitID=${unitID}, returning ${val}`);
    if (val == undefined) val = false;
    return val; 
  },

  getInputRegister: (addr, unitID) => {
      let val = modbusTables.inputRegisters[addr];
      if (MODBUS_DEBUG) console.debug(`Modbus-Server: Get Input Register: addr=${addr}, unitID=${unitID}, returning ${val}`);
      if (val == undefined) val = 0;
      return val;
  },

  getHoldingRegister: (addr, unitID) => {
    let val = modbusTables.holdingRegisters[addr];
    if (MODBUS_DEBUG) console.debug(`Modbus-Server: Get Holding Register: addr=${addr}, unitID=${unitID}, returning ${val}`);
    if (val == undefined) val = 0;
    return val; 
  },

  setCoil: (addr, val, unitID) => {
    if (MODBUS_DEBUG) console.debug(`Modbus-Server: Set Coil: addr=${addr}, unitID=${unitID}, setting to ${val}`);
    if (addr>=MODBUS_TABLE_LENGTH) return;
    modbusTables.coils[addr] = val;
    // Inform the HTTP-Server, that it should not stall requests for reading coils any longer
    modbusTables.emit("coils_changed");
  },

  setRegister: (addr, val, unitID) => {
    if (MODBUS_DEBUG) console.debug(`Modbus-Server: Set Holding Register: addr=${addr}, unitID=${unitID}, setting to ${val}`);
    if (addr>=MODBUS_TABLE_LENGTH) return;
    modbusTables.holdingRegisters[addr] =  val;
    // Inform the HTTP-Server, that it should not stall requests for reading Holding Registers any longer
    modbusTables.emit("holding_registers_changed");
  }
};

// set the server to answer for modbus requests
let modbusServerTCP = new ModbusRTU.ServerTCP(modbusServerCallbacks, {host: '127.0.0.1', port:MODBUS_PORT, unitID:255 });

modbusServerTCP.on("initialized", ()=>
  console.log(`ModbusTCP listening on modbus://127.0.0.1:${MODBUS_PORT}`) 
);

////////////////////////////////////////////////////////////////
// Modbus-API for Client-Appication

contextBridge.exposeInMainWorld( "modbus", {
  
  getCoil: (addr) => { 
    if ( addr<0 || addr >= MODBUS_TABLE_LENGTH) {
      throw new RangeError("addr not in the range 0...31");
    }
    return modbusTables.coils[addr];
  },

  getHoldingRegister: (addr) => {
    if ( addr<0 || addr >= MODBUS_TABLE_LENGTH) {
      throw new RangeError("addr not in the range 0...31");
    }
    return modbusTables.holdingRegisters[addr];
  },

  setDiscreteInput: (addr, value) => {
    if ( addr<0 || addr >= MODBUS_TABLE_LENGTH) {
      throw new RangeError("addr not in the range 0...31");
    }
    if (typeof value !="boolean") {
      throw new RangeError("discrete-input-value not a boolean");
    }
    modbusTables.discreteInputs[addr] = value;
  },

  setInputRegister: (addr, value) => {
    if ( addr<0 || addr >= MODBUS_TABLE_LENGTH) {
      throw new RangeError("addr not in the range 0...31");
    }
    if (typeof value !="number" || value<0 || value >=65536) {
      throw new RangeError("register-value not a number or not in the range 0...65535");
    }
    modbusTables.inputRegisters[addr] = value;
  }
});