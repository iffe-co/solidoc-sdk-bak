import { Leaf, createNode } from '../src/Node';
import * as n3 from 'n3';
import * as assert from 'power-assert';

const parser = new n3.Parser();

describe('Leaf', () => {
  let leaf: Leaf;
  let turtle = '<http://example.org/alice#text1> a <http://www.solidoc.net/ontologies#Leaf>;';
  turtle += ' <http://www.solidoc.net/ontologies#nextNode> <http://example.org/alice#text2>;';
  turtle += ' <http://www.solidoc.net/ontologies#text> "Hello world!".';
  const quads: any[] = parser.parse(turtle);

  beforeEach(() => {
    leaf = <Leaf>createNode('http://example.org/alice#text1', 'http://www.solidoc.net/ontologies#Leaf');
    quads.forEach(quad => leaf.fromQuad(quad));
  });

  it('parses from quads', () => {
    assert.strictEqual(leaf.get('id'), 'http://example.org/alice#text1')
    assert.strictEqual(leaf.get('type'), 'http://www.solidoc.net/ontologies#Leaf')
    assert.strictEqual(leaf.get('next'), 'http://example.org/alice#text2');
    assert.strictEqual(leaf.get('text'), 'Hello world!')
  });
  
  it('translate to Json', () => {
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'text1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: "Hello world!",
    });
  })

  it('inserts text at offset 0', () => {
    leaf.insertText(0, 'Alice says: ');
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'text1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: "Alice says: Hello world!",
    });
  });

  it('inserts text at offset > length', () => {
    leaf.insertText(100, '!');
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'text1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: "Hello world!!",
    });
  });

  it('removes text head', () => {
    let removed: string = leaf.removeText(0, 6);
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'text1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: 'world!',
    });
    assert.strictEqual(removed, 'Hello ')
  });

  it('removes text tail', () => {
    let removed: string = leaf.removeText(1, Infinity);
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'text1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: 'H',
    });
    assert.strictEqual(removed, 'ello world!')
  });

  it('leaves it unchanged if there is no overlap', () => {
    let removed: string = leaf.removeText(Infinity, 10);
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'text1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: 'Hello world!',
    });
    assert.strictEqual(removed, '')
  });

});
