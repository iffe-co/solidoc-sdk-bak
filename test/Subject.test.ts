import { Branch, Root, Leaf } from '../src/Block';
import * as n3 from 'n3';
import * as assert from 'power-assert';

const parser = new n3.Parser();

describe('Paragraph', () => {
  let para: Branch;
  let turtle = '<http://example.org/alice#tag1> a <http://www.solidoc.net/ontologies#Paragraph>;';
  turtle += ' <http://www.solidoc.net/ontologies#nextNode> <http://example.org/alice#tag2>.';
  // turtle += ' <http://www.solidoc.net/ontologies#firstChild> <http://example.org/alice#tag3>.';
  const quads: any[] = parser.parse(turtle);

  beforeEach(() => {
    para = new Branch('http://example.org/alice#tag1');
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
  });
  it('generates sparql after deletion', () => {
    quads.forEach(para.fromQuad);
    para.isDeleted = true;
    const sparql = para.getSparqlForUpdate('http://example.org/test');
    assert(sparql === 'WITH <http://example.org/test> DELETE { <http://example.org/alice#tag1> ?p ?o } WHERE { <http://example.org/alice#tag1> ?p ?o };\n');
  });
  it('undoes deletion', () => {
    quads.forEach(para.fromQuad);
    para.isDeleted = true;
    para.undo();
    assert(!para.isDeleted);
  });
});

describe('Root', () => {
  let root: Root;
  let turtle = '<http://example.org/alice> a <http://www.solidoc.net/ontologies#Root>;';
  turtle += ' <http://purl.org/dc/terms/title> "Alice\'s Profile";';
  turtle += ' <http://www.solidoc.net/ontologies#firstChild> <http://example.org/alice#tag1>.';
  const quads: any[] = parser.parse(turtle);

  beforeEach(() => {
    root = new Root('http://example.org/alice');
  });
  it('parses from quads', () => {
    quads.forEach(root.fromQuad);
    assert.deepStrictEqual(root.toJson(), {
      id: 'http://example.org/alice',
      type: 'http://www.solidoc.net/ontologies#Root',
      title: "Alice's Profile",
      children: [],
    });
    assert(root.get('child') === 'http://example.org/alice#tag1');
  });
});

describe('Leaf', () => {
  let leaf: Leaf;
  let turtle = '<http://example.org/alice#tag1> a <http://www.solidoc.net/ontologies#Leaf>;';
  turtle += ' <http://www.solidoc.net/ontologies#nextNode> <http://example.org/alice#tag2>;';
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
