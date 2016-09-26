var snap7 = require('node-snap7');
var Service, Characteristic;
var s7client = new snap7.S7Client();


module.exports = function(homebridge) {
    // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory('homebridge-s7plc', 's7plc', S7PLCAccessory, true);
}


function S7PLCAccessory(log, config) {
    this.log = log;
    this.ip = config['PLC_IP_Adr'];
    this.name = config['name'];
    this.bulbName = config['bulb_name'] || this.name;
    this.db = config['DB'];
    this.dbbyte = config['WriteByte'];
    this.dbbiton = config['WriteBitOn'];
    this.dbbitoff = config['WriteBitOff'];
    this.arbyte = config['ReadByte'];
    this.arbit = config['ReadBit'];
    this.buf = Buffer.alloc(2);
    this.state = 0;
    
      //Check if everything is there to create Service correctly
    if (!this.db) throw new Error('You must provide a config value for DB.');
    if (!this.dbbyte) throw new Error('You must provide a config value for WriteByte.');
    if (!this.dbbiton) throw new Error('You must provide a config value for WriteBitOn.');
    if (!this.dbbitoff) throw new Error('You must provide a config value for WriteBitOff.');
    if (!this.arbyte) throw new Error('You must provide a config value for ReadByte.');
    if (!this.arbit) throw new Error('You must provide a config value for ReadBit.');
    
    this.log("Starting a S7PLC Service '" + this.bulbName + "' on A%d.%d", this.arbyte, this.arbit);
}

S7PLCAccessory.prototype.setPowerOn = function(powerOn, callback) {
    var ip = this.ip;
    var buf = this.buf;
    var db = this.db;
    var dbbyte = this.dbbyte;
    var dbbit = this.dbbit;
    
      //Set the correct Bit for the operation
    if (powerOn) {
      buf[0] = Math.pow(2, this.dbbiton);
      this.state = 1;
    } else {
      buf[0] = Math.pow(2, this.dbbitoff);
      this.state = 0;
    }
    
    s7client.ConnectTo(ip, 0, 2, function(err) {
      if(err)
        return console.log(' >> Connection failed. Code #' + err + ' - ' + s7client.ErrorText(err));
    
            // Write one byte to DB...
      s7client.WriteArea(s7client.S7AreaDB, db, dbbyte, 1, s7client.S7WLByte, buf, function(err) {
        if(err)
          return console.log(' >> DBWrite failed. Code #' + err + ' - ' + s7client.ErrorText(err));
      });
    });
    
    this.log("Set power state to %s. Set bit DB%d.DBX%d.%d", this.state, db, dbbyte, dbbit);
    callback(null);
  };
  
S7PLCAccessory.prototype.getPowerOn = function(callback) {
    var ip = this.ip;
    var arbyte = this.arbyte;
    var arbit = this.arbit;
    var buf = this.buf;
    var state = this.state;
    var value = Math.pow(2, arbit);
  
    s7client.ConnectTo(ip, 0, 2, function(err) {
      if(err)
        return console.log(' >> Connection failed. Code #' + err + ' - ' + s7client.ErrorText(err));
        
        // Read one byte from PLC process outputs...
      s7client.ReadArea(s7client.S7AreaPA, 0, arbyte, 1, s7client.S7WLByte, function(err, res) {
        
        if (res[0] && value == value) {
          state = 1;
        } else {
          state = 0;
        }
        
          if(err)
          return console.log(' >> DBRead failed. Code #' + err + ' - ' + s7client.ErrorText(err));
       });
    });
    this.log("Power state of A%d.%d is %d", arbyte, arbit, state);
    callback(null, state);
  };
  
S7PLCAccessory.prototype.getServices = function() {
    var lightbulbService = new Service.Lightbulb(this.name);
    
    lightbulbService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getPowerOn.bind(this))
      .on('set', this.setPowerOn.bind(this));
    
    return [lightbulbService];
}
