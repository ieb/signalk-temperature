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
  if ( fs.existsSync('/sys/bus/w1/devices/w1_bus_master1') ) { 
    // 1 wire is enabled a
    var sensors = require('ds18b20-raspi');  
    console.log("signalk-temperature: 1 Wire enabled, detecting sensors ");
  } else {
    var sensors = require('./fakesensor');
    console.log("signalk-temperature: 1 Wire is not enabled, Created Fake Sensor ", sensors);
  }
  var plugin = {};
  var unsubscribes = [];



  function convertToK(v) {
    return v+273.15;
  }




  plugin.start = function(config) {
    console.log("Temperature Config ", JSON.stringify(config));
    var IMU;

    plugin.temperatureInterval = setInterval(function() {
      sensors.readAllC((err, temps) => {
        if (err) {
          console.log("signalk-temperature:",err);
          return;
        }
        var values = [];
        for(var i = 0; i < temps.length; i++) {
          var path = config.sensors[temps[i].id];
          values.push({
            "path": path,
            "value":  convertToK(temps[i].t)
          });
        }



        var delta = {
          "context": "vessels." + app.selfId,
          "updates": [
            {
              "source": {
                "src": "1wire_temp_sensor"
              },
              "timestamp": (new Date()).toISOString(),
              "values": values
            }
          ]
        }        
        console.log("signalk-temperature: got temperature data: " + JSON.stringify(delta))
        app.handleMessage(plugin.id, delta);
      })
    }, config.temperaturePeriod*1000);


    
  }

  plugin.stop = function() {
    if ( plugin.temperatureInterval !== undefined ) {
      clearInterval(plugin.temperatureInterval);
    }
  }

  plugin.id = "sk-temp"
  plugin.name = "Temperature Source"
  plugin.description = "Plugin that reads Temperature data from 1-wire connected 18d20 sensors."

  var sensorConfig = {};
  var sensorList = sensors.list(null);
  for (var i = 0; i < sensorList.length; i++) {
    sensorConfig[sensorList[i]] = {
      title: "Sensor "+sensorList[i]+" mapping",
      type: "string",
      default: sensors.fakeSensors===undefined?"":sensors.fakeSensors[i].path
    }
  };

  


  plugin.schema = {
    title: "Temperatures Sensors",
    description: "This plugin reads 1 wire temperature sensors attached to the hardware, typically " +
     "ds18d20 devices and maps the readings to a SignalK path. The sensors are identified by a " +
     "unique ID. If your sensors are not labled, hold your hand on each one in turn to map the " +
     "physical sensor to an id.",
    type: "object",
    properties: {
      temperaturePeriod : {
        title: "Period",
        description: "period between deltas from this plugin in seconds.",
        type: "integer",
        default: 10
      },
      sensors: {
        title: "Sensor Mapping",
        description: "Each sensor needs to map to a signalk-path, if the sensor is disabled, leave the path empty. Possible paths are: "+
        "electrical.batteries.1.temperature, environment.outside.temperature, environment.inside.engineRoom.temperature, " + 
        "environment.inside.refrigerator.temperature, propulsion.exhaust.temperature, environment.inside.freezer.temperature, " +
        "environment.inside.heating.temperature, environment.inside.mainCabin.temperature, propulsion.*.coolantTemperature, " +
        "propulsion.*.exhaustTemperature.   For more see the signalK schema",
        type: "object",
        properties: sensorConfig
      }
    }
  }



  plugin.uiSchema = {
    "ui:order": [
    'temperaturePeriod',
    'sensors'
    ]
  };


  return plugin;
}
