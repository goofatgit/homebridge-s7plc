# homebridge-s7plc

homebridge plugin for S7 PLC connect

Connects homebridge with Siemens S7 PLC

1. Create Lamp Accessories which will act like Homebridge devices.

Devices are controlled via a DB in the PLC.

Homebridge will check the Output of PLC to get the actual state when you start the app on your phone.

2. Create Temperature Sensoers that will show actual Temperature

# to install this plugin

 ```
sudo npm install -g https://github.com/goofatgit/homebridge-s7plc.git
 ```

# How it works
When homebridge wants to turn the device on it will set an onbit (WriteByte.WriteBitOn) in the specified DB.
When homebridge wants to turn the device off it will set an offbit (WriteByte.WriteBitOff) in the DB.
The Output is checked directly from the PLC Output A(ReadByte.ReadBit)

So you have to take care that the DB is there

After you used the bits to switch your output you have to reset them in the PLC like this

# PLC Code
 ```
//Bit in DB switches output on
U DB20.DBX0.0
S A0.5
//Bit in DB switches output off
U DB20.DBX0.1
R A0.5

//after switching is done reset on bit
U DB20.DBX0.0
U A0.5
R DB20.DBX0.0
//reset off bit
U DB20.DBX0.1
UN A0.5
R DB20.DBX0.1
 ```
for the Temperture the Value has to be an int like 231 for 23.1°C the division will be done in the software (Note that under Home in IOS 10 the temperature shown has no decimal place). Just give the DB Number and the startadress of the word like DB99.DBW2 as shown in the config-sample.json. 


Have fun!

# Special thanks to
Davide Nardella for creating snap7

Mathias Küsel for giving us the node.js addon/wrapper for snap7
