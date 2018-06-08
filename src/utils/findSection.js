import find from 'lodash/find';

/**
 * Recursively finds a section with a given name (exact match)
 *
 * @param  {Array}  sections
 * @param  {string} name
 * @return {object}
 */
export default function findSection(sections, name) {
	const found = find(
		sections,
		section => section.name.replace(/\s/g, '%20') === name.replace(/\s/g, '%20')
	);
	if (found) {
		return found;
	}

	for (let i = 0; i < sections.length; i++) {
		const section = sections[i];
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
