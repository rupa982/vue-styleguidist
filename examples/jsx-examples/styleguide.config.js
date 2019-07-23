const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

module.exports = {
	jsxInExamples: true,
	simpleEditor: true,
	title: 'Vue Styleguidist jsx example',
	components: 'src/components/**/[A-Z]*.jsx',
	defaultExample: false,
	ribbon: {
		text: 'Back to examples',
		url: 'https://vue-styleguidist.github.io/Examples.html'
	},
	version: '1.1.1',
	webpackConfig: {
		module: {
			rules: [
				{
					test: /\.(jsx|js)$/,
					exclude: /node_modules|packages/,
					use: {
						loader: 'babel-loader',
						options: {
							presets: ['@babel/preset-env'],
							plugins: ['transform-vue-jsx']
						}
					}
				},
				{
					test: /\.css$/,
					use: ['style-loader', 'css-loader']
				}
			]
		},

		plugins: [].concat(process.argv.includes('--analyze') ? [new BundleAnalyzerPlugin()] : [])
	},
	usageMode: 'expand',
	exampleMode: 'expand',
	styleguideDir: 'dist',
	codeSplit: true
}
