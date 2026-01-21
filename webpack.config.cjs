// This file defines the build configuration for webpack

// The require statement is used to import the path module and the HtmlWebpackPlugin plugin
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// The module.exports statement is used to export the configuration object so that webpack can use it
module.exports = {
    // A list of entry points to build with their output file names
    // A entry point is a file that webpack will start from to build the dependency graph
    entry: {
        'main.js': './src/main.js',
    },
    // The output configuration options tell webpack how to write the compiled files to disk
    output: {
        // The path to the directory where the output files will be placed
        path: path.resolve(__dirname, 'dist'),
        // The name of the output files ('[name]' is a placeholder for the entry point name)
        filename: '[name]',
    },
    // The plugins configuration option is used to customize the webpack build process in a variety of ways
    plugins: [
        // The HtmlWebpackPlugin generates an HTML file in the output directory
        new HtmlWebpackPlugin({
            // The name of the generated HTML file
            filename: 'index.html',
            // The path to the template file to use as the base of the generated HTML file
            template: 'src/index.html',
            // The chunks option tells the plugin which entry points to include in the generated HTML file
            chunks: ['main.js']
        })
    ],
    module: {
        rules: [
          {
            test: /\.css$/i,
            use: ["style-loader", "css-loader"],
          },
        ],
      },
    // The mode configuration option is used to set the mode for the build process
    mode: 'development',
};