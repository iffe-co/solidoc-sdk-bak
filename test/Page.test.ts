
// describe('Split Text Node', () => {
//   beforeEach(() => {
//     page = new Page(pageId, turtle);
//   });
//   it('splits text 1', () => {
//     let op: Operation = { type: 'split_node', path: { parentId: paraId1, offset: 0 }, position: 1, properties: { id: tid3, type: 'http://www.solidoc.net/ontologies#Leaf' } }
//     page.apply(op)
//     let pageJson = page.toJson()
//     assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [tid1, tid3])
//     assert.strictEqual(pageJson.children[0].children[0].text, 'P')
//     assert.strictEqual(pageJson.children[0].children[1].text, 'aragraph 1')
//   });
// });

// describe('Split Branch Node', () => {
//   beforeEach(() => {
//     page = new Page(pageId, turtle);
//     let op: Operation = { type: 'insert_node', path: { parentId: paraId1, offset: 1 }, node: textJson3 }
//     page.apply(op)
//   });
//   it('splits paragraph 1', () => {
//     let op: Operation = { type: 'split_node', path: { parentId: pageId, offset: 0 }, position: 0, properties: { id: pid3, type: 'http://www.solidoc.net/ontologies#Paragraph' } }
//     page.apply(op)
//     let pageJson = page.toJson()
//     assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid3, pid2])
//     assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [])
//     assert.deepStrictEqual(extractChildrenId(pageJson.children[1]), [tid1, tid3])
//   });
// });

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
