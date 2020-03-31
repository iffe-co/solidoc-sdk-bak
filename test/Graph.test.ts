// import Graph from '../../../../app/data_model/ldp/Graph';
import Page from '../src/Page';
import * as assert from 'power-assert';

const pageUri = 'http://example.org/alice/a';
const blockUri1 = pageUri + '#tag1'
const blockUri2 = pageUri + '#tag2'
const blockUri3 = 'http://example.org/alice/b';

const blockJson1 = { id: 'tag1', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Paragraph 1' };
const blockJson2 = { id: 'tag2', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' };
const blockJson3 = { id: blockUri3, type: 'http://www.solidoc.net/ontologies#SolidPage', content: '' };

describe('Page', () => {
  let page: Page;
  let turtle = `<${pageUri}> <http://purl.org/dc/terms/title> "Alice\'s Profile";`;
  turtle += ` <http://www.solidoc.net/ontologies#firstChild> <${blockUri1}>.`;
  turtle += `<${blockUri1}> a <http://www.solidoc.net/ontologies#Paragraph>;`;
  turtle += ` <http://www.solidoc.net/ontologies#nextBlock> <${blockUri3}>;`;
  turtle += ` <http://www.solidoc.net/ontologies#content> "Paragraph 1".`;
  turtle += `<${blockUri3}> a <http://www.solidoc.net/ontologies#SolidPage>.`;

  beforeEach(() => {
    page = new Page(pageUri);
    page.fromTurtle(turtle);
  });
  it('parses from quads', () => {
    assert.deepStrictEqual(page.toJson(), {
      id: pageUri,
      title: "Alice's Profile",
      children: [blockJson1, blockJson3],
    });
  });
  it('inserts a paragraph to the head', () => {
    page.insertNodeBelow(pageUri, blockUri2);
    page.set(blockUri2, { type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' });
    assert.deepStrictEqual(page.toJson().children, [blockJson1, blockJson3]);
    page.commit();
    assert.deepStrictEqual(page.toJson().children, [blockJson2, blockJson1, blockJson3]);
  });
  it('inserts a paragraph in the middle', () => {
    page.insertNodeAfter(blockUri1, blockUri2);
    page.set(blockUri2, { type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' });
    page.commit();
    assert.deepStrictEqual(page.toJson().children, [blockJson1, blockJson2, blockJson3]);
  });
  it('inserts a paragraph to the end', () => {
    page.insertNodeAfter(blockUri3, blockUri2);
    page.set(blockUri2, { type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' });
    page.commit();
    assert.deepStrictEqual(page.toJson().children, [blockJson1, blockJson3, blockJson2]);
  });
  it('deletes a paragraph in the middle', () => {
    page.deleteNode(blockUri1);
    page.commit();
    assert.deepStrictEqual(page.toJson(), {
      id: pageUri,
      title: "Alice's Profile",
      children: [blockJson3],
    });
    // TODO:
    // assert(page._nodes[blockUri1]===undefined);
  });
  it('deletes a paragraph in the end', () => {
    page.deleteNode(blockUri3);
    page.commit();
    assert.deepStrictEqual(page.toJson(), {
      id: pageUri,
      title: "Alice's Profile",
      children: [blockJson1],
    });
    // TODO:
    // expect(page._nodes[blockUri3]).toBe(undefined);
  });
  it('deletes an already-deleted paragraph', () => {
    page.deleteNode(blockUri3);
    page.deleteNode(blockUri3);
    page.commit();
    assert.deepStrictEqual(page.toJson(), {
      id: pageUri,
      title: "Alice's Profile",
      children: [blockJson1],
    });
    // TODO:
    // expect(page._nodes[blockUri3]).toBe(undefined);
  });
  it('deletes a just-inserted paragraph', () => {
    page.insertNodeAfter(blockUri1, blockUri2);
    page.set(blockUri2, { type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' });
    page.deleteNode(blockUri2);
    page.commit();
    assert.deepStrictEqual(page.toJson(), {
      id: pageUri,
      title: "Alice's Profile",
      children: [blockJson1, blockJson3],
    });
    // TODO:
    // expect(page._nodes[blockUri2]).toBe(undefined);
  });
  it('moves a paragraph to a new position', () => {
    page.moveNodeBelow(pageUri, blockUri3);
    page.commit();
    assert.deepStrictEqual(page.toJson(), {
      id: pageUri,
      title: "Alice's Profile",
      children: [blockJson3, blockJson1],
    });
  });
});
