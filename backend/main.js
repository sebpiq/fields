#!/usr/bin/env node
var path = require('path')
  , fs = require('fs')
  , _ = require('underscore')
  , version = require('../package.json').version
  , debug = require('debug')('fields.main')
  , program = require('commander')
  , async = require('async')
  , express = require('express')
  , clc = require('cli-color')
  , rhizome = require('rhizome-server')
  , stats = require('simple-statistics')

var staticDir = path.resolve(__dirname, '..', 'dist')
  , instrumentConfigFile = path.join(staticDir, 'js', 'config.js')
  , httpServer, wsServer, rhizomeManager

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
  rhizomeManager = rhizome.connections.manager = new rhizome.connections.ConnectionManager({
    store: config.server.tmpDir
  })

  // HTTP server
  var app = express()
  httpServer = require('http').createServer(app)
  app.set('port', config.server.port)
  //app.use(express.logger('dev'))
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(app.router)
  app.use('/', express.static(staticDir))
  if (config.server.assetsDir)
    app.use('/assets', express.static(config.server.assetsDir))

  // Websocket server
  wsServer = new rhizome.websockets.Server({ serverInstance: httpServer })

  // Fake connection that we use to compute the time offset of each client,
  // to try to synchronize them together. 
  var synchronizer = {
    namespace: 'synchronizer',
    id: 'unique',
    serialize: function() { return { subscriptions: [], infos: {} } },
    deserialize: function() {},

    send: function(address, args) {
      var id = args[0]
        , clientTime = parseInt(args[1], 10)
        , receivedTime = Date.now()
        , results = this.results[id]
        , latencyTime = (receivedTime - results.sentTime) / 2
      results.times.push((clientTime - latencyTime) - results.sentTime)
      console.log(id, (clientTime - latencyTime) - results.sentTime)
      if (results.times.length < 20) {
        setTimeout(function() {
          synchronizer.roundTrip(results.connection)
        }, 1000)
      } else this.handleResult(id)
    },

    roundTrip: function(connection) {
      if (!this.results[connection.id]) {
        this.results[connection.id] = {
          connection: connection,
          times: [],
          onClose: function() {
            delete synchronizer.results[connection.id]
          }
        }
        connection.once('close', this.results[connection.id].onClose)
      }
      var results = this.results[connection.id]
      results.sentTime = Date.now()
      connection.send('/fields/roundTrip')
    },

    handleResult: function(id) {
      var results = this.results[id]
        , connection = results.connection
        , IQR = stats.iqr(results.times)
        , median = stats.median(results.times)
        , mean = stats.mean(results.times)
        , filtered = results.times.filter(function(datum) {
          return datum > median - 2 * IQR && datum < mean + 2 * IQR
        })

      connection.removeListener('close', results.onClose)
      delete this.results[id]
      connection.infos.timeOffset = stats.mean(filtered)
      connection.send('/fields/init', [connection.infos.timeOffset])
      /*rhizomeManager.connectionUpdate(connection, function(err) {
        if (err) throw err
        debug('connection ' + connection.toString() + ' time offset saved : '
          + connection.infos.timeOffset, results.times.length, filtered.length)
      })*/
    },

    results: {}
  }

  // On each WS connection, we see if we need to do synchro or not 
  wsServer.on('connection', function(connection) {
    
    // Maintains a list of all connections, and an dynamic index for each
    // connection. Everytime a connection is closed, we resend the index and
    // the total size of the sequence.
    if (_.all(wsConnections, function(other) { return other.id !== connection.id })) {
      wsConnections.push(connection)
      debug('WS opened, sequence ' + _.pluck(wsConnections, 'id'))
      sendSequenceInfos()

      connection.on('close', function() {
        var ind = wsConnections.indexOf(connection)
        if (ind !== -1) {
          wsConnections.splice(ind, 1)
          sendSequenceInfos()
        }
        debug('WS closed, sequence ' + _.pluck(wsConnections, 'id'))
      })
    }

    // When a new connection arrives, we check if it has a `timeOffset`. If it doesn't,
    // we need to calculate it.
    if (!connection.infos.timeOffset) {
      setTimeout(function() { synchronizer.roundTrip(connection) }, 1000)
    } else {
      debug('connection ' + connection.toString() + ' time offset restored : '
          + connection.infos.timeOffset)
      connection.send('/fields/init', [connection.infos.timeOffset])
    }
  })

  var wsConnections = []

  var sendSequenceInfos = function() { 
    wsConnections.forEach(function(other, i) {
      other.send('/fields/sequence', [i, wsConnections.length])
    })
  }

  // Osc server
  oscServer = new rhizome.osc.Server({ port: config.osc.port })

  // Async operations
  async.parallel([

    // Save the config file to a location served by the static server
    fs.writeFile.bind(fs, instrumentConfigFile, 'fields.config = ' + config.instruments.toString()),

    // Start connections
    function(next) {
      async.series([
        rhizomeManager.start.bind(rhizomeManager),
        rhizomeManager.open.bind(rhizomeManager, synchronizer)
      ], function(err) {
        if (err) return next(err)
        rhizomeManager.subscribe(synchronizer, '/fields/roundTrip')
        next()
      })
    },

    // Start servers
    httpServer.listen.bind(httpServer, app.get('port')),
    wsServer.start.bind(wsServer),
    oscServer.start.bind(oscServer),

  ], function(err) {
    if (err) throw err
    console.log(clc.bold('Fields ' + version +' running') )
    console.log(clc.blue('- HTTP server on port ') + clc.bold.blue(config.server.port) )
    if (config.osc) {
      console.log(clc.blue('- OSC on port ') + clc.bold.blue(config.osc.port) )
    }
  })

}