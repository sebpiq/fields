#!/usr/bin/env node
var path = require('path')
  , version = require('./package.json').version
  , debug = require('debug')('fields.main')
  , program = require('commander')
  , async = require('async')
  , express = require('express')
  , clc = require('cli-color')
  , rhizome = require('./rhizome')

var staticDir = path.join(__dirname, 'dist')
  , httpServer, wsServer

// Code that will run if the module is main
if (require.main === module) {
  program
    .version(version)
    .parse(process.argv)
  if (process.argv.length !== 3) {
    console.log('usage : main.js <config.js>')
    process.exit(1)
  }

  var config = require(path.join(process.cwd(), process.argv[2]))

  // Connection manager
  rhizome.connections.manager = new rhizome.connections.ConnectionManager({
    store: config.server.tmpDir
  })

  // HTTP server
  var app = express()
  httpServer = require('http').createServer(app)
  app.set('port', config.server.port)
  app.use(express.logger('dev'))
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
  app.use('/', express.static(staticDir))

  // Websocket server
  wsServer = new rhizome.websockets.Server({ serverInstance: httpServer })

  // Start servers
  async.parallel([
    rhizome.connections.manager.start.bind(rhizome.connections.manager),
    httpServer.listen.bind(httpServer, app.get('port')),
    wsServer.start.bind(wsServer)
  ], function(err) {
    if (err) throw err
    console.log(clc.bold('Fields ' + version +' running on port ' + config.server.port) )
  })

}