import { Branch, Root, Leaf } from '../src/Node';
import * as n3 from 'n3';
import * as assert from 'power-assert';

const parser = new n3.Parser();

describe('Paragraph', () => {
  let para: Branch;
  let turtle = `<http://example.org/alice#tag1> a <http://www.solidoc.net/ontologies#Paragraph>;`;
  turtle += ` <http://www.solidoc.net/ontologies#nextNode> <http://example.org/alice#tag2>;`;
  turtle += ` <http://www.solidoc.net/ontologies#option> '{"name":"alice"}'.`;
  const quads: any[] = parser.parse(turtle);

  beforeEach(() => {
    para = new Branch('http://example.org/alice#tag1');
    quads.forEach(para.fromQuad);
  });
  it('parses quads and converts to readable Json', () => {
    assert.deepStrictEqual(para.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Paragraph',
      children: [],
      name: 'alice'
    });
    assert(para.get('next'), 'http://example.org/alice#tag2');
  });
  it('sets and gets the new value (uncommited)', () => {
    para.set({ type: 'http://www.solidoc.net/ontologies#NumberedList' });
    assert(para.get('type') === 'http://www.solidoc.net/ontologies#NumberedList');
  });
  it('generates sparql after deletion', () => {
    para.delete();
    const sparql = para.getSparqlForUpdate('http://example.org/test');
    assert(sparql === 'WITH <http://example.org/test> DELETE { <http://example.org/alice#tag1> ?p ?o } WHERE { <http://example.org/alice#tag1> ?p ?o };\n');
  });
  it('undoes deletion', () => {
    para.delete();
    para.undo();
    assert(!para.isDeleted());
  });
  it('modifies optional property', () => {
    para.set({ name: "bob" })
    let paraJson: any = para.toJson();
    assert(paraJson.name === 'bob');
    // TODO: 
    // const sparql = para.getSparqlForUpdate('http://example.org/test');
  })
  it('adds optional property', () => {
    para.set({ age: 25 })
    let paraJson: any = para.toJson();
    assert(paraJson.age === 25);
    // TODO: 
    // const sparql = para.getSparqlForUpdate('http://example.org/test');
  })
  it('deletes optional property', () => {
    para.set({ name: null })
    let paraJson: any = para.toJson();
    assert(paraJson.name === undefined);
    // TODO: 
    // const sparql = para.getSparqlForUpdate('http://example.org/test');
  })
});

describe('Root', () => {
  let root: Root;
  let turtle = '<http://example.org/alice> a <http://www.solidoc.net/ontologies#Root>;';
  turtle += ' <http://purl.org/dc/terms/title> "Alice\'s Profile";';
  turtle += ' <http://www.solidoc.net/ontologies#firstChild> <http://example.org/alice#tag1>.';
  const quads: any[] = parser.parse(turtle);

  beforeEach(() => {
    root = new Root('http://example.org/alice');
    quads.forEach(root.fromQuad);
  });
  it('parses from quads', () => {
    assert.deepStrictEqual(root.toJson(), {
      id: 'http://example.org/alice',
      type: 'http://www.solidoc.net/ontologies#Root',
      title: "Alice's Profile",
      children: [],
    });
    assert(root.get('firstChild') === 'http://example.org/alice#tag1');
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
    quads.forEach(leaf.fromQuad);
  });
  it('parses from quads', () => {
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: "Hello world!",
    });
    assert(leaf.get('next') === 'http://example.org/alice#tag2');
  });
  it('adds a boolean property', () => {
    leaf.set({ bold: true });
    let leafJson: any = leaf.toJson();
    assert(leafJson.bold === true);
    // TODO: sparql
  });
  it('inserts text at offset 0', () => {
    leaf.insertText(0, 'Alice says: ');
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: "Alice says: Hello world!",
    });
  });
  it('inserts text at offset > length', () => {
    leaf.insertText(100, '!');
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: "Hello world!!",
    });
  });
  it('removes text head', () => {
    let removed: string = leaf.removeText(0, 6);
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: 'world!',
    });
    assert(removed === 'Hello ')
  });
  it('removes text tail', () => {
    let removed: string = leaf.removeText(1, Infinity);
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: 'H',
    });
    assert(removed === 'ello world!')
  });
  it('leaves it unchanged if there is no overlap', () => {
    let removed: string = leaf.removeText(Infinity, 10);
    assert.deepStrictEqual(leaf.toJson(), {
      id: 'tag1',
      type: 'http://www.solidoc.net/ontologies#Leaf',
      text: 'Hello world!',
    });
    assert(removed === '')
  });
});
