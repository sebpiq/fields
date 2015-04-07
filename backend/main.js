#!/usr/bin/env node
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

  // Websocket server
  wsServer = new rhizome.websockets.Server({ serverInstance: httpServer })

  // Osc server
  oscServer = new rhizome.osc.Server({ port: config.osc.port })

  // Async operations
  async.parallel([

    // Save the config file to a location served by the static server
    fs.writeFile.bind(fs, instrumentConfigFile, 'fields.config = ' + config.instruments.toString()),

    // Start servers
    rhizome.connections.manager.start.bind(rhizome.connections.manager),
    httpServer.listen.bind(httpServer, app.get('port')),
    wsServer.start.bind(wsServer),
    oscServer.start.bind(oscServer)

  ], function(err) {
    if (err) throw err
    console.log(clc.bold('Fields ' + version +' running') )
    console.log(clc.blue('- HTTP server on port ') + clc.bold.blue(config.server.port) )
    if (config.osc) {
      console.log(clc.blue('- OSC on port ') + clc.bold.blue(config.osc.port) )
    }
  })

}