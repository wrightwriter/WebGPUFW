const path = require("path")
const webpack = require("webpack")
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CompressionPlugin = require("compression-webpack-plugin");
const WebpackObfuscator = require('webpack-obfuscator');
const BundleAnalyzerPlugin  = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const {ImportMapsWebpackPlugin} = require('import-maps-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');


// From 0b5vr
/**
 * @type TerserPlugin.TerserPluginOptions[ 'terserOptions' ]
 */
 const terserOptions = {
  compress: {
    arguments: true,
    booleans_as_integers: true,
    drop_console: true,
    keep_fargs: false,
    passes: 2,
    unsafe_arrows: true,
    unsafe_math: true,
    unsafe_symbols: true,
  },
  mangle: {
    properties: {
      regex: /.+/,
      keep_quoted: true,
      reserved: [
        // material tags
        'forward',
        'deferred',
        'depth',
      ]
    },
  },
  format: {
    ascii_only: true,
    ecma: 2020,
  },
  module: true,
  toplevel: true,
};



module.exports = (env, argv) => {
  const DEV = argv.mode === 'development';

  const obj =  {
    mode: argv.mode,
    devServer: {
      hot: true,
    },
    entry: ["./src/index.ts"],
    // entry: path.resolve("./src/index.ts"),
    output: {
      path: path.resolve(__dirname, "../dist"),
      filename: "bundle.js",
    },
    // devtool: DEV ? "inline-source-map" : "eval",
    devtool: DEV ? "inline-source-map" : "eval",
    resolve: {
      extensions: [".js", ".ts"],
      modules: [path.resolve("./src"), path.resolve("./node_modules")],
    },
    ignoreWarnings: [/Failed to parse source map/],
    module: {
      rules: [
        // { 
        //   test: /\.(ts|js)x?$/, 
        //   use: {
        //     loader: "babel-loader", 
        //     options: {
        //       plugins: ['@babel/plugin-syntax-top-level-await']
        //     }, 
        //   },
        //   exclude: /node_modules/ },
        // {
        //   test: /\.(glsl|vs|fs|vert|frag)$/,
        //   exclude: /node_modules/,
        //   type: 'asset/source',
        //   use: [
        //     {loader: "glslify-loader"},
        //   ]
        // },
        { test: /\.css$/i, use: ["style-loader", "css-loader"] },
        { test: /\.(png|jpe?g|gif)$/i, use: ["file-loader"] },
        { test: /\.(wgsl)$/i, use: ["raw-loader"] },
        // { test: /\.(wgsl)$/i, use: ["asset/source"] },
        // {
        //   test: /\.(woff|woff2|eot|ttf|otf)$/,
        //   loader: "file-loader",
        // },
        { 
          test: /\.(ts|js)x?$/, 
          use: ["ts-loader"],
          exclude: [
            // "../src/old",
            /node_modules/
            // path.resolve(__dirname, "../src/old"),
            // path.resolve(__dirname, "../node_modules"),
          ]
          // exclude: [/node_modules/, /src/]
        },
      ],
  
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          DEV
        }
      }),
      new HtmlWebpackPlugin({
        favicon: false,
        template: "./public/index.html",
        inject: "body",
        publicPath: "./",
        // minify: false,
        minify: true,
      }),
    ],
    optimization: {
      minimize: !DEV,
      minimizer: [new TerserPlugin({terserOptions})],
      // minimizer: [new TerserPlugin({})],
      moduleIds: DEV ? 'named' : undefined,
      usedExports: !DEV
    },
  }

  if(!DEV)
    obj.plugins.push(new BundleAnalyzerPlugin())

  return obj

}
