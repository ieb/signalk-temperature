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

  /**
   * Calculates the stats using an IIR filter with weight filterWeight.
   */
  function StatsIIR(filterWeight, name) {
    this.name = name;
    this.filterWeight = filterWeight;
    this.average = 0;
  }
  StatsIIR.prototype.set = function(v) {
    this.average = this.average + (this.average-v) >> filterWeight;
    var diff = this.average-v;
    this.stdev = this.stdev + (this.stdev-(diff*diff)) >> filterWeight;
  };
  StatsIIR.prototype.mean = function() {
    return this.average;
  };
  // this might not be valid, but is here for completeness
  StatsIIR.prototype.stdev = function() {
    return this.stdev;
  };

  // calculates stats using a moving average over n samples.
  function Stats(n, name) {
    this.acc = new Array(n);
    this.acc.fill(0,0,n);
    this.h = 0;
    this.n = 0;
    this.c = 0;
    this.name = name;
  }
  Stats.prototype.set = function(v) {
    this.acc[this.h] = v;
    this.c = v;
    this.n = Math.min(this.n+1,this.acc.length);
    this.h = (this.h+1)%this.acc.length;
  }
  Stats.prototype.mean = function() {
    if ( this.n == 0) {
      return 0;
    }
    var v = 0;
    for (var i = 0; i < this.n; i++) {
      v = v + this.acc[i];
    }
    return v/this.n;
  }
  Stats.prototype.stdev = function(mean) {
    if ( this.n == 0) {
      return 0;
    }
    var m = mean || this.mean();
    var v = 0;
    for (var i = 0; i < this.n; i++) {
      var d = mean - this.acc[i];
      v = v + d*d;
    }
    return v/this.n;
  };


  function AngleStats(n, name) {
    this.name = name;
    this.c   = 0;
    this.cos = new Stats(n, name + ".cos");
    this.sin = new Stats(n, name + ".sin");
  }
  AngleStats.prototype.set = function(v) {
    this.c = v;
    this.cos.set(Math.cos(v));
    this.sin.set(Math.sin(v));
  };
  AngleStats.prototype.setSC = function(s,c) {
    this.cos.set(s);
    this.sin.set(c);
    this.c = Math.atan2(s, c) ;
  };

  AngleStats.prototype.mean = function() {
    if (this.cos.n === 0) {
      return 0;
    }
    return Math.atan2(this.sin.mean(), this.cos.mean());
  }
  AngleStats.prototype.stdev = function(first_argument) {
    var cosmean = this.cos.mean();
    var sinmean = this.sin.mean();
    var cosstdev = this.cos.stdev(cosmean);
    var sinstdev = this.sin.stdev(sinmean);
    return Math.sqrt(cosstdev*cosstdev+sinstdev*sinstdev);
  };


  return {
    Stats : Stats,
    AngleStats: AngleStats
  };
}());

