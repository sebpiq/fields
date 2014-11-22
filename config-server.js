var path = require('path')

module.exports = {
  webPort: 8000,
  usersLimit: 40,

  pages: [
    { rootUrl: '/', dirName: path.join(__dirname, 'dist') }
  ]
}
