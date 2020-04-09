// import Graph from '../../../../app/data_model/ldp/Graph';
import { Page, fromTurtle, fromJson } from '../src/Page';
import * as assert from 'power-assert';

const pageUri = 'http://example.org/alice/a';
// const pageJson = { id: pageUri, title: "Alice's Profile", children: [] };

const pid1 = 'tag1'
const paraUri1 = pageUri + '#' + pid1

const tid1 = 'text1'
const textUri1 = pageUri + '#' + tid1
const textJson1 = { id: 'text1', type: 'http://www.solidoc.net/ontologies#Leaf', text: 'Paragraph 1' }

const pid2 = 'tag2'
const paraUri2 = pageUri + '#' + pid2

const tid2 = 'text2'
const textUri2 = pageUri + '#' + tid2
const textJson2 = { id: 'text2', type: 'http://www.solidoc.net/ontologies#Leaf', text: 'Paragraph 2' }

const pid3 = 'tag3'
const tid3 = 'text3'
const textJson3 = { id: 'text3', type: 'http://www.solidoc.net/ontologies#Leaf', text: 'Paragraph 3' }

let extractChildrenId = (array: any) => {
  return array.children.map(ele => ele.id)
}

let turtle = `<${pageUri}> a <http://www.solidoc.net/ontologies#Root>;`;
turtle += ` <http://purl.org/dc/terms/title> "Alice\'s Profile";`;
turtle += ` <http://www.solidoc.net/ontologies#firstChild> <${paraUri1}>.`;

turtle += `<${paraUri1}> a <http://www.solidoc.net/ontologies#Paragraph>;`;
turtle += ` <http://www.solidoc.net/ontologies#firstChild> <${textUri1}>;`;
turtle += ` <http://www.solidoc.net/ontologies#nextNode> <${paraUri2}>.`;

turtle += `<${textUri1}> a <http://www.solidoc.net/ontologies#Leaf>;`;
turtle += ` <http://www.solidoc.net/ontologies#text> "Paragraph 1".`;

turtle += `<${paraUri2}> a <http://www.solidoc.net/ontologies#Paragraph>;`;
turtle += ` <http://www.solidoc.net/ontologies#firstChild> <${textUri2}>.`;

turtle += `<${textUri2}> a <http://www.solidoc.net/ontologies#Leaf>;`;
turtle += ` <http://www.solidoc.net/ontologies#text> "Paragraph 2".`;

let json: any = {
  id: pageUri,
  type: 'http://www.solidoc.net/ontologies#Root',
  title: "Alice's Profile",
  children: [
    { id: 'tag1', type: 'http://www.solidoc.net/ontologies#Paragraph', children: [textJson1] },
    { id: 'tag2', type: 'http://www.solidoc.net/ontologies#Paragraph', children: [textJson2] },
  ],
}

let page: Page;

describe('Create Page', () => {
  it('parses from quads', () => {
    page = fromTurtle(pageUri, turtle);
    assert.deepStrictEqual(page.toJson(), json);
  });
  it('parses from json', () => {
    page = fromJson(json);
    assert.deepStrictEqual(page.toJson(), json);
  });
});

describe('Insert Node', () => {
  beforeEach(() => {
    page = fromTurtle(pageUri, turtle);
  });

  it('inserts a text node at paragraph beginning', () => {
    page.insertNode({parentUri: paraUri1, offset: 0}, textJson3);
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid2])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [tid3, tid1])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[1]), [tid2])
    assert.deepStrictEqual(pageJson.children[0].children[0], textJson3)
  });
  it('inserts a text node at paragraph end', () => {
    page.insertNode({parentUri: paraUri1, offset: 1}, textJson3);
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid2])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [tid1, tid3])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[1]), [tid2])
    assert.deepStrictEqual(pageJson.children[0].children[1], textJson3)
  });
  it('inserts a text node at offset > length', () => {
    page.insertNode({parentUri: paraUri1, offset: 2}, textJson3);
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid2])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [tid1, tid3])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[1]), [tid2])
    assert.deepStrictEqual(pageJson.children[0].children[1], textJson3)
  });
  it('inserts a paragraph at the beginning', () => {
    let paraJson3 = { id: 'tag3', type: 'http://www.solidoc.net/ontologies#Paragraph', children: [textJson3] }
    page.insertNode({parentUri: pageUri, offset: 0}, paraJson3);
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid3, pid1, pid2])
    assert.deepStrictEqual(pageJson.children[0].children[0], textJson3)
  });
  it('inserts a paragraph in the middle', () => {
    let paraJson3 = { id: 'tag3', type: 'http://www.solidoc.net/ontologies#Paragraph', children: [textJson3] }
    page.insertNode({parentUri: pageUri, offset: 1}, paraJson3);
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid3, pid2])
    assert.deepStrictEqual(pageJson.children[1].children[0], textJson3)
  });
  it('inserts a paragraph at the end', () => {
    let paraJson3 = { id: 'tag3', type: 'http://www.solidoc.net/ontologies#Paragraph', children: [textJson3] }
    page.insertNode({parentUri: pageUri, offset: 2}, paraJson3);
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid2, pid3])
    assert.deepStrictEqual(pageJson.children[2].children[0], textJson3)
  });
})

describe('Delete Node', () => {
  beforeEach(() => {
    page = fromTurtle(pageUri, turtle);
  });

  it('deletes a paragraph at the beginning', () => {
    page.deleteNode({parentUri: pageUri, offset: 0});
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [pid2])
  });
  it('deletes a paragraph in the end', () => {
    page.deleteNode({parentUri: pageUri, offset: 1});
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [pid1])
  });
  it('deletes text', () => {
    page.deleteNode({parentUri: paraUri1, offset: 0});
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [])
  });
  it('deletes paragraph after insertion', () => {
    let paraJson3 = { id: 'tag3', type: 'http://www.solidoc.net/ontologies#Paragraph', children: [textJson3] }
    page.insertNode({parentUri: pageUri, offset: 1}, paraJson3);
    page.deleteNode({parentUri: pageUri, offset: 0})
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid3, pid2])
    assert.deepStrictEqual(pageJson.children[0].children[0], textJson3)
  });
  it('removes the deleted paragraph from memory after commit', () => {
    page.deleteNode({parentUri: pageUri, offset: 1});
    page.commit();
    let errMsg = ''
    try {
      page.deleteNode({parentUri: paraUri2, offset: 0});
    } catch (e) {
      errMsg = e.message
    }
    assert(errMsg.startsWith('The node does not exist'))
  });
  it('does not delete at offset > length', () => {
    page.deleteNode({parentUri: pageUri, offset: 2});
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid2])
  });
  // // TODO: use delete text
  // it('removes the child text from memory after commit', () => {
  //   page.deleteNode({parentUri: pageUri, offset: 1});
  //   page.commit();
  //   let errMsg = ''
  //   try {
  //     page.deleteNode({parentUri: paraUri2, offset: 0});
  //   } catch (e) {
  //     errMsg = e.message
  //   }
  //   assert(errMsg.startsWith('The node does not exist'))
  // });
});

describe('Move Node', () => {
  beforeEach(() => {
    page = fromTurtle(pageUri, turtle);
  });

  it('moves paragraph 2 to the beginning', () => {
    page.moveNode(paraUri2, 'below', pageUri);
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid2, pid1])
    assert.deepStrictEqual(pageJson.children[0].children[0], textJson2)
  });
  it('moves paragraph 1 to the end', () => {
    page.moveNode(paraUri1, 'after', paraUri2);
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson), [pid2, pid1])
    assert.deepStrictEqual(pageJson.children[1].children[0], textJson1)
  });
  it('moves text', () => {
    page.moveNode(textUri1, 'after', textUri2);
    let pageJson = page.toJson()
    assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [])
    assert.deepStrictEqual(extractChildrenId(pageJson.children[1]), [tid2, tid1])
  });
  it('disallows moving below a child', () => {
    let errMsg = ''
    try {
      page.moveNode(paraUri1, 'below', textUri1);
    } catch (e) {
      errMsg = e.message
    }
    assert(errMsg.startsWith('Trying to append the node to its decendent'))
  });
});
