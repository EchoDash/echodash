/**
 * EchoDash Webpack Configuration
 * 
 * Enhanced webpack configuration for performance optimization and code splitting
 * Built on top of @wordpress/scripts with Phase 5 performance features.
 */

const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require('compression-webpack-plugin');

// Plugin configuration
const plugins = [
	...defaultConfig.plugins,
];

// Production-only optimizations
if (process.env.NODE_ENV === 'production') {
	plugins.push(
		// Gzip compression for better loading times
		new CompressionPlugin({
			algorithm: 'gzip',
			test: /\.(js|css|html|svg)$/,
			threshold: 8192,
			minRatio: 0.8,
		})
	);
}

// Bundle analyzer for development and CI
if (process.env.ANALYZE_BUNDLE) {
	plugins.push(
		new BundleAnalyzerPlugin({
			analyzerMode: 'static',
			openAnalyzer: false,
			reportFilename: path.resolve(__dirname, 'bundle-report.html'),
		})
	);
}

module.exports = {
	...defaultConfig,
	
	// Entry points
	entry: {
		index: path.resolve(process.cwd(), 'assets/src', 'index.tsx'),
	},
	
	// Output configuration for better caching
	output: {
		...defaultConfig.output,
		path: path.resolve(process.cwd(), 'assets/dist'),
		filename: process.env.NODE_ENV === 'production' 
			? '[name].[contenthash:8].js' 
			: '[name].js',
		chunkFilename: process.env.NODE_ENV === 'production'
			? '[name].[contenthash:8].js'
			: '[name].js',
		// Enable cross-origin loading for better performance
		crossOriginLoading: 'anonymous',
		// Clean dist folder on build
		clean: true,
	},
	
	// Enhanced module resolution
	resolve: {
		...defaultConfig.resolve,
		alias: {
			'@': path.resolve(__dirname, 'assets/src'),
		},
		// Reduce resolve overhead
		modules: ['node_modules'],
		extensions: ['.js', '.jsx', '.ts', '.tsx'],
	},
	
	// Advanced code splitting and optimization
	optimization: {
		...defaultConfig.optimization,
		splitChunks: {
			chunks: 'all',
			minSize: 20000,
			maxSize: 250000,
			minChunks: 1,
			maxAsyncRequests: 30,
			maxInitialRequests: 30,
			cacheGroups: {
				// WordPress dependencies chunk (highest priority)
				wordpress: {
					test: /[\\/]node_modules[\\/]@wordpress[\\/]/,
					name: 'wordpress',
					chunks: 'all',
					priority: 30,
					reuseExistingChunk: true,
					enforce: true,
				},
				// React and related libraries
				react: {
					test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
					name: 'react',
					chunks: 'all',
					priority: 25,
					reuseExistingChunk: true,
				},
				// Third-party vendor libraries
				vendor: {
					test: /[\\/]node_modules[\\/](?!@wordpress[\\/]|react|react-dom|scheduler)/,
					name: 'vendors',
					chunks: 'all',
					priority: 20,
					reuseExistingChunk: true,
				},
				// Common application code
				common: {
					name: 'common',
					minChunks: 2,
					chunks: 'all',
					priority: 10,
					reuseExistingChunk: true,
				},
				// Default group
				default: {
					minChunks: 2,
					priority: -20,
					reuseExistingChunk: true,
				},
			},
		},
		// Tree shaking and dead code elimination
		usedExports: true,
		sideEffects: false,
		// Runtime chunk for better caching
		runtimeChunk: {
			name: 'runtime',
		},
		// Module concatenation for smaller bundles
		concatenateModules: true,
	},

	// Performance budgets and warnings
	performance: {
		maxAssetSize: 500000, // 500KB
		maxEntrypointSize: 500000, // 500KB
		hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
		// Filter out source maps and vendor chunks from warnings
		assetFilter: (assetFilename) => {
			return !assetFilename.endsWith('.map') && 
				   !assetFilename.includes('vendors') &&
				   !assetFilename.includes('wordpress');
		},
	},

	// Enhanced module rules
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			// Optimize images
			{
				test: /\.(png|jpe?g|gif|svg)$/i,
				type: 'asset',
				parser: {
					dataUrlCondition: {
						maxSize: 8192, // 8KB - inline smaller images
					},
				},
				generator: {
					filename: 'images/[name].[contenthash:8][ext]',
				},
			},
			// Optimize fonts
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/i,
				type: 'asset/resource',
				generator: {
					filename: 'fonts/[name].[contenthash:8][ext]',
				},
			},
		],
	},

	// Enhanced plugins
	plugins,
	
	// Source maps for debugging
	devtool: process.env.NODE_ENV === 'production' 
		? 'source-map' 
		: 'eval-cheap-module-source-map',

	// Cache configuration for faster rebuilds
	cache: {
		type: 'filesystem',
		buildDependencies: {
			config: [__filename],
		},
		cacheDirectory: path.resolve(__dirname, 'node_modules/.cache/webpack'),
	},

	// Development server configuration
	devServer: {
		...defaultConfig.devServer,
		compress: true,
		hot: true,
		liveReload: true,
		// Performance optimizations
		static: {
			directory: path.resolve(__dirname, 'assets/dist'),
			publicPath: '/assets/dist/',
		},
	},

	// Webpack stats configuration
	stats: {
		colors: true,
		modules: false,
		children: false,
		chunks: false,
		chunkModules: false,
		entrypoints: false,
		warnings: true,
		errors: true,
		performance: true,
		timings: true,
		// Bundle size information
		assets: true,
		assetsSpace: 15,
		// Show reasons for including modules
		reasons: false,
		// Show chunk origins
		chunkOrigins: false,
	},

	// Resolve loader modules
	resolveLoader: {
		modules: ['node_modules'],
	},

	// External dependencies (provided by WordPress)
	externals: {
		...defaultConfig.externals,
		// Additional WordPress externals that might be loaded globally
		jquery: 'jQuery',
	},

	// Target environment
	target: ['web', 'es2017'],

	// Experiments for future features
	experiments: {
		// Enable CSS as modules for better performance
		css: false, // Keep disabled for WordPress compatibility
		// Enable top-level await
		topLevelAwait: true,
	},
};