// import { Page } from '../src/Page';
// import { config as cfg, turtle } from '../config/test';

// import { Operation } from '../src/interface'
// import * as assert from 'power-assert';

// let page: Page;
// let turtleAll = '';
// turtleAll += turtle.page + '\n';
// turtleAll += turtle.para.join('\n') + '\n'
// turtleAll += turtle.text.join('\n') + '\n'

// describe('Text Operations', () => {

//   describe('Insert Text', () => {

//     let insertTextOp: Operation

//     beforeEach(() => {
//       page = new Page(cfg.page.id, turtleAll);

//       insertTextOp = {
//         type: 'insert_text',
//         path: { parentId: cfg.para[0].id, offset: 0 },
//         offset: 1,
//         text: 'abc'
//       }
//     });

//     it('insert text', () => {
//       page.apply(insertTextOp)

//       assert.strictEqual(page.toJson().children[0].children[0].text, 'tabcext 0')
//     })

//     it('throws if parent is not found', () => {
//       insertTextOp.path.parentId = cfg.page.id + '#fake'
//       assert.throws(() => {
//         page.apply(insertTextOp)
//       });
//     })

//     it('throws if parent is a leaf', () => {
//       insertTextOp.path.parentId = cfg.text[0].id
//       assert.throws(() => {
//         page.apply(insertTextOp)
//       });
//     })

//     it('throws if offset < 0', () => {
//       insertTextOp.path.offset = -1
//       assert.throws(() => {
//         page.apply(insertTextOp)
//       });
//     })

//     it('throws if offset > length', () => {
//       insertTextOp.path.offset = 10
//       assert.throws(() => {
//         page.apply(insertTextOp)
//       });
//     })

//     it('throws if not a leaf node', () => {
//       insertTextOp.path.parentId = cfg.page.id
//       assert.throws(() => {
//         page.apply(insertTextOp)
//       });
//     })

//   });

//   describe('Remove Text', () => {

//     let removeTextOp: Operation

//     beforeEach(() => {
//       page = new Page(cfg.page.id, turtleAll);

//       removeTextOp = {
//         type: 'remove_text',
//         path: { parentId: cfg.para[0].id, offset: 0 },
//         offset: 1,
//         text: 'abc',
//       }
//     });

//     it('remove text', () => {
//       page.apply(removeTextOp)

//       assert.strictEqual(page.toJson().children[0].children[0].text, 't 0')
//     })

//     it('throws if parent is not found', () => {
//       removeTextOp.path.parentId = cfg.page.id + '#fake'
//       assert.throws(() => {
//         page.apply(removeTextOp)
//       });
//     })

//     it('throws if parent is a leaf', () => {
//       removeTextOp.path.parentId = cfg.text[0].id
//       assert.throws(() => {
//         page.apply(removeTextOp)
//       });
//     })

//     it('throws if offset < 0', () => {
//       removeTextOp.path.offset = -1
//       assert.throws(() => {
//         page.apply(removeTextOp)
//       });
//     })

//     it('throws if offset > length', () => {
//       removeTextOp.path.offset = 10
//       assert.throws(() => {
//         page.apply(removeTextOp)
//       });
//     })

//     it('throws if not a leaf node', () => {
//       removeTextOp.path.parentId = cfg.page.id
//       assert.throws(() => {
//         page.apply(removeTextOp)
//       });
//     })

//   });
// });

// describe('Unknown operation', () => {
//   it('throws on an unknown operation', () => {
//     page = new Page(cfg.page.id, turtleAll);
//     assert.throws(()=>{
//       page.apply({
//         type: 'set_selection',
//         properties: null,
//         newProperties: null,  
//       })  
//     })
//   })
// })