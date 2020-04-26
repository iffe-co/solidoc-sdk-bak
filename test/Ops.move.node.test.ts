// import { Page } from '../src/Page';
// import { config as cfg, turtle } from '../config/test'
// import * as assert from 'power-assert';

// let page: Page;
// let turtleAll = '';
// turtleAll += turtle.page + '\n';
// turtleAll += turtle.para.join('\n') + '\n'
// turtleAll += turtle.text.join('\n') + '\n'

// describe('Move Node', () => {
//   beforeEach(() => {
//     page = new Page(cfg.page.id, turtleAll);
//   });

//   it('moves a branch to the same level', () => {
//     page.apply({
//       type: 'move_node',
//       path: { parentId: cfg.page.id, offset: 0 },
//       newPath: { parentId: cfg.page.id, offset: 1 },
//     })

//     assert.deepStrictEqual(page.toJson().children, [cfg.para[1], cfg.para[0], cfg.para[2]])
//   });

//   it('moves a branch to a lower level', () => {
//     page.apply({
//       type: 'move_node',
//       path: { parentId: cfg.page.id, offset: 1 },
//       newPath: { parentId: cfg.para[0].id, offset: 1 },
//     })

//     assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0], cfg.para[1], cfg.text[1], cfg.text[2]])
//     assert.deepStrictEqual(page.toJson().children[1], cfg.para[2])
//   })

//   it('moves a leaf across branches', () => {
//     page.apply({
//       type: 'move_node',
//       path: { parentId: cfg.para[0].id, offset: 0 },
//       newPath: { parentId: cfg.para[1].id, offset: 2 },
//     })

//     assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[1], cfg.text[2]])
//     assert.deepStrictEqual(page.toJson().children[1].children, [cfg.text[3], cfg.text[4], cfg.text[0], cfg.text[5]])
//   })

//   it('moves a leaf to an upper level', () => {
//     page.apply({
//       type: 'move_node',
//       path: { parentId: cfg.para[0].id, offset: 2 },
//       newPath: { parentId: cfg.page.id, offset: 3 },
//     })

//     assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0], cfg.text[1]])
//     assert.deepStrictEqual(page.toJson().children[3], cfg.text[2])
//   })

//   it('disallows moving below a child', () => {
//     page.apply({
//       type: 'move_node',
//       path: { parentId: cfg.page.id, offset: 1 },
//       newPath: { parentId: cfg.para[0].id, offset: 1 },
//     })

//     assert.throws(() => {
//       page.apply({
//         type: 'move_node',
//         path: { parentId: cfg.page.id, offset: 0 },
//         newPath: { parentId: cfg.para[1].id, offset: 1 },
//       })
//     })
//   });

//   it('disallows moving below itself', () => {
//     assert.throws(() => {
//       page.apply({
//         type: 'move_node',
//         path: { parentId: cfg.page.id, offset: 0 },
//         newPath: { parentId: cfg.para[0].id, offset: 1 },
//       })
//     })
//   });

//   it('throws if the parent is not found', () => {
//     assert.throws(() => {
//       page.apply({
//         type: 'move_node',
//         path: { parentId: cfg.page.id + '#fake', offset: 0 },
//         newPath: { parentId: cfg.para[0].id, offset: 1 },
//       })
//     })
//   })

//   it('throws if the newParent is not found', () => {
//     assert.throws(() => {
//       page.apply({
//         type: 'move_node',
//         path: { parentId: cfg.page.id, offset: 0 },
//         newPath: { parentId: cfg.page.id + '#fake', offset: 1 },
//       })
//     })
//   })

//   it('throws if the parent is a leaf', () => {
//     assert.throws(() => {
//       page.apply({
//         type: 'move_node',
//         path: { parentId: cfg.text[0].id, offset: 0 },
//         newPath: { parentId: cfg.page.id + '#fake', offset: 1 },
//       })
//     })
//   })

//   it('throws if the newParent is a leaf', () => {
//     assert.throws(() => {
//       page.apply({
//         type: 'move_node',
//         path: { parentId: cfg.page.id, offset: 0 },
//         newPath: { parentId: cfg.text[4].id, offset: 1 },
//       })
//     })
//   })

//   it('throws if the moving node is not found', () => {
//     assert.throws(() => {
//       page.apply({
//         type: 'move_node',
//         path: { parentId: cfg.page.id, offset: 10 },
//         newPath: { parentId: cfg.page.id, offset: 1 },
//       })
//     })
//   })

//   it('is ok to move a node to offset > length', () => {
//     page.apply({
//       type: 'move_node',
//       path: { parentId: cfg.para[0].id, offset: 2 },
//       newPath: { parentId: cfg.page.id, offset: 10 },
//     })

//     assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0], cfg.text[1]])
//   })

// });




