import { Root } from '../src/Node';
import * as n3 from 'n3';
import * as assert from 'power-assert';

const parser = new n3.Parser();

describe('Root', () => {
  let root: Root;
  let turtle = '<http://example.org/alice> a <http://www.solidoc.net/ontologies#Root>;';
  turtle += ' <http://purl.org/dc/terms/title> "Alice\'s Profile";';
  turtle += ' <http://www.solidoc.net/ontologies#firstChild> <http://example.org/alice#tag1>.';
  const quads: any[] = parser.parse(turtle);

  beforeEach(() => {
    root = new Root('http://example.org/alice');
    quads.forEach(root.fromQuad);
  });

  it('parses from quads', () => {
    assert.deepStrictEqual(root.toJson(), {
      id: 'http://example.org/alice',
      type: 'http://www.solidoc.net/ontologies#Root',
      title: "Alice's Profile",
      children: [],
    });
    assert(root.get('firstChild') === 'http://example.org/alice#tag1');
    assert(root.getChildrenNum() === 0) // setting the children[] is not in node construction
  });

  it('disallows deletion', () => {
    try {
      root.delete();
    } catch (e) {
      return
    }
    assert(0)
  })

  it('throws on setNext()', () => {
    let next = new Root('http://example.org/bob')
    try {
      root.setNext(next)
    } catch (e) {
      return
    }
    assert(0)
  })

});

