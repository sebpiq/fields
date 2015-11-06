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
  , mkdirp = require('mkdirp')
  , program = require('commander')
  , async = require('async')
  , express = require('express')
  , clc = require('cli-color')
  , rhizome = require('rhizome-server')

program
  .version(version)
  .parse(process.argv)

if (process.argv.length !== 3) {
  console.log('usage : ' + path.basename(process.argv[1]) + ' <config.js>')
  process.exit(1)
}

var config = require(path.join(process.cwd(), process.argv[2]))
  , packageRoot = path.resolve(__dirname, '..')
  , tmpDir = config.server.tmpDir || path.join(packageRoot, 'tmp')
  , buildDir = path.join(tmpDir, 'build')
  , instrumentConfigFile = path.join(buildDir, 'config.js')
  , staticDir = path.join(packageRoot, 'dist')
  , baseAssetsDir = path.join(staticDir, 'baseAssets')
  , pagesDir = config.server.pagesDir || path.join(staticDir, 'pages')
  , httpServer, wsServer, oscServer, manager
  , asyncOps = []


// !!! We need an HTTPServer in the style of rhizome servers in order for rhizome
// to work. See rhizome issue : https://github.com/sebpiq/rhizome/issues/102
var HTTPServer = function() {
  var app = express()
  this._httpServer = require('http').createServer(app)
  this._port = config.server.port
  app.set('port', this._port)
  app.use(express.logger('dev'))
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
  app.use('/baseAssets', express.static(baseAssetsDir))
  app.use('/builtAssets', express.static(buildDir))
  // User assets
  if (config.server.assetsDir)
    app.use('/assets', express.static(config.server.assetsDir))
  app.use('/', express.static(pagesDir))
}

HTTPServer.prototype.start = function(done) {
  this._httpServer.listen(this._port, done)
}

HTTPServer.prototype.validateConfig = function(done) { done() }

// Rhizome servers and connection manager
manager = new rhizome.connections.ConnectionManager({ store: config.server.tmpDir })
httpServer = new HTTPServer()
wsServer = new rhizome.websockets.Server({ serverInstance: httpServer._httpServer })
oscServer = new rhizome.osc.Server({ port: config.osc.port })

// Create tmp and build folders
asyncOps.push(mkdirp.bind(mkdirp, buildDir))

// If `config.instruments` are provided, write it to a config file
if (config.instruments) {
  asyncOps.push(
    fs.writeFile.bind(fs, instrumentConfigFile, 'fields.config = ' + config.instruments.toString())
  )
}

// Start servers
asyncOps.push(rhizome.starter.bind(rhizome.starter, manager, [oscServer, httpServer, wsServer]))

// Async operations
async.series(asyncOps, function(err) {
  if (err) throw err
  console.log(clc.bold('Fields ' + version +' running') )
  console.log(clc.black('GPL license. Copyright (C) 2015 Sébastien Piquemal, Tim Shaw'))
  console.log(clc.blue('- HTTP server on port ') + clc.bold.blue(config.server.port) )
  if (config.osc) {
    console.log(clc.blue('- OSC on port ') + clc.bold.blue(config.osc.port) )
  }
})