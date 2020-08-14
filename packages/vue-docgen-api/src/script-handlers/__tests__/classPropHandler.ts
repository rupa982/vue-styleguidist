import { NodePath } from 'ast-types/lib/node-path'
import Map from 'ts-map'
import babylon from '../../babel-parser'
import Documentation, { PropDescriptor } from '../../Documentation'
import resolveExportedComponent from '../../utils/resolveExportedComponent'
import classPropHandler from '../classPropHandler'

jest.mock('../../Documentation')

function parse(src: string): Map<string, NodePath> {
	const ast = babylon({ plugins: ['typescript'] }).parse(src)
	return resolveExportedComponent(ast)[0]
}

describe('propHandler', () => {
	let documentation: Documentation
	let mockPropDescriptor: PropDescriptor

	beforeEach(() => {
		mockPropDescriptor = {
			name: '',
			description: '',
			tags: {}
		}
		const MockDocumentation = Documentation
		documentation = new MockDocumentation('test/path')
		const mockGetPropDescriptor = documentation.getPropDescriptor as jest.Mock
		mockGetPropDescriptor.mockReturnValue(mockPropDescriptor)
	})

	function tester(src: string, matchedObj: any) {
		const def = parse(src).get('default')
		classPropHandler(documentation, def as any)
		expect(mockPropDescriptor).toMatchObject(matchedObj)
	}

	describe('base', () => {
		it('should ignore data that does not have the prop decorator', () => {
			const src = `
        @Component
        export default class MyComp {
          someData: boolean;
        }`
			tester(src, {})
			expect(documentation.getPropDescriptor).not.toHaveBeenCalledWith('someData')
		})

		it('should detect all data that have the prop decorator', () => {
			const src = `
        @Component
        export default class MyComp {
          @Prop
          test: string;
        }`
			tester(src, {
				type: { name: 'string' }
			})
			expect(documentation.getPropDescriptor).toHaveBeenCalledWith('test')
		})

		it('should detect all data with composite types', () => {
			const src = `
        @Component
        export default class MyComp {
          @Prop
          test: string | null;
        }`
			tester(src, {
				type: { name: 'union', elements: [{ name: 'string' }, { name: 'null' }] }
			})
			expect(documentation.getPropDescriptor).toHaveBeenCalledWith('test')
		})

		it('should get default expression from the prop decorator', () => {
			const src = `
        @Component
        export default class MyTest {
          @Prop({default: 'hello'})
          testDefault: string;
        }`
			tester(src, {
				type: { name: 'string' },
				defaultValue: {
					value: `"hello"`
				}
			})
			expect(documentation.getPropDescriptor).toHaveBeenCalledWith('testDefault')
		})

		it('should get required from the prop decorator', () => {
			const src = `
        @Component
        export default class MyTest {
          @Prop({required: true})
          testRequired: string;
        }`
			tester(src, {
				type: { name: 'string' },
				required: true
			})
			expect(documentation.getPropDescriptor).toHaveBeenCalledWith('testRequired')
		})

		it('should extract descriptions from leading comments', () => {
			const src = `
        @Component
        export default class MyTest {
          /**
           * A described prop
           **/
          @Prop
          testDescribed: boolean;
        }`
			tester(src, {
				description: 'A described prop'
			})
			expect(documentation.getPropDescriptor).toHaveBeenCalledWith('testDescribed')
		})

		it('should parse the @values tag as its own', () => {
			const src = `
		@Component
		export default class MyTest {
		  /**
		   * color of the component
		   * @values dark, light
		   **/
		  @Prop
		  color: string;
		}`
			tester(src, {
				description: 'color of the component',
				values: ['dark', 'light']
			})
			expect(documentation.getPropDescriptor).toHaveBeenCalledWith('color')
		})

		it('should parse get the values from TS type', () => {
			const src = `
		@Component
		export default class MyTest {
		  @Prop
		  color: "dark" | "light";
		}`
			tester(src, {
				values: ['dark', 'light']
			})
			expect(documentation.getPropDescriptor).toHaveBeenCalledWith('color')
		})

		it('should extract type from decorator arguments', () => {
			const src = `
        @Component
        export default class MyTest {
          @Prop({type:String})
          testTyped;
        }`
			tester(src, {
				type: { name: 'string' }
			})
			expect(documentation.getPropDescriptor).toHaveBeenCalledWith('testTyped')
		})

		it('should document props as decorator argument', () => {
			const src = `
        @Component({
			props: {
				testTyped: String
			}
		})
        export default class MyTest {
        }`
			tester(src, {
				type: { name: 'string' }
			})
			expect(documentation.getPropDescriptor).toHaveBeenCalledWith('testTyped')
		})

		it('should parse union types properly', () => {
			const src = `
			import Vue from 'vue'
			import { Prop, Component } from 'vue-property-decorator'
			
			@Component({})
			export default class BaseCheckbox extends Vue {
			  @Prop({ default: '' }) id!: string | number
			  // [… more props here]
			}`
			tester(src, {
				type: { name: 'union' }
			})
			expect(documentation.getPropDescriptor).toHaveBeenCalledWith('id')
			expect(mockPropDescriptor.type).toMatchInlineSnapshot(`
			Object {
			  "elements": Array [
			    Object {
			      "name": "string",
			    },
			    Object {
			      "name": "number",
			    },
			  ],
			  "name": "union",
			}
		`)
		})
	})
})
