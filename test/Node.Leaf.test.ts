import { Leaf, createNode } from '../src/Node';
import { config } from '../config/test'
import * as assert from 'power-assert';

import * as n3 from 'n3';
const parser = new n3.Parser();

const text = config.text[8]
// const page = config.page
const quads: any[] = parser.parse(text.turtle);

describe('Leaf', () => {
  let leaf: Leaf;

  beforeEach(() => {
    leaf = <Leaf>createNode(text.uri, text.type);
    quads.forEach(quad => leaf.fromQuad(quad));
  });

  it('parses from quads', () => {
    assert.strictEqual(leaf.get('uri'), text.uri)
    assert.strictEqual(leaf.get('type'), text.type)
    assert.strictEqual(leaf.get('text'), text.json.text)
  });
  
  it('translate to Json', () => {
    assert.deepStrictEqual(leaf.toJson(), text.json);
  })

  it('inserts text at offset 0', () => {
    leaf.insertText(0, 'Insert: ');
    assert.deepStrictEqual(leaf.toJson(), {
      ...text.json,
      text: 'Insert: text 8'
    });
  });

  it('inserts text at offset > length', () => {
    leaf.insertText(Infinity, '!');
    assert.deepStrictEqual(leaf.toJson(), {
      ...text.json,
      text: 'text 8!'
    });
  });

  it('removes text head', () => {
    let removed: string = leaf.removeText(0, 1);
    assert.deepStrictEqual(leaf.toJson(), {
      ...text.json,
      text: 'ext 8'
    });
    assert.strictEqual(removed, 't')
  });

  it('removes text tail', () => {
    let removed: string = leaf.removeText(1, Infinity);
    assert.deepStrictEqual(leaf.toJson(), {
      ...text.json,
      text: 't'
    });
    assert.strictEqual(removed, 'ext 8')
  });

  it('leaves it unchanged if there is no overlap', () => {
    let removed: string = leaf.removeText(100, 10);
    assert.deepStrictEqual(leaf.toJson(), text.json);
    assert.strictEqual(removed, '')
  });

});
