// import Graph from '../../../../app/data_model/ldp/Graph';
import Page from '../src/Page';
import * as assert from 'power-assert';

const pageUri = 'http://example.org/alice/a';
const blockUri1 = pageUri + '#tag1'
const blockUri2 = pageUri + '#tag2'
const blockUri3 = 'http://example.org/alice/b';
const blockUri4 = pageUri + '#tag4'

const id1 = 'tag1'
const id2 = 'tag2'
const id3 = blockUri3
const id4 = 'tag4'

let extractChildrenId = (array: any) => {
  return array.children.map(ele => ele.id)
}

describe('Page', () => {
  let page: Page;
  let turtle = `<${pageUri}> <http://purl.org/dc/terms/title> "Alice\'s Profile";`;
  turtle += ` <http://www.solidoc.net/ontologies#firstChild> <${blockUri1}>.`;
  turtle += `<${blockUri1}> a <http://www.solidoc.net/ontologies#Paragraph>;`;
  turtle += ` <http://www.solidoc.net/ontologies#firstChild> <${blockUri2}>;`;
  turtle += ` <http://www.solidoc.net/ontologies#nextBlock> <${blockUri3}>;`;
  turtle += ` <http://www.solidoc.net/ontologies#content> "Paragraph 1".`;
  turtle += `<${blockUri2}> a <http://www.solidoc.net/ontologies#Paragraph>;`;
  turtle += ` <http://www.solidoc.net/ontologies#content> "Sub paragraph".`;
  turtle += `<${blockUri3}> a <http://www.solidoc.net/ontologies#SolidPage>.`;

  beforeEach(() => {
    page = new Page(pageUri);
    page.fromTurtle(turtle);
  });
  it('parses from quads', () => {
    assert.deepStrictEqual(page.toJson(), {
      id: pageUri,
      title: "Alice's Profile",
      children: [
        {
          id: 'tag1', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Paragraph 1', children: [
            {
              id: 'tag2', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Sub paragraph'
            }
          ]
        },
        {
          id: blockUri3, type: 'http://www.solidoc.net/ontologies#SolidPage', content: ''
        }
      ],
    });
  });
  it('inserts a sub paragraph', () => {
    page.insertNodeBelow(blockUri1, blockUri4);
    page.set(blockUri4, { type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' });
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [id1, id3])
    assert.deepStrictEqual(extractChildrenId(page.toJson().children[0]), [id2])
    page.commit();
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [id1, id3])
    assert.deepStrictEqual(extractChildrenId(page.toJson().children[0]), [id4, id2])
  });
  it('inserts a sibling paragraph', () => {
    page.insertNodeAfter(blockUri1, blockUri4);
    page.set(blockUri4, { type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' });
    page.commit();
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [id1, id4, id3])
    assert.deepStrictEqual(extractChildrenId(page.toJson().children[0]), [id2])
  });
  it('inserts a paragraph to the end', () => {
    page.insertNodeAfter(blockUri2, blockUri4);
    page.set(blockUri2, { type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' });
    page.commit();
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [id1, id3])
    assert.deepStrictEqual(extractChildrenId(page.toJson().children[0]), [id2, id4])
  });
  it('deletes a parent paragraph', () => {
    page.deleteNode(blockUri1);
    page.commit();
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [id3])
  });
  it('deletes a paragraph in the end', () => {
    page.deleteNode(blockUri3);
    page.commit();
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [id1])
    assert.deepStrictEqual(extractChildrenId(page.toJson().children[0]), [id2])
  });
  it('deletes after insertion', () => {
    page.insertNodeBelow(pageUri, blockUri4);
    page.set(blockUri4, { type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' });
    page.deleteNode(blockUri1);
    page.commit();
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [id4, id3])
  });
  it('removes the deleted node from memory after commit', () => {
    page.deleteNode(blockUri2);
    page.commit();
    let errMsg = ''
    try {
      page.deleteNode(blockUri2);
    } catch (e) {
      errMsg = e.message
    }
    assert(errMsg.startsWith('The node is already deleted'))
  });
  it('moves node 3 to the top', () => {
    page.moveNodeBelow(pageUri, blockUri3);
    page.commit();
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [id3, id1])
    assert.deepStrictEqual(extractChildrenId(page.toJson().children[1]), [id2])
  });
  it('moves node 1 to the end', () => {
    page.moveNodeAfter(blockUri3, blockUri1);
    page.commit();
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [id3, id1])
    assert.deepStrictEqual(extractChildrenId(page.toJson().children[1]), [id2])
  });
  it('moves node 2 to the middle', () => {
    page.moveNodeAfter(blockUri1, blockUri2);
    page.commit();
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [id1, id2, id3])
  });
  it('moves node 3 to the middle', () => {
    page.moveNodeAfter(blockUri2, blockUri3);
    page.commit();
    assert.deepStrictEqual(extractChildrenId(page.toJson()), [id1])
    assert.deepStrictEqual(extractChildrenId(page.toJson().children[0]), [id2, id3])
  });
  it('disallows moving below a child', () => {
    let errMsg = ''
    try {
      page.moveNodeBelow(blockUri2, blockUri1);
    } catch (e) {
      errMsg = e.message
    }
    assert(errMsg.startsWith('Trying to append the node to its decendent'))
  });
});
