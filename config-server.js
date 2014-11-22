var path = require('path')

module.exports = {
  webPort: 80,
  usersLimit: 40,

  pages: [
    { rootUrl: '/', dirName: path.join(__dirname, 'pages') }
  ]
}