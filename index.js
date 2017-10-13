/*jshint node:true */
"use strict";
/*
 * Copyright 2017 Ian Boston <ianboston@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const Bacon = require('baconjs');
const fs = require('fs');



module.exports = function(app) {
  var sensors = require('./sensors');  
  var plugin = {};
  var unsubscribes = [];







  plugin.start = function(config) {
    console.log("Sensor Config ", JSON.stringify(config));
    plugin.sensors = new sensors.Sensors(app, plugin, config);
  }

  plugin.stop = function() {

    if ( plugin.sensors !== undefined ) {
      plugin.sensors.close();
      plugin.sensors = undefined;
    }
  }

  plugin.id = "sk-sensors"
  plugin.name = "Multi Sensors"
  plugin.description = "Plugin reads connected sensors emitting wind, heading, heal, speed data"

  var sensorConfig = {};

  


  plugin.schema = {
    title: "Multi Sensors",
    description: "This plugin records pulses emitted from water and wind speed sensors, reads sin and cos" +
     "voltages and uses a 10Dof sensor to provided dynamically corrected aparent and true wind as well " +
     "as water speed and leeway. Unfortunately the sensors need calibrating. The 10Dof sensor needs  " +
     "calibrating as per the RTIMULib2 instuctions. The speed sensors may have non linearity wrt heal and speed " +
     "and the wind sensor output needs to be calibrated for max and min sin and cos voltages. There is an assumption " +
     "that the wind direction sensor is of high enough quality to ensure no angular non linearity.",
    type: "object",
    properties: {
      windSensor: {
        title: "Wind Sensor Configuration",
        description: "The WindSensor provides pulse output for speed and a voltage for sin and cos.",
        type: "object",
        properties: {
          pulsePin: {
            type: 'number',
            title: "GPIO Pin number for wind pulses",
            default: 6
          },
          speedCalibration: {
            type: 'array',
            title: "Wind Speed Calibration",
            description: "If the wind speed sensor pulse frequency is linear relative to wind speed, enter 1 value, otherwise enter more values to deal with the non-linearity. ",
            items: {
              type: 'object',
              required: ['frequency', 'speed'],
              properties: {
                frequency: {
                  type: 'number',
                  title: 'Pulse Hz',
                  default: 1.045
                },
                speed: {
                  type: 'number',
                  title: 'Speed in Kn',
                  default: 1
                }
              }
            }
          },
          heelCalibrationFactor: {
            type: 'array',
            title: "Wind speed to heel correction factor",
            description: "If the wind speed sensor corrected speed output is uniform relative to heel, then only add an entry of 0 with a factor of 1.0, otherwise enter more vales to deal with the non linearity. The speed sensor is already corrected for a standard anenomitor model so no adjustment should be required.",
            items: {
              type: 'object',
              required: ['angleOfHeel', 'factor'],
              properties: {
                angleOfHeel: {
                  type: 'number',
                  title: 'Angle of Heel',
                  default: 0.0
                },
                factor: {
                  type: 'number',
                  title: 'Factor',
                  default: 1.0
                }
              }
            }
          },

          adcAddress: {
            type: 'string',
            title: 'i2C address of the ADC',
            default: "0x23"
          },
          sinCh: {
            type: 'number',
            title: 'ADC Channel Number for Sin voltage',
            default: 0
          },
          sinMax: {
            type: 'number',
            title: 'Maximum Sin voltage',
            default: 6.0
          },
          sinMin: {
            type: 'number',
            title: 'Minimum Sin voltage',
            default: 2.0
          },
          cosCh: {
            type: 'number',
            title: 'ADC Channel Number for Cos voltage',
            default: 0
          },
          cosMax: {
            type: 'number',
            title: 'Maximum Cos voltage',
            default: 6.0
          },
          cosMin: {
            type: 'number',
            title: 'Minimum Cos voltage',
            default: 2.0
          }
        }
      },
      waterSensor: {
        title: "Water Sensor Configuration",
        description: "The WaterSensor provides pulse output for speed.",
        type: "object",
        properties: {
          pulsePin: {
            type: 'number',
            title: "GPIO Pin number for water pulses",
            default: 6
          },
          speedCalibration: {
            type: 'array',
            title: "Water speed calibration.",
            description: "If the water speed sensor pulse frequency is linear relative to water speed, enter 1 value, otherwise enter more values to deal with the non-linearity. Typically a paddle wheel sensor will be non linear at lower and higher speeds.",
            items: {
              type: 'object',
              required: ['frequency', 'speed'],
              properties: {
                frequency: {
                  type: 'number',
                  title: 'Pulse Hz',
                  default: 5.5
                },
                speed: {
                  type: 'number',
                  title: 'Speed in Kn',
                  default: 1
                }
              }
            }
          },
          heelCalibrationFactor: {
            type: 'array',
            title: "Water speed to heel correction factor",
            description: "If the water speed reading is not effected by heel, then enter 0 and 1.0 for the factor. Otherwise enter values to deal with the non-linearity. Hulls that a extreemly wide and flat may be non linear with heel.",
            items: {
              type: 'object',
              required: ['angleOfHeel', 'factor'],
              properties: {
                angleOfHeel: {
                  type: 'number',
                  title: 'Angle of Heel',
                  default: 0.0
                },
                factor: {
                  type: 'number',
                  title: 'Factor',
                  default: 1.0
                }
              }
            }
          }
        }
      },
      imu: {
        title: "IMU Sensor Configuration",
        description: "The IMU Sensor is a 10Dof sensor gyro, magnetomitor and accelleration and temperature and humidity.",
        type: "object",
        properties: {
          pulsePin: {
            type: 'number',
            title: "GPIO Pin number for water pulses",
            default: 6
          }
        }
      },
      boat: {
        title: "Boat Configuration",
        description: "Factors relating to the boat and geometry.",
        type: "object",
        properties: {
          kfactor: {
            type: 'number',
            title: "K Factor relating leeway to heel.",
            default: 9.0
          },
          kupwash: {
            type: 'number',
            title: "Upwash K Factor defineing the impact of upwash on wind angle.",
            default: 9.0
          },
          mastHeight: {
            type: 'number',
            title: "High of mast in m above center of heel, normally waterline.",
            default: 19.0
          }
        }
      }
    }
  }



  plugin.uiSchema = {
    "ui:order": [
    'boat',
    'windSensor',
    'waterSensor',
    'imu'
    ]
  };


  return plugin;
}
