const HtmlWebpackPlugin = require('html-webpack-plugin');

const CONFIG = {
  mode: 'development',

  entry: {
    app: './app.js'
  },

  module: {
    rules: [
      // {
      //   // Transpile ES6 to ES5 with babel - Add to support old browsers
      //   test: /\.js$/,
      //   loader: 'babel-loader',
      //   exclude: [/node_modules/],
      //   options: {
      //     presets: ['@babel/preset-env']
      //   }
      // }
    ]
  },

  plugins: [new HtmlWebpackPlugin({title: 'File Selection'})],

  node: {
    fs: 'empty'
  }
};

// This line enables bundling against src in this repo rather than installed module
module.exports = env => (env ? require('../../webpack.config.local')(CONFIG)(env) : CONFIG);
