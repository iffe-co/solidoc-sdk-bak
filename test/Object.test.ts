/* eslint-disable no-undef */
import { Object } from '../src/Object';
import { config as cfg, turtle } from './test.config';
import * as assert from 'power-assert';

import * as n3 from 'n3';
import { ont } from '../config/ontology';
const parser = new n3.Parser();
const quads: any[] = parser.parse(turtle.text[0]);

describe('NamedNode Object', () => {
  const target: Object = {
    value: cfg.text[1].id,
    type: ont.xsd.anyURI,
  };

  it('constructs a NamedNode object from quad', () => {
    const obj: Object = Object.fromQuad(quads[1].object);

    assert.deepStrictEqual(obj, target);
  });

  it('sets value of a NamedNode object', () => {
    const obj: Object = Object.fromValue(ont.xsd.anyURI, cfg.text[1].id);

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
    assert.strictEqual(Object.escape(target), '<' + cfg.text[1].id + '>');
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
    value: cfg.text[0].text,
    type: ont.xsd.string,
  };

  it('constructs a text object from quad', () => {
    const obj: Object = Object.fromQuad(quads[2].object);

    assert.deepStrictEqual(obj, target);
  });

  it('sets value of a text object', () => {
    const obj: Object = Object.fromValue(ont.xsd.string, cfg.text[0].text);

    assert.deepStrictEqual(obj, target);
  });

  it('escapes value of a text object', () => {
    assert.strictEqual(Object.escape(target), '"text 0"');
  });
});

describe('Boolean Object', () => {
  const target: Object = {
    value: cfg.text[0].bold,
    type: ont.xsd.boolean,
  };

  it('constructs a boolean object from quad', () => {
    const obj: Object = Object.fromQuad(quads[3].object);

    assert.deepStrictEqual(obj, target);
  });

  it('sets value of a boolean object', () => {
    const obj: Object = Object.fromValue(ont.xsd.anyURI, cfg.text[0].bold);

    assert.deepStrictEqual(obj, target);
  });

  it('escapes value of a boolean object', () => {
    assert.strictEqual(Object.escape(target), '"1"^^<' + ont.xsd.boolean + '>');
  });
});
