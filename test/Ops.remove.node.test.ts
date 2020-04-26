// import { Page } from '../src/Page';
// import { config as cfg, turtle } from '../config/test'
// import { Operation } from '../src/interface'
// import * as assert from 'power-assert';

// let page: Page;
// let turtleAll = '';
// turtleAll += turtle.page + '\n';
// turtleAll += turtle.para.join('\n') + '\n'
// turtleAll += turtle.text.join('\n') + '\n'

// let op0: Operation;
// let op1: Operation;
// let op2: Operation;
// let op3: Operation;

// describe('Remove Node', () => {
//   beforeEach(() => {
//     page = new Page(cfg.page.id, turtleAll);
//     op0 = {
//       type: 'remove_node',
//       path: { parentId: cfg.page.id, offset: 0 }
//     }
//     op1 = {
//       type: 'remove_node',
//       path: { parentId: cfg.page.id, offset: 1 }
//     }
//     op2 = {
//       type: 'remove_node',
//       path: { parentId: cfg.page.id, offset: 2 }
//     }
//     op3 = {
//       type: 'remove_node',
//       path: { parentId: cfg.para[0].id, offset: 1 }
//     }

//   });

//   it('removes a paragraph in the beginning', () => {
//     page.apply(op0)

//     assert.deepStrictEqual(page.toJson().children, [cfg.para[1], cfg.para[2]])
//     assert(page.getNode(cfg.para[0].id)?.isDeleted())
//     assert(page.getNode(cfg.text[0].id)?.isDeleted())
//   });

//   it('removes a paragraph in the middle', () => {
//     page.apply(op1)

//     assert.deepStrictEqual(page.toJson().children, [cfg.para[0], cfg.para[2]])
//     assert(page.getNode(cfg.para[1].id)?.isDeleted())
//     assert(page.getNode(cfg.text[4].id)?.isDeleted())
//   });

//   it('removes a paragraph in the end', () => {
//     page.apply(op2)

//     assert.deepStrictEqual(page.toJson().children, [cfg.para[0], cfg.para[1]])
//     assert(page.getNode(cfg.para[2].id)?.isDeleted())
//     assert(page.getNode(cfg.text[8].id)?.isDeleted())
//   });

//   it('does nothing to remove at offset > length', () => {
//     op0.path.offset = 100
//     page.apply(op0)

//     assert.deepStrictEqual(page.toJson(), cfg.page)
//   });

//   it('removes a text node', () => {
//     page.apply(op3);

//     assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0], cfg.text[2]])
//   });

//   it('throws if parent is not found', () => {
//     op0.path.parentId = cfg.page.id + '#fake';
//     assert.throws(() => {
//       page.apply(op0)
//     })
//   });

//   it('throws if parent is a leaf node', () => {
//     op3.path.parentId = cfg.text[0].id;
//     assert.throws(() => {
//       page.apply(op3)
//     })
//   })

//   it('throws on offset < 0', () => {
//     op3.path.offset = -1;
//     assert.throws(() => {
//       page.apply(op3)
//     })
//   })

//   it('undoes to the original state after a bunch of operations', () => {
//     page.apply(op2);
//     page.apply(op1);
//     page.undo();

//     assert.deepStrictEqual(page.toJson(), cfg.page);
//     assert.deepStrictEqual(page.getSparqlForUpdate(), '')
//   })

// });
