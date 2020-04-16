import { Branch, createNode } from '../src/Node';
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
    para = <Branch>createNode('http://example.org/alice#tag1', 'http://www.solidoc.net/ontologies#Paragraph');
    quads.forEach(quad => para.fromQuad(quad));
  });

  describe('Create Node', () => {

    it('parses from quads', () => {
      assert.equal(para.get('id'), 'http://example.org/alice#tag1')
      assert.equal(para.get('type'), 'http://www.solidoc.net/ontologies#Paragraph')
      assert.equal(para.get('next'), 'http://example.org/alice#tag2');
      assert.equal(para.get('firstChild'), '')
    })

    it('translates to Json', () => {
      assert.deepStrictEqual(para.toJson(), {
        id: 'tag1',
        type: 'http://www.solidoc.net/ontologies#Paragraph',
        children: [],
        name: 'alice'
      });
      assert.strictEqual(para.get('next'), 'http://example.org/alice#tag2');
    });

    it('discards an unknown quad', () => {
      let turtle = '<http://example.org/alice> <http://www.solidoc.net/ontologies#unknown> "abc".';
      let quads = parser.parse(turtle)
      para.fromQuad(quads[0])
    });
  });

  describe('Sets, gets and deletes', () => {

    it('sets and gets the new value ', () => {
      para.set({ type: 'http://www.solidoc.net/ontologies#NumberedList' });
      assert.strictEqual(para.get('type'), 'http://www.solidoc.net/ontologies#NumberedList');
    });

    it('throws on getting an unkown property', () => {
      try {
        para.get('unknown')
      } catch (e) {
        return
      }
      assert(0)
    })

    it('performs deletion', () => {
      assert.strictEqual(para.isDeleted(), false)
      para.delete()
      assert.strictEqual(para.isDeleted(), true)
    });

    it('throws on setting a deleted node', () => {
      para.delete()
      try {
        para.set({ type: 'http://www.solidoc.net/ontologies#NumberedList' });
      } catch (e) {
        return
      }
      assert(0)
    })

  });

  describe('Options', () => {

    it('adds optional property', () => {
      para.set({ age: 25 })
      let paraJson: any = para.toJson();
      assert.strictEqual(paraJson.age, 25);
      // TODO: 
      // const sparql = para.getSparqlForUpdate('http://example.org/test');
    });

    it('deletes optional property', () => {
      para.set({ name: null })
      let paraJson: any = para.toJson();
      assert.strictEqual(paraJson.name, undefined);
      // TODO: 
      // const sparql = para.getSparqlForUpdate('http://example.org/test');
    });

    it('modifies optional property', () => {
      para.set({ name: "bob" })
      let paraJson: any = para.toJson();
      assert.strictEqual(paraJson.name, 'bob');
      // TODO: 
      // const sparql = para.getSparqlForUpdate('http://example.org/test');
    })
  });

  describe('Next', () => {

    it('set("next") is together with setNext()', () => {
    });

    it('setNext() is together with set("next")', () => {
    });
  });

  describe('commits and undoes', () => {

    it('generates sparql after deletion', () => {
      para.delete();
      const sparql = para.getSparqlForUpdate('http://example.org/test');
      assert.strictEqual(sparql, 'WITH <http://example.org/test> DELETE { <http://example.org/alice#tag1> ?p ?o } WHERE { <http://example.org/alice#tag1> ?p ?o };\n');
    });

    it('undoes deletion', () => {
      para.delete();
      para.undo();
      assert.strictEqual(para.isDeleted(), false);
    });

  });
});
