import { Block, PageHead, Leaf } from '../src/Block';
import * as n3 from 'n3';
import * as assert from 'power-assert';

const parser = new n3.Parser();

describe('Paragraph', () => {
  let para: Block;
  let turtle = '<http://example.org/alice#tag1> a <http://www.solidoc.net/ontologies#Paragraph>;';
  turtle += ' <http://www.solidoc.net/ontologies#nextBlock> <http://example.org/alice#tag2>.';
  // turtle += ' <http://www.solidoc.net/ontologies#firstChild> <http://example.org/alice#tag3>.';
  const quads: any[] = parser.parse(turtle);

  beforeEach(() => {
    para = new Block('http://example.org/alice#tag1');
  });
  it('parses quads and converts to readable Json', () => {
    quads.forEach(para.fromQuad);
    assert.deepStrictEqual(para.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Paragraph',
      children: []
    });
    assert(para.get('next'), 'http://example.org/alice#tag2');
  });
  it('sets and gets the new value (uncommited)', () => {
    quads.forEach(para.fromQuad);
    para.set({ next: 'http://example.org/alice#tag3' });
    assert(para.get('next') === 'http://example.org/alice#tag3');
    // assert(para.toJson().next === 'http://example.org/alice#tag2');
  });
  it('generates sparql after deletion', () => {
    quads.forEach(para.fromQuad);
    para.isDeleted = true;
    const sparql = para.getSparqlForUpdate('http://example.org/test');
    assert(sparql === 'WITH <http://example.org/test> DELETE { <http://example.org/alice#tag1> ?p ?o } WHERE { <http://example.org/alice#tag1> ?p ?o };\n');
  });
  it('returns the old value before a deletion is committed', () => {
    quads.forEach(para.fromQuad);
    para.isDeleted = true;

    assert.deepStrictEqual(para.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Paragraph',
      children: [],
    });
    assert(para.get('next') === 'http://example.org/alice#tag2');
  });
});

describe('PageHead', () => {
  let head: PageHead;
  let turtle = '<http://example.org/alice> <http://purl.org/dc/terms/title> "Alice\'s Profile";';
  turtle += ' <http://www.solidoc.net/ontologies#firstChild> <http://example.org/alice#tag1>.';
  const quads: any[] = parser.parse(turtle);

  beforeEach(() => {
    head = new PageHead('http://example.org/alice');
  });
  it('parses from quads', () => {
    quads.forEach(head.fromQuad);
    assert.deepStrictEqual(head.toJson(), {
      id: 'http://example.org/alice',
      title: "Alice's Profile",
      children: [],
    });
    assert(head.get('child') === 'http://example.org/alice#tag1');
  });
});

describe('Leaf', () => {
  let leaf: Leaf;
  let turtle = '<http://example.org/alice#tag1> a <http://www.solidoc.net/ontologies#Leaf>;';
  turtle += ' <http://www.solidoc.net/ontologies#nextBlock> <http://example.org/alice#tag2>;';
  turtle += ' <http://www.solidoc.net/ontologies#text> "Hello world!".';
  const quads: any[] = parser.parse(turtle);

  beforeEach(() => {
    leaf = new Leaf('http://example.org/alice#tag1');
  });
  it('parses from quads', () => {
    quads.forEach(leaf.fromQuad);
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: "Hello world!",
    });
    assert(leaf.get('next') === 'http://example.org/alice#tag2');
  });
});
