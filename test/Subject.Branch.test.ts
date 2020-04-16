import { Branch } from '../src/Node';
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
