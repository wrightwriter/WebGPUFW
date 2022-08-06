const CopyPlugin = require("copy-webpack-plugin")
const config = require("./webpack.config")
const ZipperPlugin = require("./ZipperPlugin")
const path = require("path")
const {resolve} = require('path');
const WebpackObfuscator = require('webpack-obfuscator');


module.exports = {
  ...config,
  mode: "production",

  devtool: undefined,
  // add the zipper plugin to the list of plugins
  // rules: [
  //   {
  //     test: /\.js$/,
  //     exclude: [ 
  //         path.resolve(__dirname, 'excluded_file_name.js') 
  //     ],
  //     enforce: 'post',
  //     use: { 
  //         loader: WebpackObfuscator.loader, 
  //         options: {
  //             rotateStringArray: true
  //         }
  //     }
  //   }
  // ],
  // module: {
  //   rules: [
  //     ...config.module.rules,
  //     {
  //         test: /\.js$/,
  //         exclude: [ 
  //             path.resolve(__dirname, 'three.js'),
  //             /node_modules/ 
  //         ],
  //         enforce: 'post',
  //         use: { 
  //             loader: WebpackObfuscator.loader, 
  //             options: {
  //                 rotateStringArray: true
  //             }
  //         }
  //     }, {
  //       test: /\.css$/i,
  //       use: ["style-loader", "css-loader"],
  //     },
  //   ],
  // },
  plugins: [
    ...config.plugins,
    // new WebpackObfuscator ({
    //   rotateStringArray: true
    // },["asdgadg"]),
    new CopyPlugin({
      patterns: [
        {
          from: "public",
          // prevents the index.html from being copied to the the public folder, as it's going to be
          // generated by webpack
          filter: async (filePath) => {
            return path.basename(filePath) !== "index.html"
          }
        }
      ]
    }),
    // new ZipperPlugin(),
  ]
}