import { Leaf } from '../src/Node';
import * as n3 from 'n3';
import * as assert from 'power-assert';

const parser = new n3.Parser();

describe('Leaf', () => {
  let leaf: Leaf;
  let turtle = '<http://example.org/alice#tag1> a <http://www.solidoc.net/ontologies#Leaf>;';
  turtle += ' <http://www.solidoc.net/ontologies#nextNode> <http://example.org/alice#tag2>;';
  turtle += ' <http://www.solidoc.net/ontologies#text> "Hello world!".';
  const quads: any[] = parser.parse(turtle);

  beforeEach(() => {
    leaf = new Leaf('http://example.org/alice#tag1');
    quads.forEach(leaf.fromQuad);
  });
  it('parses from quads', () => {
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: "Hello world!",
    });
    assert(leaf.get('next') === 'http://example.org/alice#tag2');
  });
  it('adds a boolean property', () => {
    leaf.set({ bold: true });
    let leafJson: any = leaf.toJson();
    assert(leafJson.bold === true);
    // TODO: sparql
  });
  it('inserts text at offset 0', () => {
    leaf.insertText(0, 'Alice says: ');
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: "Alice says: Hello world!",
    });
  });
  it('inserts text at offset > length', () => {
    leaf.insertText(100, '!');
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: "Hello world!!",
    });
  });
  it('removes text head', () => {
    let removed: string = leaf.removeText(0, 6);
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: 'world!',
    });
    assert(removed === 'Hello ')
  });
  it('removes text tail', () => {
    let removed: string = leaf.removeText(1, Infinity);
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: 'H',
    });
    assert(removed === 'ello world!')
  });
  it('leaves it unchanged if there is no overlap', () => {
    let removed: string = leaf.removeText(Infinity, 10);
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: 'Hello world!',
    });
    assert(removed === '')
  });
});
