import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import WorkboxPlugin from 'workbox-webpack-plugin';

const isProduction = process.env['NODE_ENV'] === 'production';

const plugins = [
    new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'PRODUCTION': JSON.stringify(isProduction),
        'PUSH_BASE_URL': JSON.stringify('http://localhost:8000'),
    }),
    new HtmlWebpackPlugin({
        title: 'PWA Exercies',
        chunks: ['main'],
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
                test: /\.scss$/,
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
