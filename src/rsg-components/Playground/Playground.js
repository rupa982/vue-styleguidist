import React, { Component } from 'react';
import PropTypes from 'prop-types';
import debounce from 'lodash/debounce';
import Preview from 'rsg-components/Preview';
import Para from 'rsg-components/Para';
import Slot from 'rsg-components/Slot';
import PlaygroundRenderer from 'rsg-components/Playground/PlaygroundRenderer';
import { EXAMPLE_TAB_CODE_EDITOR } from '../slots';

export default class Playground extends Component {
	static propTypes = {
		code: PropTypes.string.isRequired,
		evalInContext: PropTypes.func.isRequired,
		vuex: PropTypes.object,
		index: PropTypes.number.isRequired,
		name: PropTypes.string.isRequired,
		settings: PropTypes.object,
	};

	static contextTypes = {
		config: PropTypes.object.isRequired,
		isolatedExample: PropTypes.bool,
	};

	constructor(props, context) {
		super(props, context);
		const { code } = props;
		const { config } = context;

		this.showCode = config.showCode;
		this.handleChange = this.handleChange.bind(this);
		this.handleTabChange = this.handleTabChange.bind(this);
		this.handleChange = debounce(this.handleChange, config.previewDelay);

		this.state = {
			code,
			activeTab: undefined,
		};
	}

	componentDidMount() {
		if (this.showCode) {
			setTimeout(() => {
				this.setState({
					activeTab: EXAMPLE_TAB_CODE_EDITOR,
				});
			}, 0);
		}
	}

	componentWillReceiveProps(nextProps) {
		const { code } = nextProps;
		this.setState({
			code,
		});
	}

	shouldComponentUpdate(nextProps, nextState) {
		return nextState.code !== this.state.code || nextState.activeTab !== this.state.activeTab;
	}

	componentWillUnmount() {
		// Clear pending changes
		this.handleChange.cancel();
	}

	handleChange(code) {
		this.setState({
			code,
		});
	}

	handleTabChange(name) {
		this.setState(state => ({
			activeTab: state.activeTab !== name ? name : undefined,
		}));
	}

	render() {
		const { code, activeTab } = this.state;
		const { evalInContext, index, name, vuex, settings } = this.props;
		const { isolatedExample } = this.context;
		const preview = <Preview code={code} vuex={vuex} evalInContext={evalInContext} />;
		if (settings.noeditor) {
			return (
				<Para>
					{preview}
				</Para>
			);
		}
		if (settings.classname) {
			settings.props = {
				className: settings.classname,
			};
		}
		return (
			<PlaygroundRenderer
				name={name}
				preview={preview}
				previewProps={settings.props || {}}
				tabButtons={
					<Slot
						name="exampleTabButtons"
						active={activeTab}
						props={{ onClick: this.handleTabChange }}
					/>
				}
				tabBody={
					<Slot
						name="exampleTabs"
						active={activeTab}
						onlyActive
						props={{ code, onChange: this.handleChange }}
					/>
				}
				toolbar={
					<Slot name="exampleToolbar" props={{ name, isolated: isolatedExample, example: index }} />
				}
			/>
		);
	}
}
