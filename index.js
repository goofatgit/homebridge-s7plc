var snap7 = require('node-snap7');
var Service, Characteristic;
var s7client = new snap7.S7Client();

module.exports = function(homebridge) {
  console.log("homebridge API version: " + homebridge.version);

  // Accessory must be created from PlatformAccessory Constructor
  Accessory = homebridge.platformAccessory;

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  UUIDGen = homebridge.hap.uuid;
  
  // For platform plugin to be considered as dynamic platform plugin,
  // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
  homebridge.registerAccessory('homebridge-s7plc', 'S7PLC', S7PLCAccessory,true);
}


function S7PLCAccessory(log, config) {
    this.log = log;
    this.name = config['name'];
//    this.db = config['db'];
    this.service = new Service.Switch(this.name);

//    if (!this.db) throw new Error('You must provide a config value for db.');

}
S7PLCAccessory.prototype = {
     setPowerState: function(powerOn) {
         
        s7client.ConnectTo('192.168.1.240', 0, 1, function(err) {
            if(err)
                return console.log(' >> Connection failed. Code #' + err + ' - ' + s7client.ErrorText(err));
                
                // Read the first byte from PLC process outputs...
        s7client.DBWrite(20, 0.0, 1, powerOn, function(err, res) {
            if(err)
                return console.log(' >> ABRead failed. Code #' + err + ' - ' + s7client.ErrorText(err));
                    
        // ... and write it to stdout
        console.log(res)
            
        S7Client.Disconnect()
    });
});
}
