var path = require('path')

module.exports = {
  webPort: 80,
  usersLimit: 40,

  pages: [
    { rootUrl: '/', dirName: path.join(__dirname, 'pages') }
  ],

  clients: [
    { ip: '192.168.0.100', appPort: 9001 }
  ]
}