var snap7 = require('node-snap7');
var Service, Characteristic;
var s7client = new snap7.S7Client();


module.exports = function(homebridge) {
//  console.log("homebridge API version: " + homebridge.version);

  // Accessory must be created from PlatformAccessory Constructor
//  Accessory = homebridge.platformAccessory;

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
//  UUIDGen = homebridge.hap.uuid;
  
  // For platform plugin to be considered as dynamic platform plugin,
  // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
  homebridge.registerAccessory('homebridge-s7plc', 's7plc', S7PLCAccessory, true);
}


function S7PLCAccessory(log, config) {
    this.log = log;
    this.name = config['name'];
    this.bulbName = config["bulb_name"] || this.name;
    this.db = config['DB'];
    this.dbbyte = config['WriteByte'];
    this.dbbiton = config['WriteBitOn'];
    this.dbbitoff = config['WriteBitOff'];
    this.state = 0;
    this.arbyte = config['ReadByte'];
    this.arbit = config['ReadBit'];
    this.buf = Buffer.alloc(2);
//    if (!this.db) throw new Error('You must provide a config value for db.');
    this.log("Starting a S7PLC Service '" + this.bulbName + "' on A%d.%d", this.arbyte, this.arbit);
}

S7PLCAccessory.prototype.setPowerOn = function(powerOn, callback) {
  console.log("PO"+ this.name);  
  var buf = this.buf;
    var db = this.db;
    var dbbyte = this.dbbyte;
    
    if (powerOn) {
      buf[0] = Math.pow(2, this.dbbiton);
      this.state = 1;
    } else {
      buf[0] = Math.pow(2, this.dbbitoff);
      this.state = 0;
    }
    
    s7client.ConnectTo('192.168.1.240', 0, 2, function(err) {
      if(err)
        return console.log(' >> Connection failed. Code #' + err + ' - ' + s7client.ErrorText(err));
    
        // Write the first byte from DB20...
      console.log(s7client.S7AreaDB, s7client.S7WLByte, buf, db, dbbyte);
      s7client.WriteArea(s7client.S7AreaDB, db, dbbyte, 1, s7client.S7WLByte, buf, function(err) {
        if(err)
          return console.log(' >> DBWrite failed. Code #' + err + ' - ' + s7client.ErrorText(err));
        
      s7client.Disconnect()
      });
    });
   this.log("Set power state on the '%s' to %s", this.bulbName, this.state);
    callback(null);
  };
  
S7PLCAccessory.prototype.getPowerOn = function(callback) {
  console.log("GP"+ this.name);
  var arbyte = this.arbyte;
  var arbit = this.arbit;
  var buf = this.buf;
  var state = this.state;
  var value = Math.pow(2, arbit);
  
    s7client.ConnectTo('192.168.1.240', 0, 2, function(err) {
      if(err)
        return console.log(' >> Connection failed. Code #' + err + ' - ' + s7client.ErrorText(err));
        
        // Read the first byte from PLC process outputs...
       //console.log(s7client.S7AreaPA, s7client.S7WLByte, buf, arbyte);
      s7client.ReadArea(s7client.S7AreaPA, 0, arbyte, 1, s7client.S7WLByte, function(err, res) {
        
       // console.log("ABRead result is: %d", res[0]);
        if (res[0] && value == value) {
          state = 1;
        } else {
          state = 0;
        }
        if(err)
          return console.log(' >> DBRead failed. Code #' + err + ' - ' + s7client.ErrorText(err));
          
          // ... and write it to Console and output
        s7client.Disconnect()
       });
    });
    
    this.log("Power state of Byte %d Bit %d is %d", arbyte, arbit, state);
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
