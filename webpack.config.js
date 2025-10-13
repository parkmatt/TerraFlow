const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { VueLoaderPlugin } = require("vue-loader");
const isDevelopment = process.env.NODE_ENV !== 'production';
const fs = require("fs");
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'scripts/terraflow.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue'],
    alias: {
      '@': path.resolve(__dirname, 'src/'),
      'vue$': 'vue/dist/vue.esm.js' // Use the full build
    },
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
          },
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'styles/terraflow.css',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'package.json', to: '' }, { from: 'LICENSE', to: '' }, { from: 'README.md', to: '' }, { from: 'src/styles/fluent.min.css', to: 'styles'}, { from: 'src/terraflowloader.js', to: 'scripts'},{ from: 'manifest.json', to: '' }, { from: 'src/images', to: 'images' }, 
      ],
    }),
    new VueLoaderPlugin()
  ],
  optimization: {
    minimizer: [
      new CssMinimizerPlugin(),
    ],
    usedExports: true,
  },
  performance: {
    hints: false,
  },
  devtool: isDevelopment ? 'inline-source-map' : false,
  ...(isDevelopment && {
    devServer: {
      static: {
        directory: path.join(__dirname, "dist"),
      },
      allowedHosts: "all",
      host: "localhost",
      compress: true,
      port: 443,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
  }),
};