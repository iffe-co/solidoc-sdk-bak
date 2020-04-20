import { Page } from '../src/Page';
import { Operation, Element } from '../src/interface'
import * as assert from 'power-assert';

const pageId = 'http://example.org/alice/a';
// const pageJson = { id: pageId, title: "Alice's Profile", children: [] };

const pid1 = 'tag1'
const paraId1 = pageId + '#' + pid1

const tid1 = 'text1'
const textId1 = pageId + '#' + tid1
const textJson1 = { id: textId1, type: 'http://www.solidoc.net/ontologies#Leaf', text: 'Paragraph 1' }

const pid2 = 'tag2'
const paraId2 = pageId + '#' + pid2

const tid2 = 'text2'
const textId2 = pageId + '#' + tid2
const textJson2 = { id: textId2, type: 'http://www.solidoc.net/ontologies#Leaf', text: 'Paragraph 2' }

const pid3 = 'tag3'
const tid3 = 'text3'
const textId3 = pageId + '#' + tid3
const textJson3 = { id: textId3, type: 'http://www.solidoc.net/ontologies#Leaf', text: 'Paragraph 3' }

let extractChildrenId = (array: any) => {
  return array.children.map(ele => ele.id.substr(ele.id.indexOf('#') + 1))
}

let turtle = `<${pageId}> a <http://www.solidoc.net/ontologies#Root>;`;
turtle += ` <http://purl.org/dc/terms/title> "Alice\'s Profile";`;
turtle += ` <http://www.solidoc.net/ontologies#firstChild> <${paraId1}>.`;

turtle += `<${paraId1}> a <http://www.solidoc.net/ontologies#Paragraph>;`;
turtle += ` <http://www.solidoc.net/ontologies#firstChild> <${textId1}>;`;
turtle += ` <http://www.solidoc.net/ontologies#nextNode> <${paraId2}>.`;

turtle += `<${textId1}> a <http://www.solidoc.net/ontologies#Leaf>;`;
turtle += ` <http://www.solidoc.net/ontologies#text> "Paragraph 1".`;

turtle += `<${paraId2}> a <http://www.solidoc.net/ontologies#Paragraph>;`;
turtle += ` <http://www.solidoc.net/ontologies#firstChild> <${textId2}>.`;

turtle += `<${textId2}> a <http://www.solidoc.net/ontologies#Leaf>;`;
turtle += ` <http://www.solidoc.net/ontologies#text> "Paragraph 2".`;

let json: Element = {
  id: pageId,
  type: 'http://www.solidoc.net/ontologies#Root',
  title: "Alice's Profile",
  children: [
    { id: paraId1, type: 'http://www.solidoc.net/ontologies#Paragraph', children: [textJson1] },
    { id: paraId2, type: 'http://www.solidoc.net/ontologies#Paragraph', children: [textJson2] },
  ],
}

let page: Page;

describe('Create Page', () => {
  it('parses from quads', () => {
    page = new Page(pageId, turtle);
    assert.deepStrictEqual(page.toJson(), json);
  });
  it('parses from empty string', () => {
    page = new Page(pageId, '');
    assert.deepStrictEqual(page.toJson(), {
      id: pageId,
      type: 'http://www.solidoc.net/ontologies#Root',
      title: '',
      children: [],
    });
  });
});

describe('Insert Node', () => {
  beforeEach(() => {
    page = new Page(pageId, turtle);
  });

  it('inserts a text node at paragraph beginning', () => {
    let op: Operation = { type: 'insert_node', path: { parentId: paraId1, offset: 0 }, node: textJson3 }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid2])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [tid3, tid1])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[1]), [tid2])
    assert.deepStrictEqual(pageJson.children[0].children[0], textJson3)
  });
  it('inserts a text node at paragraph end', () => {
    let op: Operation = { type: 'insert_node', path: { parentId: paraId1, offset: 1 }, node: textJson3 }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid2])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [tid1, tid3])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[1]), [tid2])
    assert.deepStrictEqual(pageJson.children[0].children[1], textJson3)
  });
  it('inserts a text node at offset > length', () => {
    let op: Operation = { type: 'insert_node', path: { parentId: paraId1, offset: 2 }, node: textJson3 }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid2])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [tid1, tid3])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[1]), [tid2])
    assert.deepStrictEqual(pageJson.children[0].children[1], textJson3)
  });
  it('inserts a paragraph at the beginning', () => {
    let paraJson3 = { id: 'tag3', type: 'http://www.solidoc.net/ontologies#Paragraph', children: [textJson3] }
    let op: Operation = { type: 'insert_node', path: { parentId: pageId, offset: 0 }, node: paraJson3 }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid3, pid1, pid2])
    assert.deepStrictEqual(pageJson.children[0].children[0], textJson3)
  });
  it('inserts a paragraph in the middle', () => {
    let paraJson3 = { id: 'tag3', type: 'http://www.solidoc.net/ontologies#Paragraph', children: [textJson3] }
    let op: Operation = { type: 'insert_node', path: { parentId: pageId, offset: 1 }, node: paraJson3 }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid3, pid2])
    assert.deepStrictEqual(pageJson.children[1].children[0], textJson3)
  });
  it('inserts a paragraph at the end', () => {
    let paraJson3 = { id: 'tag3', type: 'http://www.solidoc.net/ontologies#Paragraph', children: [textJson3] }
    let op: Operation = { type: 'insert_node', path: { parentId: pageId, offset: 2 }, node: paraJson3 }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid2, pid3])
    assert.deepStrictEqual(pageJson.children[2].children[0], textJson3)
  });
})

describe('Remove Node', () => {
  beforeEach(() => {
    page = new Page(pageId, turtle);
  });

  it('removes a paragraph at the beginning', () => {
    let op: Operation = { type: 'remove_node', path: { parentId: pageId, offset: 0 } }
    page.apply(op)
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [pid2])
  });

  it('removes a paragraph in the end', () => {
    let op: Operation = { type: 'remove_node', path: { parentId: pageId, offset: 1 } }
    page.apply(op)
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [pid1])
  });

  it('removes text', () => {
    let op: Operation = { type: 'remove_node', path: { parentId: paraId1, offset: 0 } }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [])
  });

  it('removes paragraph after insertion', () => {
    let paraJson3 = { id: 'tag3', type: 'http://www.solidoc.net/ontologies#Paragraph', children: [textJson3] }
    let op1: Operation = { type: 'insert_node', path: { parentId: pageId, offset: 1 }, node: paraJson3 }
    let op2: Operation = { type: 'remove_node', path: { parentId: pageId, offset: 0 } }
    page.apply(op1)
    page.apply(op2)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid3, pid2])
    assert.deepStrictEqual(pageJson.children[0].children[0], textJson3)
  });

  it('the paragraph is marked as deleted', () => {
    let op: Operation = { type: 'remove_node', path: { parentId: pageId, offset: 1 } }
    page.apply(op)
    let para = page.getNode(paraId2)
    assert(para && para.isDeleted())
  });

  it('the children text is also marked deleted', () => {
    let op: Operation = { type: 'remove_node', path: { parentId: pageId, offset: 1 } }
    page.apply(op)
    let text = page.getNode(textId2)
    assert(text && text.isDeleted())
  });

  it('does not remove at offset > length', () => {
    let op: Operation = { type: 'remove_node', path: { parentId: pageId, offset: 2 } }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid2])
  });
});

describe('Move Node', () => {
  beforeEach(() => {
    page = new Page(pageId, turtle);
  });

  it('moves paragraph 2 to the beginning', () => {
    let op: Operation = { type: 'move_node', path: { parentId: pageId, offset: 1 }, newPath: { parentId: pageId, offset: 0 } }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid2, pid1])
    assert.deepStrictEqual(pageJson.children[0].children[0], textJson2)
  });
  it('moves paragraph 1 to the end', () => {
    let op: Operation = { type: 'move_node', path: { parentId: pageId, offset: 0 }, newPath: { parentId: pageId, offset: 1 } }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid2, pid1])
    assert.deepStrictEqual(pageJson.children[1].children[0], textJson1)
  });
  it('moves text', () => {
    let op: Operation = { type: 'move_node', path: { parentId: paraId1, offset: 0 }, newPath: { parentId: paraId2, offset: 1 } }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[1]), [tid2, tid1])
  });
  it('disallows moving below a child', () => {
    let op: Operation = { type: 'move_node', path: { parentId: pageId, offset: 0 }, newPath: { parentId: paraId1, offset: 0 } }
    try {
      page.apply(op)
    } catch (e) {
      return
    }
    assert(0)
  });
});

describe('Merge Text Node', () => {
  beforeEach(() => {
    page = new Page(pageId, turtle);
    let op: Operation = { type: 'insert_node', path: { parentId: paraId1, offset: 1 }, node: textJson3 }
    page.apply(op)
  });
  it('merges text nodes', () => {
    let op: Operation = { type: 'merge_node', path: { parentId: paraId1, offset: 1 } }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [tid1])
    assert.strictEqual(pageJson.children[0].children[0].text, textJson1.text + textJson3.text)
  });
  // it('throws on merging text node 0', () => {
  //   let op: Operation = { type: 'merge_node', path: { parentId: paraId1, offset: 0 } }
  //   try {
  //     page.apply(op)
  //   } catch (e) {
  //     return
  //   }
  //   assert(0)
  // });
  // it('throws on merging offset > length', () => {
  //   let op: Operation = { type: 'merge_node', path: { parentId: paraId1, offset: 2 } }
  //   try {
  //     page.apply(op)
  //   } catch (e) {
  //     return
  //   }
  //   assert(0);
  // });
});

describe('Merge Element Node', () => {
  beforeEach(() => {
    page = new Page(pageId, turtle);
    let op: Operation = { type: 'insert_node', path: { parentId: paraId2, offset: 1 }, node: textJson3 }
    page.apply(op)
  });
  it('merges paragraph 2', () => {
    let op: Operation = { type: 'merge_node', path: { parentId: pageId, offset: 1 } }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [tid1, tid2, tid3])
  });
  // it('throws on merging paragraph 1', () => {
  //   let op: Operation = { type: 'merge_node', path: { parentId: pageId, offset: 0 } }
  //   try {
  //     page.apply(op)
  //   } catch (e) {
  //     return
  //   }
  //   assert(0)
  // });
  // it('throws on merging offset > length', () => {
  //   let op: Operation = { type: 'merge_node', path: { parentId: pageId, offset: 2 } }
  //   try {
  //     page.apply(op)
  //   } catch (e) {
  //     return
  //   }
  //   assert(0)
  // });
});

describe('Split Text Node', () => {
  beforeEach(() => {
    page = new Page(pageId, turtle);
  });
  it('splits text 1', () => {
    let op: Operation = { type: 'split_node', path: { parentId: paraId1, offset: 0 }, position: 1, properties: { id: tid3, type: 'http://www.solidoc.net/ontologies#Leaf' } }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [tid1, tid3])
    assert.strictEqual(pageJson.children[0].children[0].text, 'P')
    assert.strictEqual(pageJson.children[0].children[1].text, 'aragraph 1')
  });
});

describe('Split Branch Node', () => {
  beforeEach(() => {
    page = new Page(pageId, turtle);
    let op: Operation = { type: 'insert_node', path: { parentId: paraId1, offset: 1 }, node: textJson3 }
    page.apply(op)
  });
  it('splits paragraph 1', () => {
    let op: Operation = { type: 'split_node', path: { parentId: pageId, offset: 0 }, position: 0, properties: { id: pid3, type: 'http://www.solidoc.net/ontologies#Paragraph' } }
    page.apply(op)
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid3, pid2])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[1]), [tid1, tid3])
  });
});

describe('Set Node', () => {
  beforeEach(() => {
    page = new Page(pageId, turtle);
  });

  // it('sets page title', () => {
  //   let op: Operation = { type: 'set_node', path: { parentId: '', offset: 0 }, newProperties: { title: 'Welcome' } }
  //   page.apply(op)
  //   let pageJson: any = page.toJson()
  //   assert.strictEqual(pageJson.title, 'Welcome')
  // })

  it('sets a paragraph by adding a property', () => {
    let op: Operation = { type: 'set_node', path: { parentId: pageId, offset: 0 }, newProperties: { name: 'alice' } }
    page.apply(op)
    let pageJson = page.toJson()
    assert.strictEqual(pageJson.children[0].name, 'alice')
    // TODO: sparql
  });
  it('sets a paragraph by adding and removing', () => {
    let op1: Operation = { type: 'set_node', path: { parentId: pageId, offset: 0 }, newProperties: { name: 'alice' } }
    let op2: Operation = { type: 'set_node', path: { parentId: pageId, offset: 0 }, newProperties: { name: null, age: 25 } }
    page.apply(op1)
    page.apply(op2)
    let pageJson = page.toJson()
    assert.strictEqual(pageJson.children[0].name, undefined)
    assert.strictEqual(pageJson.children[0].age, 25)
    // TODO: sparql
  });
  it('sets a text by adding a property', () => {
    let op: Operation = { type: 'set_node', path: { parentId: paraId1, offset: 0 }, newProperties: { bold: false } }
    page.apply(op)
    let pageJson = page.toJson()
    assert.strictEqual(pageJson.children[0].children[0].bold, false)
    // TODO: sparql
  });
});
