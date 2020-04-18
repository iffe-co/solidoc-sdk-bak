import { Root, createNode } from '../src/Node';
import { ont } from '../config/ontology'
import { config } from '../config/test'
import * as assert from 'power-assert';

import * as n3 from 'n3';
const parser = new n3.Parser();

const page = config.page
const quads: any[] = parser.parse(page.turtle);

describe('Root', () => {
  let root: Root;

  beforeEach(() => {
    root = <Root>createNode(page.uri, page.type);
    quads.forEach(quad => root.fromQuad(quad));
  });

  it('parses from quads', () => {
    assert.strictEqual(root.get('uri'), page.uri)
    assert.strictEqual(root.get('type'), page.type)
    assert.strictEqual(root.get('title'), page.json.title)
    assert.strictEqual(root.get('firstChild'), page.json.children[0].uri)
  });

  it('translates to Json', () => {
    assert.deepStrictEqual(root.toJson(), {
      ...page.json,
      children: []
    });
  })

  it('sets title', () => {
    root.set({ title: 'Welcome' })
    assert.strictEqual(root.get('title'), 'Welcome')
  })

  it('throws on parsing #nextNode predicate', () => {
    let turtle = `<${page.uri}> <${ont.sdoc.next}> <${config.para[0].uri}>.`;
    let quads = parser.parse(turtle)
    try {
      root.fromQuad(quads[0])
    } catch (e) {
      return
    }
    assert(0)
  })

  it('throws on setNext(node)', () => {
    let next = new Root(config.para[0].uri)
    try {
      root.setNext(next)
    } catch (e) {
      return
    }
    assert(0)
  })

  it('is ok to setNext(undefined)', () => {
    root.setNext(undefined)
    assert.strictEqual(root.getNext(), undefined)
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
