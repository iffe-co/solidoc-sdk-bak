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
    quads.forEach(quad => root.fromQuad(quad));
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

  it('throws on set({next: <node>})', () => {
    try {
      root.set({ next: 'http://example.org/bob' })
    } catch (e) {
      return
    }
    assert(0)
  })

  it('throws on parsing a quad with nextNode predicate', () => {
    let turtle = '<http://example.org/alice> <http://www.solidoc.net/ontologies#nextNode> <http://example.org/bob>.';
    let quads = parser.parse(turtle)
    try {
      root.fromQuad(quads[0])
    } catch (e) {
      return
    }
    assert(0)
  })

  it('sets title', () => {
    root.set({ title: 'Welcome' })
    let json: any = root.toJson()
    assert(json.title === 'Welcome')
  })

});

