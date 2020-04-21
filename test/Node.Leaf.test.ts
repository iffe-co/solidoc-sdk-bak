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
    leaf = <Leaf>createNode(text, nodeMap);
    quads.forEach(quad => leaf.fromQuad(quad, nodeMap));
  });

  it('parses from quads', () => {
    assert.strictEqual(leaf.get('id'), text.id)
    assert.strictEqual(leaf.get('type'), text.type)
    assert.strictEqual(leaf.get('text'), text.text)
  });
  
  it('translate to Json', () => {
    assert.deepStrictEqual(leaf.toJson(), text);
  })

  it('translate to blank Json', () => {
    assert.deepStrictEqual(leaf.toBlankJson().text, '');
  })

  it('inserts text at offset 0', () => {
    leaf.attachChildren('Insert: ', 0);
    assert.deepStrictEqual(leaf.toJson(), {
      ...text,
      text: 'Insert: text 8'
    });
  });

  it('inserts text at offset > length', () => {
    leaf.attachChildren('!', Infinity);
    assert.deepStrictEqual(leaf.toJson(), {
      ...text,
      text: 'text 8!'
    });
  });

  it('removes text head', () => {
    let removed: string = leaf.detachChildren(0, 1);
    assert.deepStrictEqual(leaf.toJson(), {
      ...text,
      text: 'ext 8'
    });
    assert.strictEqual(removed, 't')
  });

  it('removes text tail', () => {
    let removed: string = leaf.detachChildren(1, Infinity);
    assert.deepStrictEqual(leaf.toJson(), {
      ...text,
      text: 't'
    });
    assert.strictEqual(removed, 'ext 8')
  });

  it('leaves it unchanged if there is no overlap', () => {
    let removed: string = leaf.detachChildren(100, 10);
    assert.deepStrictEqual(leaf.toJson(), text);
    assert.strictEqual(removed, '')
  });

});
