import { TSTypeAnnotation } from '@babel/types'
import getTypeFromAnnotation from '../getTypeFromAnnotation'
import babylon from '../../babel-parser'

function parse(src: string): any {
	return babylon({ plugins: ['typescript'] }).parse(src)
}

function getAnnotation(code: string): TSTypeAnnotation {
	const ast = parse(`const a:${code};`)
	return ast.program.body[0].declarations[0].id.typeAnnotation
}

describe('getTypeFromAnnotation', () => {
	it('should extract type string', () => {
		expect(getTypeFromAnnotation(getAnnotation('string'))).toMatchInlineSnapshot(`
		Object {
		  "name": "string",
		}
	`)
	})

	it('should extract type array', () => {
		expect(getTypeFromAnnotation(getAnnotation('string[]'))).toMatchInlineSnapshot(`
		Object {
		  "name": "string[]",
		}
	`)
	})

	it('should extract composed type', () => {
		expect(getTypeFromAnnotation(getAnnotation('MetaType<string>'))).toMatchInlineSnapshot(`
		Object {
		  "name": "MetaType",
		}
	`)
	})

	it('should extract union type', () => {
		expect(
			getTypeFromAnnotation(
				getAnnotation('"string literal" | 3 | Book | string[] | number[] | Book[] | Array<Book>')
			)
		).toMatchInlineSnapshot(`
		Object {
		  "name": "string literal | 3 | Book | string[] | number[] | Book[] | Book[]",
		}
	`)
	})

	it('should extract intersection type', () => {
		expect(
			getTypeFromAnnotation(
				getAnnotation('"string literal" & 3 & Book & string[] & number[] & Book[] & Array<Book>')
			)
		).toMatchInlineSnapshot(`
		Object {
		  "name": "string literal & 3 & Book & string[] & number[] & Book[] & Book[]",
		}
	`)
	})
})
