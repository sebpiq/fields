/*
 *  Fields
 *  Copyright (C) 2016 Sébastien Piquemal <sebpiq@gmail.com>, Tim Shaw <tim@triptikmusic.co.uk>
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
 
exports.pickVal = function(mean, variance) {
  return mean + mean * variance * (1 - 2 * Math.random())
}

exports.floor = function(val, dec) {
  return Math.floor(val * Math.pow(10, dec)) / Math.pow(10, dec) 
}

exports.valExp = function(val, exp) {
  exp = exp || 2
  return (Math.exp(val * exp) - Math.exp(0)) / (Math.exp(exp) - Math.exp(0))
}
