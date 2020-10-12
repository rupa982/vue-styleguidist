import { resolve } from 'path'
import theme from '@nuxt/content-theme-docs'

export default theme({
	content: {
		dir: 'docs',
		// since the MarkDown files will be generated by docgen cli
		// editing them will be overwritten as soon as the next generation
		liveEdit: false,
		markdown: {
			// transform fenced code blocks into VueLive
			remarkPlugins: ['remark-plugin-vue-live']
		}
	},
	build: {
		extend(config) {
			// make template coiler available at runtime
			config.resolve.alias['vue$'] = 'vue/dist/vue.esm.js'
			// avoid failling to load vue components with docs additional content
			config.module.rules.push({
				resourceQuery: /blockType=docs/,
				loader: require.resolve('./docs/empty-object-loader')
			})
		}
	},
	plugins: [
		// register the vue-live component
		resolve(__dirname, './plugins/vue-live.js'),
		// register all documented components
		resolve(__dirname, './plugins/docgen-register-all.js')
	]
})
