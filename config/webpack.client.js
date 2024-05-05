const path = require('path')

module.exports = {
  target: 'web',
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: path.join(__dirname, '../src/client.js'),
  output: {
    filename: 'bundle_client.js',
    path: path.join(__dirname, '../dist/public')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      }
    ]
  },

}