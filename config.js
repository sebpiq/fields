var path = require('path')

module.exports = {
  
  usersLimit: 30,

  pages: [
    { rootUrl: '/', dirName: path.join(__dirname, 'pages') }
  ],

  clients: [
    { ip: '192.168.0.100', appPort: 9001 }
  ]
}