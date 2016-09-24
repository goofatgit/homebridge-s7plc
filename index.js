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
    this.binaryState = 0;
//    this.db = config['db'];
    this.state = 1;
    this.dbbit = 2;
    this.buf = Buffer.alloc(2);
//    if (!this.db) throw new Error('You must provide a config value for db.');
    this.log("Starting a S7PLC Service with name '" + this.bulbName + "'...");
}

S7PLCAccessory.prototype.setPowerOn = function(powerOn, callback) {
    
    if (powerOn) {
      this.buf[0] = 0;
    } else {
      this.buf[0] = 2;
    }
  
    s7client.ConnectTo('192.168.1.240', 0, 2, function(err) {
      if(err)
        return console.log(' >> Connection failed. Code #' + err + ' - ' + s7client.ErrorText(err));
        
        // Write the first byte from DB20...
       console.log(s7client.S7AreaPA, s7client.S7WLByte, this.buf);
      s7client.WriteArea(s7client.S7AreaPA, 0, 4, 1, s7client.S7WLByte, this.buf, function(err) {
        if(err)
          return console.log(' >> ABWrite failed. Code #' + err + ' - ' + s7client.ErrorText(err));
        
        s7client.Disconnect()
        callback(null);
      });
    });
    callback(null);
  };
  
S7PLCAccessory.prototype.getPowerOn = function(callback) {
  var dbbit = this.dbbit
    s7client.ConnectTo('192.168.1.240', 0, 2, function(err) {
      if(err)
        return console.log(' >> Connection failed. Code #' + err + ' - ' + s7client.ErrorText(err));
        
        // Read the first byte from PLC process outputs...
      s7client.ReadArea(s7client.S7AreaPA, 0, 4, 1, s7client.S7WLByte, function(err, res) {
        
        console.log("ABRead result is: %d", res[0]);
        if (res[0] && this.dbbit == this.dbbit) {
          this.state = 1;
        } else {
          this.state = 0;
        }
        if(err)
          return console.log(' >> DBRead failed. Code #' + err + ' - ' + s7client.ErrorText(err));
          
          // ... and write it to Console and output
        console.log(res, this.dbbit, this.state);
        s7client.Disconnect()
       });
    });
      
    console.log("Power state is %d",this.state);
    callback(null, this.state);
  };
  
S7PLCAccessory.prototype.getServices = function() {
    var lightbulbService = new Service.Lightbulb(this.name);
    
    lightbulbService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getPowerOn.bind(this))
      .on('set', this.setPowerOn.bind(this));
    
    return [lightbulbService];
}
