import isNaN from 'lodash/isNaN';
import GithubSlugger from 'github-slugger';
import Vue from 'vue';

// Export the singleton instance of GithubSlugger
export const slugger = new GithubSlugger();

export function setSlugs(sections) {
	return sections.map(section => {
		const { name, components, sections } = section;
		if (name) {
			section.slug = slugger.slug(section.name);
		}
		if (components && components.length) {
			section.components = setSlugs(components);
		}
		if (sections && sections.length) {
			section.sections = setSlugs(sections);
		}
		return section;
	});
}

/**
 * Expose component as global variables.
 *
 * @param {Object} component
 */
export function globalizeComponent(component) {
	const displayName = component.props.displayName;
	if (!component.name) {
		return;
	}
	Vue.component(displayName, component.module);
}

/**
 * Do things that are hard or impossible to do in a loader.
 *
 * @param {Array} components
 * @param {String} vuex
 * @return {Array}
 */
export function processComponents(components, vuex) {
	return components.map(component => {
		// Add .name shortcuts for names instead of .props.displayName.
		component.name = component.props.displayName;

		// Append @example doclet to all examples
		if (component.props.example) {
			component.props.examples = [...component.props.examples, ...component.props.example];
			delete component.props.example;
		}
		component.props.examples = processExamples(component.props.examples, vuex);

		globalizeComponent(component);

		return component;
	});
}

export function processExamples(examples, vuex) {
	return examples.map(example => {
		if (example.type === 'code') {
			example.vuex = vuex;
		}
		return example;
	});
}

/**
 * Recursively process each component in all sections.
 *
 * @param {Array} sections
 * @param {String} vuex
 * @return {Array}
 */
export function processSections(sections, vuex) {
	return sections.map(section => {
		section.components = processComponents(section.components || [], vuex);
		section.sections = processSections(section.sections || [], vuex);
		return section;
	});
}

/**
 * Fuzzy filters components list by component name.
 *
 * @param {string} query
 * @return {RegExp}
 */
export function getFilterRegExp(query) {
	query = query.replace(/[^a-z0-9]/gi, '').split('').join('.*');
	return new RegExp(query, 'i');
}

/**
 * Fuzzy filters components list by component name.
 *
 * @param {array} components
 * @param {string} query
 * @return {array}
 */
export function filterComponentsByName(components, query) {
	const regExp = getFilterRegExp(query);
	return components.filter(({ name }) => regExp.test(name));
}

/**
 * Fuzzy filters sections by section or component name.
 *
 * @param {Array} sections
 * @param {string} query
 * @return {Array}
 */
export function filterSectionsByName(sections, query) {
	const regExp = getFilterRegExp(query);

	return sections
		.map(section =>
			Object.assign({}, section, {
				sections: section.sections ? filterSectionsByName(section.sections, query) : [],
				components: section.components ? filterComponentsByName(section.components, query) : [],
			})
		)
		.filter(
			section =>
				section.components.length > 0 || section.sections.length > 0 || regExp.test(section.name)
		);
}

/**
 * Filters list of components by component name.
 *
 * @param {Array} components
 * @param {string} name
 * @return {Array}
 */
export function filterComponentsByExactName(components, name) {
	return components.filter(component => component.name === name);
}

/**
 * Recursively filters all components in all sections by component name.
 *
 * @param {object} sections
 * @param {string} name
 * @return {Array}
 */
export function filterComponentsInSectionsByExactName(sections, name) {
	const components = [];
	sections.forEach(section => {
		if (section.components) {
			components.push(...filterComponentsByExactName(section.components, name));
		}
		if (section.sections) {
			components.push(...filterComponentsInSectionsByExactName(section.sections, name));
		}
	});
	return components;
}

/**
 * Recursively finds a section with a given name (exact match)
 *
 * @param  {Array}  sections
 * @param  {string} name
 * @return {object}
 */
export function findSection(sections, name) {
	const found = sections.find(section => section.name === name);
	if (found) {
		return found;
	}

	for (const section of sections) {
		if (!section.sections || section.sections.length === 0) {
			continue;
		}
		const found = findSection(section.sections, name);
		if (found) {
			return found;
		}
	}

	return undefined;
}

/**
 * Returns an object containing component/section name and, optionally, an example index
 * from hash part or page URL:
 * http://localhost:6060/#!/Button → { targetName: 'Button' }
 * http://localhost:6060/#!/Button/1 → { targetName: 'Button', targetIndex: 1 }
 *
 * @param {string} [hash]
 * @returns {object}
 */
export function getInfoFromHash(hash = window.location.hash) {
	if (hash.substr(0, 3) === '#!/') {
		const tokens = hash.substr(3).split('/');
		const index = parseInt(tokens[1], 10);
		return {
			targetName: tokens[0],
			targetIndex: isNaN(index) ? null : index,
		};
	}
	return {};
}

/**
 * Return a shallow copy of the given component with the examples array filtered
 * to contain only the specified index:
 * filterComponentExamples({ examples: [1,2,3], ...other }, 2) → { examples: [3], ...other }
 *
 * @param {object} component
 * @param {number} index
 * @returns {object}
 */
export function filterComponentExamples(component, index) {
	const newComponent = Object.assign({}, component);
	newComponent.props.examples = [component.props.examples[index]];
	return newComponent;
}

export function processMixins(mixins) {
	mixins.forEach(mixin => {
		if (mixin.default) {
			globalizeMixin(mixin.default);
		} else {
			globalizeMixin(mixin);
		}
	});
}

export function globalizeMixin(mixin) {
	Vue.mixin(mixin);
}
