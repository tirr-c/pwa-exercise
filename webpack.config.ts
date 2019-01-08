import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

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
    entry: './src/index.tsx',
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
