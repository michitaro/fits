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
            { test: /\.ts$/, loader: 'ts-loader' },
            {
                test: /\.clist$/,
                use: [
                    {
                        loader: 'emcc-loader',
                        options: {
                            buildDir: `${__dirname}/wabuild`,
                            commonFlags: ['-O3'],
                            cxxFlags: ['-std=c++14'],
                            ldFlags: [
                                '-s', `EXPORTED_FUNCTIONS=['_malloc', '_free']`,
                                '-s', `TOTAL_MEMORY=${256 * (1 << 20)}`
                            ]
                        }
                    }
                ]
            }
        ],
    },
    devtool: 'eval',
    plugins: [new HtmlWebpackPlugin()],
    node: {
        fs: 'empty'
    },
}