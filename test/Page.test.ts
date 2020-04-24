
// describe('Set Node', () => {
//   beforeEach(() => {
//     page = new Page(pageId, turtle);
//   });

//   // it('sets page title', () => {
//   //   let op: Operation = { type: 'set_node', path: { parentId: '', offset: 0 }, newProperties: { title: 'Welcome' } }
//   //   page.apply(op)
//   //   let pageJson: any = page.toJson()
//   //   assert.strictEqual(pageJson.title, 'Welcome')
//   // })

//   it('sets a paragraph by adding a property', () => {
//     let op: Operation = { type: 'set_node', path: { parentId: pageId, offset: 0 }, newProperties: { name: 'alice' } }
//     page.apply(op)
//     let pageJson = page.toJson()
//     assert.strictEqual(pageJson.children[0].name, 'alice')
//     // TODO: sparql
//   });
//   it('sets a paragraph by adding and removing', () => {
//     let op1: Operation = { type: 'set_node', path: { parentId: pageId, offset: 0 }, newProperties: { name: 'alice' } }
//     let op2: Operation = { type: 'set_node', path: { parentId: pageId, offset: 0 }, newProperties: { name: null, age: 25 } }
//     page.apply(op1)
//     page.apply(op2)
//     let pageJson = page.toJson()
//     assert.strictEqual(pageJson.children[0].name, undefined)
//     assert.strictEqual(pageJson.children[0].age, 25)
//     // TODO: sparql
//   });
//   it('sets a text by adding a property', () => {
//     let op: Operation = { type: 'set_node', path: { parentId: paraId1, offset: 0 }, newProperties: { bold: false } }
//     page.apply(op)
//     let pageJson = page.toJson()
//     assert.strictEqual(pageJson.children[0].children[0].bold, false)
//     // TODO: sparql
//   });
// });
