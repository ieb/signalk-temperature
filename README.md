# signalk-temperature
Assumes that ds18d20 1 wire sensors are connected to the 1 wire interface of the device (normally a Pi), and the
1-wire kernel module is loaded. Then it reads values of all sensors and emits readings for the configured paths.
The Plugin needs to be configured to select the SignalK path mapping to each sensor.
