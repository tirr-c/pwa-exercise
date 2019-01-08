import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import WorkboxPlugin from 'workbox-webpack-plugin';

const isProduction = process.env['NODE_ENV'] === 'production';

const plugins = [
    new HtmlWebpackPlugin({
        title: 'PWA Exercies',
    }),
];

if (isProduction) {
    plugins.push(
        new MiniCssExtractPlugin(),
    );
}

plugins.push(
    new WorkboxPlugin.GenerateSW({
        clientsClaim: true,
        skipWaiting: true,
        importScripts: ['sw-push.bundle.js'],
    }),
);

let devServer = undefined;
if (!isProduction) {
    devServer = {
        contentBase: path.resolve(__dirname, 'dist'),
        compress: true,
        port: 3000,
    };
}

const config = {
    mode: isProduction ? 'production' : 'development',
    entry: {
        main: './src/index.tsx',
        'sw-push': './src/sw-push.ts',
    },
    output: {
        filename: '[name].bundle.js',
        chunkFilename: '[id].js',
        path: path.resolve(__dirname, 'dist'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.sass$/,
                use: [
                    isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
                    'css-loader',
                    'postcss-loader',
                    'sass-loader',
                ],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    plugins,
    devServer,
    devtool: 'inline-source-map',
};

export default config;
