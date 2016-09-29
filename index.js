var snap7 = require('node-snap7');
var Service, Characteristic;
var s7client = new snap7.S7Client();


module.exports = function(homebridge) {
    // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  
  homebridge.registerAccessory('homebridge-s7plc', 's7_bulb', S7PLCAccessoryBulb, true);
  homebridge.registerAccessory('homebridge-s7plc', 's7_tempsensor', S7PLCAccessoryTempsens, true);
  
}


function S7PLCAccessoryBulb(log, config) {
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
    
    this.log("Starting a S7_Bulb Service '" + this.bulbName + "' on A%d.%d", this.arbyte, this.arbit);
}

S7PLCAccessoryBulb.prototype.setPowerOn = function(powerOn, callback) {
    var ip = this.ip;
    var buf = this.buf;
    var db = this.db;
    var dbbyte = this.dbbyte;
    var dbbit;
    
      //Set the correct Bit for the operation
    if (powerOn) {
      buf[0] = Math.pow(2, this.dbbiton);
      this.state = 1;
      dbbit = this.dbbiton;
    } else {
      buf[0] = Math.pow(2, this.dbbitoff);
      this.state = 0;
      dbbit = this.dbbitoff;
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
  
S7PLCAccessoryBulb.prototype.getPowerOn = function(callback) {
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
        
        if ((res[0] && value) == value) {
          state = 1;
        } else {
          state = 0;
        }
        console.log(res[0]+" %d | A%d.%d: %d", value, arbyte, arbit, state);
          
          if(err)
          return console.log(' >> DBRead failed. Code #' + err + ' - ' + s7client.ErrorText(err));
       });
    });
    this.log("Power state of A%d.%d is %d", arbyte, arbit, state);
    callback(null, state);
  };
  
S7PLCAccessoryBulb.prototype.getServices = function() {
    var lightbulbService = new Service.Lightbulb(this.name);
    
    lightbulbService
      .getCharacteristic(Characteristic.On)
      .on('get', this.getPowerOn.bind(this))
      .on('set', this.setPowerOn.bind(this));
    
    return [lightbulbService];
}



// ==================================
// TempSensor
//========================================

function S7PLCAccessoryTempsens(log, config) {
    this.log = log;
    this.ip = config['PLC_IP_Adr'];
    this.name = config['name'];
    this.db = config['DB'];
    this.dbbyte = config['Byte'];
    //this.tempwert = 14.3;
    this.log("Starting a S7_TempSensor Service '" + this.name + "' on DB%d.DBW%d", this.db, this.dbbyte);
}

S7PLCAccessoryTempsens.prototype.getCurrentTemp = function(callback) {
    var ip = this.ip;
    var dbbyte = this.dbbyte;
    var db = this.db;
    var tempwert = 15.3;
    
    s7client.ConnectTo(ip, 0, 2, function(err) {
      if(err)
        return console.log(' >> Connection failed. Code #' + err + ' - ' + s7client.ErrorText(err));
        
        // Read one byte from PLC process outputs...
      s7client.ReadArea(s7client.S7AreaDB,db, dbbyte, 1, s7client.S7WLWord, function(err, res) {
          if(err)
          return console.log(' >> DBRead failed. Code #' + err + ' - ' + s7client.ErrorText(err));
      
          // Calculate right Value
          console.log('1:', db, dbbyte, res, tempwert); 
          tempwert = (res[0] * 256 + res[1]) / 10;
          console.log('2:', db, dbbyte, res, tempwert);   
      });
    console.log('3:', tempwert);     
    });
    this.log("Temp Value of DB%d.DBW%d is %d", db, dbbyte, tempwert);
    callback(null, tempwert);
  };
  
S7PLCAccessoryTempsens.prototype.getServices = function() {
    var tempsensService = new Service.TemperatureSensor(this.name);
    
    tempsensService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getCurrentTemp.bind(this));

    
    return [tempsensService];
}

