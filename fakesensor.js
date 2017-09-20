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


(module.exports = function() {

   var sensors = [
      { id: '26-deadbeefdeadbeefdeadbeef', path: 'electrical.batteries.1.temperature', value: new RandomScalar(-5,100) },
      { id: '28-deadbeefdeadbeefdeadbeef', path: 'environment.outside.temperature', value: new RandomScalar(-5,100) },
      { id: '29-deadbeefdeadbeefdeadbeef', path: 'environment.inside.engineRoom.temperature', value: new RandomScalar(-5,100) },
      { id: '30-deadbeefdeadbeefdeadbeef', path: 'environment.inside.refrigerator.temperature', value: new RandomScalar(-5,100) },
      { id: '31-deadbeefdeadbeefdeadbeef', path: 'propulsion.exhaust.temperature', value: new RandomScalar(-5,100) }
   ]

  function readAllC(cb) {
    var result = [];
    for ( var i = 0; i < sensors.length; i++) {
      var s = sensors[i];
      s.value.next();
      result.push({ id: s.id, t: +s.value.c.toFixed(3)});
    }
    if ( typeof cb === 'function' ) {
      cb(false, result);
    } else {
      return result;
    }
  }

  function list(cb) {
    var ids = [];
    for ( var i = 0; i < sensors.length; i++) {
      ids.push(sensors[i].id);
    }
    if ( cb === null ) {
      return ids;
    } else {
      cb(false, ids);
    }
  }

  function RandomScalar(min, max) {
    this.v = 0;
    this.c = 0;
    this.r = max - min;
    this.mean = (max+min)/2;
    this.min = min;
    this.max = max;
  }
  RandomScalar.prototype.next = function() {
    this.v = this.v - ((Math.random()-0.5-(this.v/(5*this.r))) * (this.v-this.r)/10);
    this.c = this.mean + this.v;
    if ( this.c > this.max ) {
      this.c = this.max;
    } else if ( this.c < this.min ) {
      this.c = this.min;
    } 
  };


  return {
    readAllC : readAllC,
    list: list,
    fakeSensors: sensors
  };
}());

