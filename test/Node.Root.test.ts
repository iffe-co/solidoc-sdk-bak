import { Subject } from '../src/Subject';
import { Root, createNode } from '../src/Node';
import { ont } from '../config/ontology'
import { config, turtle } from '../config/test'
import * as assert from 'power-assert';

import * as n3 from 'n3';
const parser = new n3.Parser();

const nodeMap = new Map<string, Subject>();

const page = config.page
const quads: any[] = parser.parse(turtle.page);

describe('Root', () => {
  let root: Root;

  beforeEach(() => {
    root = <Root>createNode(page, nodeMap);
    quads.forEach(quad => root.fromQuad(quad, nodeMap));
  });

  it('parses from quads', () => {
    assert.strictEqual(root.get('id'), page.id)
    assert.strictEqual(root.get('type'), page.type)
    assert.strictEqual(root.get('title'), page.title)
    assert.strictEqual(root.get('firstChild'), page.children[0].id)
  });

  it('translates to Json', () => {
    assert.deepStrictEqual(root.toJson(), {
      ...page,
      children: []
    });
  })

  it('sets title', () => {
    root.set({ title: 'Welcome' })
    assert.strictEqual(root.get('title'), 'Welcome')
  })

  describe('about #nextNode & delete', () => {
    it('throws on parsing #nextNode predicate', () => {
      let turtle = `<${page.id}> <${ont.sdoc.next}> <${config.para[0].id}>.`;
      let quads = parser.parse(turtle)
      try {
        root.fromQuad(quads[0], nodeMap)
      } catch (e) {
        return
      }
      assert(0)
    })
  
    it('throws on setNext(node)', () => {
      let next = new Root(config.para[0].id)
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
  })
});
