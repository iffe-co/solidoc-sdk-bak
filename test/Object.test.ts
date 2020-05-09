import { Object } from '../src/Object';
import { config as cfg, turtle } from '../config/test';
import * as assert from 'power-assert';

import * as n3 from 'n3';
import { ont } from '../config/ontology';
const parser = new n3.Parser();
const quads: any[] = parser.parse(turtle.text[8]);

describe('NamedNode Object', () => {
  const target: Object = {
    value: cfg.text[8].type,
    type: ont.xsd.anyURI,
  };

  it('constructs a NamedNode object from quad', () => {
    const obj: Object = Object.fromQuad(quads[0].object);

    assert.deepStrictEqual(obj, target);
  });

  it('sets value of a NamedNode object', () => {
    const obj: Object = Object.fromValue(ont.xsd.anyURI, cfg.text[8].type);

    assert.deepStrictEqual(obj, target);
  });

  it('sets value of an undefined NamedNode object', () => {
    const obj: Object = Object.fromValue(ont.xsd.anyURI, undefined);

    assert.deepStrictEqual(obj, {
      ...target,
      value: undefined,
    });
  });

  it('escapes value of a NamedNode object', () => {
    assert.strictEqual(Object.escape(target), '<' + cfg.text[8].type + '>');
  });

  it('throws on unknown data type', () => {
    const obj = { id: `"100"^^` };
    assert.throws(() => {
      Object.fromQuad(obj);
    }, /^Error: Unknown data type/);
  });
});

describe('Text Object', () => {
  const target: Object = {
    value: cfg.text[8].text,
    type: ont.xsd.string,
  };

  it('constructs a text object from quad', () => {
    const obj: Object = Object.fromQuad(quads[1].object);

    assert.deepStrictEqual(obj, target);
  });

  it('sets value of a text object', () => {
    const obj: Object = Object.fromValue(ont.xsd.string, cfg.text[8].text);

    assert.deepStrictEqual(obj, target);
  });

  it('escapes value of a text object', () => {
    assert.strictEqual(Object.escape(target), '"text 8"');
  });
});

describe('Boolean Object', () => {
  const target: Object = {
    value: cfg.text[8].bold,
    type: ont.xsd.boolean,
  };

  it('constructs a boolean object from quad', () => {
    const obj: Object = Object.fromQuad(quads[2].object);

    assert.deepStrictEqual(obj, target);
  });

  it('sets value of a boolean object', () => {
    const obj: Object = Object.fromValue(ont.xsd.anyURI, cfg.text[8].bold);

    assert.deepStrictEqual(obj, target);
  });

  it('escapes value of a boolean object', () => {
    assert.strictEqual(Object.escape(target), '"true"^^' + ont.xsd.boolean);
  });
});
