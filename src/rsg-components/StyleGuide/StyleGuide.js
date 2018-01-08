import React, { Component } from 'react';
import PropTypes from 'prop-types';
import TableOfContents from 'rsg-components/TableOfContents';
import StyleGuideRenderer from 'rsg-components/StyleGuide/StyleGuideRenderer';
import Sections from 'rsg-components/Sections';
import Welcome from 'rsg-components/Welcome';
import Error from 'rsg-components/Error';
import { HOMEPAGE } from '../../../scripts/consts';
import { DisplayModes } from '../../consts';
import getIdParam from '../../utils/getIdParam';
import scrollTo from '../../utils/scrollTo';

export default class StyleGuide extends Component {
	static propTypes = {
		codeRevision: PropTypes.number.isRequired,
		config: PropTypes.object.isRequired,
		slots: PropTypes.object.isRequired,
		sections: PropTypes.array.isRequired,
		allSections: PropTypes.array.isRequired,
		welcomeScreen: PropTypes.bool,
		patterns: PropTypes.array,
		displayMode: PropTypes.string,
	};

	static childContextTypes = {
		codeRevision: PropTypes.number.isRequired,
		config: PropTypes.object.isRequired,
		slots: PropTypes.object.isRequired,
		displayMode: PropTypes.string,
	};

	static defaultProps = {
		displayMode: DisplayModes.all,
	};

	state = {
		error: false,
		info: null,
	};

	getChildContext() {
		return {
			codeRevision: this.props.codeRevision,
			config: this.props.config,
			slots: this.props.slots,
			displayMode: this.props.displayMode,
		};
	}

	componentDidMount() {
		this.scrollToId();
	}

	componentDidUpdate() {
		this.scrollToId();
	}

	componentDidCatch(error, info) {
		this.setState({
			error,
			info,
		});
	}

	scrollToId() {
		if (this.props.config.navigation) {
			const id = getIdParam();
			if (id) {
				scrollTo(id);
			} else {
				scrollTo();
			}
		}
	}

	render() {
		const { config, sections, welcomeScreen, patterns, allSections, displayMode } = this.props;

		if (this.state.error) {
			return <Error error={this.state.error} info={this.state.info} />;
		}

		if (welcomeScreen) {
			return <Welcome patterns={patterns} />;
		}

		return (
			<StyleGuideRenderer
				title={config.title}
				homepageUrl={HOMEPAGE}
				toc={<TableOfContents sections={config.navigation ? allSections : sections} />}
				hasSidebar={config.navigation || (config.showSidebar && displayMode === DisplayModes.all)}
			>
				<Sections sections={sections} depth={1} />
			</StyleGuideRenderer>
		);
	}
}
