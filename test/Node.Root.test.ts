import { Subject } from '../src/Subject';
import { Root, createNode, } from '../src/Node';
import { ont } from '../config/ontology'
import { config } from '../config/test'
import * as assert from 'power-assert';

import * as n3 from 'n3';
const parser = new n3.Parser();

const nodeMap = new Map<string, Subject>();

const page = config.page

describe('Root', () => {
  let root: Root;

  beforeEach(() => {
    nodeMap.clear()
    root = <Root>createNode(page, nodeMap);
  });


  it('sets title', () => {
    root.set({ title: 'Welcome' })

    assert.strictEqual(root.get('title'), 'Welcome')
  })

  it('throws on parsing #nextNode predicate', () => {
    let turtle = `<${page.id}> <${ont.sdoc.next}> <${config.para[0].id}>.`;
    let quads = parser.parse(turtle)

    assert.throws(() => {
      root.fromQuad(quads[0])
    })
  })

  it('throws on set("next")', () => {
    assert.throws(() => {
      root.set({next: config.para[0].id})
    });
  })

  it('disallows deletion', () => {
    assert.throws(() => {
      root.delete()
    })
  })

});
