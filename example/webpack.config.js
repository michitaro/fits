const HtmlWebpackPlugin = require('html-webpack-plugin')


module.exports = {
    entry: [
        'es6-promise/auto',
        './src/main.ts',
    ],
    output: {
        path: `${__dirname}/dist`,
        filename: 'bundle.js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: 'ts-loader' }
        ],
    },
    devtool: 'eval',
    plugins: [new HtmlWebpackPlugin()],
}