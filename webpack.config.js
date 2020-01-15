var webpack = require('webpack');
var path = require('path');
var MiniCssExtractPlugin = require('mini-css-extract-plugin');

var HtmlWebpackPlugin = require('html-webpack-plugin');
var HtmlWebpackIncludeAssetsPlugin = require('html-webpack-include-assets-plugin');

const { CleanWebpackPlugin } = require('clean-webpack-plugin');

var CopyWebpackPlugin = require('copy-webpack-plugin');

var environment = process.env.NODE_ENV || 'development';




// the clean options to use
let cleanOptions = {
  verbose:  true,
  dry:      false,
  cleanOnceBeforeBuildPatterns: ['/public/*' ],
}


var extractPlugin = new MiniCssExtractPlugin({
     // Options similar to the same options in webpackOptions.output
     // both options are optional
     filename: 'app/assets/main.css'
   });



var webpackPlugins = [
  new CleanWebpackPlugin( cleanOptions),
    extractPlugin,
    new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"'
        }
      }),

      new CopyWebpackPlugin([
            {from:'app/assets/images',to:'app/assets/images'  }
        ])
]



const routesData = {
  routes: [
    {url: '/', title: 'SendERC - Token Payment System', template: 'app/index.html', filename: 'index.html'},
    {url: '/', title: 'SendERC - Invoice', template: 'app/invoice.html', filename: 'invoice.html'}

  //  {url: '/wallet', title: 'Wallet', template: 'app/wallet.html', filename: 'wallet/index.html'},
  ]
}


routesData.routes.forEach(function(element){

  var htmlPlugin = new HtmlWebpackPlugin({
        title: element.title,
        filename: element.filename,
        template: element.template
  });

 webpackPlugins.push(htmlPlugin)

})



module.exports = {
    entry: ['./app/assets/javascripts/index', './app/assets/stylesheets/application.scss' ],
    output: {
        path: path.resolve(__dirname, 'public'),
      //  filename: 'bundle.js',
        filename: '[name].[hash].js',
        publicPath: '/'
    },
    module: {
        rules: [
          {
             test: /\.m?js$/,
             exclude: /(node_modules|bower_components)/,
             use: {
               loader: 'babel-loader',
               options: {
                 presets: ['@babel/preset-env']
               }
             }
           },
            {
                test: /\.scss$/,
                use: [
               {
                 loader: MiniCssExtractPlugin.loader,
                 options: {

                 },
               },
               'css-loader','sass-loader'
             ],
            },
            {
              test: /\.(png|jpg|gif)$/,
              use: [
                {
                  loader: 'file-loader',
                  options: {
                    name: '[path][name].[ext]',
                     publicPath: '/',
                  }
                }
              ]
            },

            {
              test: /\.(eot|woff|woff2|ttf|svg)(\?[\s\S]+)?$/,
              use: [
                {
                  loader: 'file-loader',
                  options: {
                    name: '[path][name].[ext]',
                     publicPath: '/',
                  }
                }
              ]
            },
        ]
    },
    resolve: {
      alias: {
        'vue$': 'vue/dist/vue.esm.js' // 'vue/dist/vue.common.js' for webpack 1
      }
    },
    plugins: webpackPlugins
};
