import normalizeComponent from '../normalizeComponent'

describe('normalizeComponent', () => {
	it('bake template into a new Vue (export default)', () => {
		const sut = normalizeComponent(`
<template>
	<div/>
</template>
<script>
import {comp} from './comp'
const param = 'Foo'
export default {
	param
}
</script>`)
		expect(sut.component).toContain('template: `\n<div/>\n`')
	})

	it('bake template into a new Vue (named exports)', () => {
		const sut = normalizeComponent(`
<template>
	<div/>
</template>
<script>
import comp from './comp'
const param = 'Foo'
export const compo = {
	param
}
</script>`)
		expect(sut.component).toContain('template: `\n<div/>\n`')
	})

	it('bake template into a new Vue (es5 exports)', () => {
		const sut = normalizeComponent(`
<template>
	<div/>
</template>
<script>
const param = 'Foo'
module.exports = {
	param
}
</script>`)
		expect(sut.component).toContain('template: `\n<div/>\n`')
	})
})
