import { Subject } from '../src/Subject';
import { Leaf, createNode } from '../src/Node';
import { config, turtle } from '../config/test'
import * as assert from 'power-assert';

import * as n3 from 'n3';
const parser = new n3.Parser();
const nodeMap = new Map<string, Subject>();


const text = config.text[8]
// const page = config.page
const quads: any[] = parser.parse(turtle.text[8]);

describe('Leaf', () => {
  let leaf: Leaf;

  beforeEach(() => {
    nodeMap.clear()
    leaf = <Leaf>createNode(text, nodeMap);
    quads.forEach(quad => leaf.fromQuad(quad));
  });

  it('parses from quads', () => {
    assert.strictEqual(leaf.get('id'), text.id)
    assert.strictEqual(leaf.get('type'), text.type)
    assert.strictEqual(leaf.get('text'), text.text)
  });
  
  it('translate to Json', () => {
    assert.deepStrictEqual(leaf.toJson(), text);
  })

});
