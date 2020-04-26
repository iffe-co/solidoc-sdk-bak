// import { Page } from '../src/Page';
// import { config as cfg, turtle } from '../config/test';

// import { Operation } from '../src/interface'
// import * as assert from 'power-assert';

// let page: Page;
// let turtleAll = '';
// turtleAll += turtle.page + '\n';
// turtleAll += turtle.para.join('\n') + '\n'
// turtleAll += turtle.text.join('\n') + '\n'

// let newId = cfg.page.id + '#new'

// describe('Split Nodes', () => {

//   describe('Branch Nodes', () => {

//     let splitBranchOp: Operation

//     beforeEach(() => {
//       page = new Page(cfg.page.id, turtleAll);

//       splitBranchOp = {
//         type: 'split_node',
//         path: { parentId: cfg.page.id, offset: 0 },
//         position: 1,
//         properties: { id: newId }
//       }
//     });

//     it('splits branch 0', () => {
//       page.apply(splitBranchOp)

//       assert.strictEqual(page.toJson().children.length, 4)
//       assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0]])
//       assert.deepStrictEqual(page.toJson().children[1].children, [cfg.text[1], cfg.text[2]])
//       assert.strictEqual(page.toJson().children[1].id, newId)
//       assert.strictEqual(page.toJson().children[1].type, cfg.para[0].type)
//     })

//     it('splits branch 0 at position > length', () => {
//       splitBranchOp.position = 10
//       page.apply(splitBranchOp)

//       assert.strictEqual(page.toJson().children.length, 4)
//       assert.strictEqual(page.toJson().children[0].children.length, 3)
//       assert.strictEqual(page.toJson().children[1].children.length, 0)
//     })

//     it('disallows splitting a branch at position -1', () => {
//       splitBranchOp.position = -1
//       assert.throws(() => {
//         page.apply(splitBranchOp)
//       });
//     })

//     it('throws if parent is not found', () => {
//       splitBranchOp.path.parentId = cfg.page.id + '#fake'
//       assert.throws(() => {
//         page.apply(splitBranchOp)
//       });
//     })

//     it('throws if parent is a leaf', () => {
//       splitBranchOp.path.parentId = cfg.text[0].id
//       assert.throws(() => {
//         page.apply(splitBranchOp)
//       });
//     })

//     it('throws if offset < 0', () => {
//       splitBranchOp.path.offset = -1
//       assert.throws(() => {
//         page.apply(splitBranchOp)
//       });
//     })

//     it('throws if offset > length', () => {
//       splitBranchOp.path.offset = 10
//       assert.throws(() => {
//         page.apply(splitBranchOp)
//       });
//     })
//   });

//   describe('Leaf nodes', () => {

//     let splitLeafOp: Operation

//     beforeEach(() => {
//       page = new Page(cfg.page.id, turtleAll);

//       splitLeafOp = {
//         type: 'split_node',
//         path: { parentId: cfg.para[0].id, offset: 0 },
//         position: 1,
//         properties: { id: newId }
//       }
//     });


//     it('splits Leaf 0', () => {
//       page.apply(splitLeafOp)

//       assert.strictEqual(page.toJson().children[0].children.length, 4)
//       assert.deepStrictEqual(page.toJson().children[0].children[0].text, 't')
//       assert.deepStrictEqual(page.toJson().children[0].children[1], {
//         ...cfg.text[0],
//         id: newId,
//         text: 'ext 0'
//       })
//     })

//     it('splits leaf 0 at position > length', () => {
//       splitLeafOp.position = 10
//       page.apply(splitLeafOp)

//       assert.deepStrictEqual(page.toJson().children[0].children.length, 4)
//       assert.deepStrictEqual(page.toJson().children[0].children[0], cfg.text[0])
//       assert.deepStrictEqual(page.toJson().children[0].children[1].text, '')
//     })

//     it('allows splitting a leaf at position -1', () => {
//       splitLeafOp.position = -1
//       page.apply(splitLeafOp)
//       assert.deepStrictEqual(page.toJson().children[0].children[0].text, 'text ')
//       assert.deepStrictEqual(page.toJson().children[0].children[1].text, '0')
//     })

//     it('throws if offset < 0', () => {
//       splitLeafOp.path.offset = -1
//       assert.throws(() => {
//         page.apply(splitLeafOp)
//       });
//     })

//     it('throws if offset < 0', () => {
//       splitLeafOp.path.offset = -1
//       assert.throws(() => {
//         page.apply(splitLeafOp)
//       });
//     })

//   })

// });
