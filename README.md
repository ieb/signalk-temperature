# signalk-sailsensors
This SignalK plugin gathers data from sensors and produces wind and water speed information, including calculating other information.

It measures the frequency of pulses from wind and water speed sensors. Measures cos and sin voltages for direction and uses IMU rates of rotation to adjust for relative motion as well as using roll to determine leeway. This is all done inside this module to ensure that the input data from all the sensors is at the appropriate frequency and fresh. It should not be used at the same time as the signalK IMU plugin as this could generate duplicate data or consume too much i2C bandwidth. 

It expects 2x pulse inputs, an A2D on i2c and a 10Dof also on I2C.
