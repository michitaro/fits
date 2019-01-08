var nodeExternals = require('webpack-node-externals')

module.exports = {
    entry: [
        'es6-promise/auto',
        '../src/index.ts',
    ],
    output: {
        path: `${__dirname}/dist`,
        filename: 'index.js',
        libraryTarget: 'commonjs',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/, loader: 'ts-loader', options: {
                    compilerOptions: {
                        "declaration": true,
                        "declarationDir": `${__dirname}/types`
                    },
                },
            },
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
    node: {
        fs: 'empty'
    },
    externals: [
        nodeExternals(),
    ],
}