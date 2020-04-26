// import { Page } from '../src/Page';
// import { config as cfg, turtle } from '../config/test';

// import { Operation } from '../src/interface'
// import * as assert from 'power-assert';

// let page: Page;
// let turtleAll = '';
// turtleAll += turtle.page + '\n';
// turtleAll += turtle.para.join('\n') + '\n'
// turtleAll += turtle.text.join('\n') + '\n'

// describe('Set Nodes', () => {

//   let setOp: Operation

//   beforeEach(() => {
//     page = new Page(cfg.page.id, turtleAll);

//     setOp = {
//       type: 'set_node',
//       path: { parentId: cfg.para[0].id, offset: 0 },
//       newProperties: { italic: true }
//     }
//   });

//   it('sets leaf 0 by adding a new property', () => {
//     page.apply(setOp)

//     assert.strictEqual(page.toJson().children[0].children[0].italic, true)
//   })

//   it('sets leaf 0 by removing a property', () => {
//     setOp.newProperties = { bold: null }
//     page.apply(setOp)

//     assert.deepStrictEqual(page.toJson().children[0].children[0], {
//       id: cfg.text[0].id,
//       type: cfg.text[0].type,
//       text: cfg.text[0].text,
//     })
//   })

//   it('sets leaf 0 by modifying a property', () => {
//     setOp.newProperties = { bold: false }
//     page.apply(setOp)

//     assert.deepStrictEqual(page.toJson().children[0].children[0], {
//       ...cfg.text[0],
//       bold: false
//     })
//   })

//   it('throws if parent is not found', () => {
//     setOp.path.parentId = cfg.page.id + '#fake'
//     assert.throws(() => {
//       page.apply(setOp)
//     });
//   })

//   it('throws if parent is a leaf', () => {
//     setOp.path.parentId = cfg.text[0].id
//     assert.throws(() => {
//       page.apply(setOp)
//     });
//   })

//   it('throws if offset < 0', () => {
//     setOp.path.offset = -1
//     assert.throws(() => {
//       page.apply(setOp)
//     });
//   })

//   it('throws if offset > length', () => {
//     setOp.path.offset = 10
//     assert.throws(() => {
//       page.apply(setOp)
//     });
//   })

//   it('disallows setting next')
//   it('disallows setting text')
//   it('disallows setting children')
//   it('disallows setting firstChild')

// });
