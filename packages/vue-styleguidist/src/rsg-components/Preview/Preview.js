import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { compile, addScopedStyle } from 'vue-inbrowser-compiler'
import PlaygroundError from 'rsg-components/PlaygroundError'
import Vue from 'vue'
import { DocumentedComponentContext } from '../VsgReactComponent/ReactComponent'
import { RenderJsxContext } from '../../utils/renderStyleguide'
import cleanComponentName from '../../utils/cleanComponentName'

class Preview extends Component {
	static propTypes = {
		code: PropTypes.string.isRequired,
		evalInContext: PropTypes.func.isRequired,
		vuex: PropTypes.object,
		component: PropTypes.object,
		renderRootJsx: PropTypes.object
	}
	static contextTypes = {
		config: PropTypes.object.isRequired,
		codeRevision: PropTypes.number.isRequired
	}

	state = {
		error: null
	}

	componentDidMount() {
		// Clear console after hot reload, do not clear on the first load
		// to keep any warnings
		if (this.context.codeRevision > 0) {
			// eslint-disable-next-line no-console
			console.clear()
		}

		this.executeCode()
	}

	shouldComponentUpdate(nextProps, nextState) {
		return this.state.error !== nextState.error || this.props.code !== nextProps.code
	}

	componentDidUpdate(prevProps) {
		if (this.props.code !== prevProps.code) {
			this.executeCode()
		}
	}

	componentWillUnmount() {
		this.unmountPreview()
	}

	unmountPreview() {
		if (this.mountNode) {
			let el = this.mountNode.children[0]
			if (!el) {
				this.mountNode.innerHTML = ' '
				this.mountNode.appendChild(document.createElement('div'))
				el = this.mountNode.children[0]
			}
			el = new Vue({
				el,
				data: {},
				template: '<div></div> '
			})
		}
	}

	executeCode() {
		this.setState({
			error: null
		})

		const { code, vuex, component, renderRootJsx } = this.props
		if (!code) {
			return
		}

		let style
		let previewComponent = {}

		try {
			const example = compile(code, this.context.config.compilerConfig)
			style = example.style
			if (example.script) {
				// compile and execute the script
				// it can be:
				// - a script setting up variables => we set up the data function of previewComponent
				// - a `new Vue()` script that will return a full config object
				previewComponent = this.props.evalInContext(example.script)() || {}
			}
			if (example.template) {
				// if this is a pure template or if we are in hybrid vsg mode,
				// we need to set the template up.
				previewComponent.template = `<div>${example.template}</div>`
			}
		} catch (err) {
			this.handleError(err)
			previewComponent.template = '<div/>'
		}

		let el = this.mountNode.children[0]
		if (!el) {
			this.mountNode.innerHTML = ' '
			this.mountNode.appendChild(document.createElement('div'))
			el = this.mountNode.children[0]
		}

		let extendsComponent = {}
		if (vuex) {
			extendsComponent = { store: vuex.default }
		}
		const moduleId = 'data-v-' + Math.floor(Math.random() * 1000) + 1
		previewComponent._scopeId = moduleId

		// if we are in local component registration, register current component
		// NOTA: on independent md files, component.module is undefined
		if (
			component.module &&
			this.context.config.locallyRegisterComponents &&
			// NOTA: if the components member of the vue config object is
			// already set it should not be changed
			!previewComponent.components
		) {
			component.displayName = cleanComponentName(component.name)
			// register component locally
			previewComponent.components = {
				[component.displayName]: component.module.default || component.module
			}
		}

		// then we just have to render the setup previewComponent in the prepared slot
		const rootComponent = renderRootJsx
			? renderRootJsx.default(previewComponent)
			: { render: createElement => createElement(previewComponent) }

		new Vue({
			...extendsComponent,
			...rootComponent,
			el
		})

		// Add the scoped style if there is any
		if (style) {
			addScopedStyle(style, moduleId)
		}
	}

	handleError = err => {
		this.unmountPreview()

		this.setState({
			error: err.toString()
		})

		console.error(err) // eslint-disable-line no-console
	}

	render() {
		const { error } = this.state
		return (
			<>
				<div ref={ref => (this.mountNode = ref)}>
					<div />
				</div>
				{error && <PlaygroundError message={error} />}
			</>
		)
	}
}

export default function PreviewWithComponent(props) {
	return (
		<RenderJsxContext.Consumer>
			{renderRootJsx => (
				<DocumentedComponentContext.Consumer>
					{component => <Preview {...props} component={component} renderRootJsx={renderRootJsx} />}
				</DocumentedComponentContext.Consumer>
			)}
		</RenderJsxContext.Consumer>
	)
}
