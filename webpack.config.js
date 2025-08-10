/**
 * EchoDash Webpack Configuration
 *
 * Enhanced webpack configuration for performance optimization and code splitting
 * Built on top of @wordpress/scripts with Phase 5 performance features.
 */

const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const path = require('path');
const BundleAnalyzerPlugin =
	require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CompressionPlugin = require('compression-webpack-plugin');

// Plugin configuration
const plugins = [...defaultConfig.plugins];

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
		filename: '[name].js', // Disable hashing for WordPress integration
		chunkFilename: '[name].js',
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

	// Enhanced optimization with vendor chunk splitting
	optimization: {
		...defaultConfig.optimization,
		// Enable code splitting for better caching
		splitChunks: {
			chunks: 'all',
			cacheGroups: {
				// WordPress-specific packages
				wordpress: {
					test: /[\\/]node_modules[\\/]@wordpress[\\/]/,
					name: 'wordpress',
					chunks: 'all',
					priority: 20,
				},
				// Third-party vendor packages
				vendors: {
					test: /[\\/]node_modules[\\/](?!@wordpress[\\/])/,
					name: 'vendors',
					chunks: 'all',
					priority: 10,
				},
			},
		},
		// Keep runtime chunk disabled for WordPress compatibility
		runtimeChunk: false,
		// Keep tree shaking but be conservative with side effects
		usedExports: true,
		sideEffects: false,
	},

	// Performance budgets and warnings
	performance: {
		maxAssetSize: 500000, // 500KB
		maxEntrypointSize: 500000, // 500KB
		hints: process.env.NODE_ENV === 'production' ? 'warning' : false,
		// Filter out source maps and vendor chunks from warnings
		assetFilter: assetFilename => {
			return (
				!assetFilename.endsWith('.map') &&
				!assetFilename.includes('vendors') &&
				!assetFilename.includes('wordpress')
			);
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
	devtool:
		process.env.NODE_ENV === 'production'
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
		//jquery: 'jQuery',
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
