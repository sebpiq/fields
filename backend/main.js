#!/usr/bin/env node
/*
 *  Fields
 *  Copyright (C) 2015 Sébastien Piquemal <sebpiq@gmail.com>, Tim Shaw <tim@triptikmusic.co.uk>
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

var path = require('path')
  , fs = require('fs')
  , version = require('../package.json').version
  , debug = require('debug')('fields.main')
  , program = require('commander')
  , async = require('async')
  , express = require('express')
  , mustacheExpress = require('mustache-express')
  , clc = require('cli-color')
  , rhizome = require('rhizome-server')

var staticDir = path.resolve(__dirname, '..', 'dist')
  , instrumentConfigFile = path.join(staticDir, 'js', 'config.js')
  , httpServer, wsServer, oscServer, manager

// Code that will run if the module is main
if (require.main === module) {
  var programName = path.basename(process.argv[1])

  program
    .version(version)
    .parse(process.argv)
  if (process.argv.length !== 3) {
    console.log('usage : ' + programName + ' <config.js>')
    process.exit(1)
  }

  var config = require(path.join(process.cwd(), process.argv[2]))

  var HTTPServer = function() {
    var app = express()
    this._httpServer = require('http').createServer(app)
    this._port = config.server.port
    app.set('port', this._port)
    app.use(express.logger('dev'))
    app.use(express.bodyParser())
    app.use(express.methodOverride())
    app.use(app.router)
    app.engine('mustache', mustacheExpress())
    app.set('view engine', 'mustache')
    app.set('views', path.join(staticDir, 'templates'))
    app.use('/', express.static(staticDir))
    app.get('/s.html', function (req, res) {
      var context = { extraInstruments: config.extraInstruments || [] }
      res.render('s', context)
    })
    if (config.server.assetsDir)
      app.use('/assets', express.static(config.server.assetsDir))
  }

  HTTPServer.prototype.start = function(done) {
    this._httpServer.listen(this._port, done)
  }

  HTTPServer.prototype.validateConfig = function(done) { done() }

  // Rhizome servers and connection manager
  manager = new rhizome.connections.ConnectionManager({
    store: config.server.tmpDir
  })
  httpServer = new HTTPServer()
  wsServer = new rhizome.websockets.Server({ serverInstance: httpServer._httpServer })
  oscServer = new rhizome.osc.Server({ port: config.osc.port })

  // Async operations
  async.parallel([

    // Save the config file to a location served by the static server
    fs.writeFile.bind(fs, instrumentConfigFile, 'fields.config = ' + config.instruments.toString()),

    // Start servers
    rhizome.starter.bind(rhizome.starter, manager, [wsServer, oscServer, httpServer]),

  ], function(err) {
    if (err) throw err
    console.log(clc.bold('Fields ' + version +' running') )
    console.log(clc.black('GPL license. Copyright (C) 2015 Sébastien Piquemal, Tim Shaw'))
    console.log(clc.blue('- HTTP server on port ') + clc.bold.blue(config.server.port) )
    if (config.osc) {
      console.log(clc.blue('- OSC on port ') + clc.bold.blue(config.osc.port) )
    }
  })

}