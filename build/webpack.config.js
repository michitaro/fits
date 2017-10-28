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
                    }
                }
            }
        ],
    },
    externals: [
        // include only relative assets
        function (context, request, callback) {
            if (!request.match(/(?:^|!)(?:\.|\.\.)?\//))
                return callback(null, `commonjs ${request}`)
            callback()
        }
    ],
}