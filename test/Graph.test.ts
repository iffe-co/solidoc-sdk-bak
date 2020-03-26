// import Graph from '../../../../app/data_model/ldp/Graph';
import * as assert from 'power-assert';
import Page from '../src/Page';

describe('Page', () => {
  let page: Page;
  let turtle = '<http://example.org/alice/a> <http://purl.org/dc/terms/title> "Alice\'s Profile";';
  turtle += ' <http://www.solidoc.net/ontologies#NextParagraph> <http://example.org/alice/a#tag1>.';
  turtle += '<http://example.org/alice/a#tag1> a <http://www.solidoc.net/ontologies#Paragraph>;';
  turtle += ' <http://www.solidoc.net/ontologies#NextParagraph> <http://example.org/alice/b>;';
  turtle += ' <http://www.solidoc.net/ontologies#Content> "Paragraph 1".';
  turtle += '<http://example.org/alice/b> a <http://www.solidoc.net/ontologies#SolidPage>.';

  beforeEach(() => {
    page = new Page('http://example.org/alice/a');
  });
  it('parses from quads', () => {
    page.fromTurtle(turtle);
    assert.deepStrictEqual(page.toJson(), {
      id: 'http://example.org/alice/a',
      title: "Alice's Profile",
      paragraphs: [
        { id: 'tag1', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Paragraph 1' },
        { id: 'http://example.org/alice/b', type: 'http://www.solidoc.net/ontologies#SolidPage', content: '' },
      ],
    });
  });
  it('inserts a paragraph to the head', () => {
    page.fromTurtle(turtle);
    page.insertNode('http://example.org/alice/a#tag2', 'http://example.org/alice/a');
    page.set('http://example.org/alice/a#tag2', { type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' });
    assert.deepStrictEqual(page.toJson(), {
      id: 'http://example.org/alice/a',
      title: "Alice's Profile",
      paragraphs: [
        { id: 'tag1', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Paragraph 1' },
        { id: 'http://example.org/alice/b', type: 'http://www.solidoc.net/ontologies#SolidPage', content: '' },
      ],
    });
    page.commit();
    assert.deepStrictEqual(page.toJson(), {
      id: 'http://example.org/alice/a',
      title: "Alice's Profile",
      paragraphs: [
        { id: 'tag2', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' },
        { id: 'tag1', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Paragraph 1' },
        { id: 'http://example.org/alice/b', type: 'http://www.solidoc.net/ontologies#SolidPage', content: '' },
      ],
    });
  });
  it('inserts a paragraph in the middle', () => {
    page.fromTurtle(turtle);
    page.insertNode('http://example.org/alice/a#tag2', 'http://example.org/alice/a#tag1');
    page.set('http://example.org/alice/a#tag2', { type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' });
    page.commit();
    assert.deepStrictEqual(page.toJson(), {
      id: 'http://example.org/alice/a',
      title: "Alice's Profile",
      paragraphs: [
        { id: 'tag1', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Paragraph 1' },
        { id: 'tag2', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' },
        { id: 'http://example.org/alice/b', type: 'http://www.solidoc.net/ontologies#SolidPage', content: '' },
      ],
    });
  });
  it('inserts a paragraph to the end', () => {
    page.fromTurtle(turtle);
    page.insertNode('http://example.org/alice/a#tag2', 'http://example.org/alice/b');
    page.set('http://example.org/alice/a#tag2', { type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' });
    page.commit();
    assert.deepStrictEqual(page.toJson(), {
      id: 'http://example.org/alice/a',
      title: "Alice's Profile",
      paragraphs: [
        { id: 'tag1', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Paragraph 1' },
        { id: 'http://example.org/alice/b', type: 'http://www.solidoc.net/ontologies#SolidPage', content: '' },
        { id: 'tag2', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' },
      ],
    });
  });
  it('deletes a paragraph in the middle', () => {
    page.fromTurtle(turtle);
    page.deleteNode('http://example.org/alice/a#tag1');
    page.commit();
    assert.deepStrictEqual(page.toJson(), {
      id: 'http://example.org/alice/a',
      title: "Alice's Profile",
      paragraphs: [
        { id: 'http://example.org/alice/b', type: 'http://www.solidoc.net/ontologies#SolidPage', content: '' },
      ],
    });
    // TODO:
    // assert(page._nodes['http://example.org/alice/a#tag1']===undefined);
  });
  it('deletes a paragraph in the end', () => {
    page.fromTurtle(turtle);
    page.deleteNode('http://example.org/alice/b');
    page.commit();
    assert.deepStrictEqual(page.toJson(), {
      id: 'http://example.org/alice/a',
      title: "Alice's Profile",
      paragraphs: [
        { id: 'tag1', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Paragraph 1' },
      ],
    });
    // TODO:
    // expect(page._nodes['http://example.org/alice/b']).toBe(undefined);
  });
  it('deletes an already-deleted paragraph', () => {
    page.fromTurtle(turtle);
    page.deleteNode('http://example.org/alice/b');
    page.deleteNode('http://example.org/alice/b');
    page.commit();
    assert.deepStrictEqual(page.toJson(), {
      id: 'http://example.org/alice/a',
      title: "Alice's Profile",
      paragraphs: [
        { id: 'tag1', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Paragraph 1' },
      ],
    });
    // TODO:
    // expect(page._nodes['http://example.org/alice/b']).toBe(undefined);
  });
  it('deletes a just-inserted paragraph', () => {
    page.fromTurtle(turtle);
    page.insertNode('http://example.org/alice/a#tag2', 'http://example.org/alice/a#tag1');
    page.set('http://example.org/alice/a#tag2', { type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Inserted paragraph' });
    page.deleteNode('http://example.org/alice/a#tag2');
    page.commit();
    assert.deepStrictEqual(page.toJson(), {
      id: 'http://example.org/alice/a',
      title: "Alice's Profile",
      paragraphs: [
        { id: 'tag1', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Paragraph 1' },
        { id: 'http://example.org/alice/b', type: 'http://www.solidoc.net/ontologies#SolidPage', content: '' },
      ],
    });
    // TODO:
    // expect(page._nodes['http://example.org/alice/a#tag2']).toBe(undefined);
  });
  it('moves a paragraph to a new position', () => {
    page.fromTurtle(turtle);
    page.moveNode('http://example.org/alice/b', 'http://example.org/alice/a');
    page.commit();
    assert.deepStrictEqual(page.toJson(), {
      id: 'http://example.org/alice/a',
      title: "Alice's Profile",
      paragraphs: [
        { id: 'http://example.org/alice/b', type: 'http://www.solidoc.net/ontologies#SolidPage', content: '' },
        { id: 'tag1', type: 'http://www.solidoc.net/ontologies#Paragraph', content: 'Paragraph 1' },
      ],
    });
  });
});
