import React from 'react'
import PropTypes from 'prop-types'
import * as Rsg from 'react-styleguidist'
import Slot from 'rsg-components/Slot'
import SectionHeadingRenderer from 'rsg-components/SectionHeading/SectionHeadingRenderer'
import getUrl from 'react-styleguidist/lib/client/utils/getUrl'

interface SectionHeadingProps {
	children?: React.ReactNode
	id: string
	slotName: string
	slotProps: Rsg.Component & { isolated: boolean; parentName?: string }
	depth: number
	deprecated?: boolean
	pagePerSection?: boolean
}

const SectionHeading: React.FunctionComponent<SectionHeadingProps> = ({
	slotName,
	slotProps,
	children,
	id,
	pagePerSection,
	...rest
}) => {
	const href = pagePerSection
		? getUrl({ slug: id, id: rest.depth !== 1, takeHash: true })
		: getUrl({ slug: id, anchor: true })

	return (
		<SectionHeadingRenderer
			toolbar={slotProps.parentName ? null : <Slot name={slotName} props={slotProps} />}
			id={id}
			href={href}
			{...rest}
			parentName={slotProps.parentName}
		>
			{children}
		</SectionHeadingRenderer>
	)
}

SectionHeading.propTypes = {
	children: PropTypes.node,
	id: PropTypes.string.isRequired,
	slotName: PropTypes.string.isRequired,
	slotProps: PropTypes.shape({
		isolated: PropTypes.bool.isRequired,
		parentName: PropTypes.string
	}).isRequired,
	depth: PropTypes.number.isRequired,
	deprecated: PropTypes.bool,
	pagePerSection: PropTypes.bool
}

export default SectionHeading
