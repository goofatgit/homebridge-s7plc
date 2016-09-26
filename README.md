# homebridge-s7plc
homebridge plugin for S7 PLC connect

Connects homebridge with Siemens S7 PLC

Create Lamp Accessories which will act like Homebridge devices.

Devices are controlled via a DB in the PLC
Homebridge will check the Output of PLC to get the actual state when you start the app on your phone.

When homebridge wants to set the device on it will set a bit(wbiton) in the specified DB. So you have to take care that the DB is there
