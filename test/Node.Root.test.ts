import { Root } from '../src/Node';
import { Page } from '../src/Page'
import * as n3 from 'n3';
import * as assert from 'power-assert';

const parser = new n3.Parser();

let turtle = '<http://example.org/alice> a <http://www.solidoc.net/ontologies#Root>;';
turtle += ' <http://purl.org/dc/terms/title> "Alice\'s Profile";';
turtle += ' <http://www.solidoc.net/ontologies#firstChild> <http://example.org/alice#tag1>.';
const quads: any[] = parser.parse(turtle);

describe('Root', () => {
  let root: Root;
  let page = new Page('http://example.org/alice', '')

  beforeEach(() => {
    root = <Root>page.createNode('http://example.org/alice', 'http://www.solidoc.net/ontologies#Root');
    quads.forEach(quad => root.fromQuad(quad));
  });


  it('parses from quads', () => {
    assert.strictEqual(root.get('id'), 'http://example.org/alice')
    assert.strictEqual(root.get('type'), 'http://www.solidoc.net/ontologies#Root')
    assert.strictEqual(root.get('title'), "Alice's Profile")
    assert.strictEqual(root.get('firstChild'), 'http://example.org/alice#tag1')
  });

  it('translates to Json', () => {
    assert.deepStrictEqual(root.toJson(), {
      id: 'http://example.org/alice',
      type: 'http://www.solidoc.net/ontologies#Root',
      title: "Alice's Profile",
      children: [],
    });

  })

  it('sets title', () => {
    root.set({ title: 'Welcome' })
    assert.strictEqual(root.get('title'), 'Welcome')
    let json: any = root.toJson()
    assert.strictEqual(json.title, 'Welcome')
  })

  it('throws on parsing #nextNode predicate', () => {
    let turtle = '<http://example.org/alice> <http://www.solidoc.net/ontologies#nextNode> <http://example.org/bob>.';
    let quads = parser.parse(turtle)
    try {
      root.fromQuad(quads[0])
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

  it('throws on setNext()', () => {
    let next = new Root('http://example.org/bob', page)
    try {
      root.setNext(next)
    } catch (e) {
      return
    }
    assert(0)
  })

  it('disallows deletion', () => {
    try {
      root.delete();
    } catch (e) {
      return
    }
    assert(0)
  })

});
