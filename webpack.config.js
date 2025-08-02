const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');

module.exports = {
  ...defaultConfig,
  entry: {
    index: path.resolve(process.cwd(), 'assets/src', 'index.tsx'),
  },
  output: {
    ...defaultConfig.output,
    path: path.resolve(process.cwd(), 'assets/dist'),
  },
  resolve: {
    ...defaultConfig.resolve,
    alias: {
      '@': path.resolve(__dirname, 'assets/src'),
    },
  },
  optimization: {
    ...defaultConfig.optimization,
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        wordpress: {
          test: /[\\/]node_modules[\\/]@wordpress[\\/]/,
          name: 'wordpress',
          chunks: 'all',
          priority: 20,
        },
      },
    },
  },
};