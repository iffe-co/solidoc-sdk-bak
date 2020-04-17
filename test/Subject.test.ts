import { Branch } from '../src/Node';
import { Page } from '../src/Page'
import * as n3 from 'n3';
import * as assert from 'power-assert';

const parser = new n3.Parser();

describe('Paragraph', () => {
  let para: Branch;
  let turtle = `<http://example.org/alice#tag1> a <http://www.solidoc.net/ontologies#Paragraph>;`;
  turtle += ` <http://www.solidoc.net/ontologies#option> '{"name":"alice"}'.`;
  const quads: any[] = parser.parse(turtle);
  let page = new Page('http://example.org/alice', '')

  beforeEach(() => {
      para = <Branch>page.createNode('http://example.org/alice#tag1', 'http://www.solidoc.net/ontologies#Paragraph');
    quads.forEach(quad => para.fromQuad(quad));
  });

  describe('Create Node', () => {

    it('parses from quads', () => {
      assert.equal(para.get('id'), 'http://example.org/alice#tag1')
      assert.equal(para.get('type'), 'http://www.solidoc.net/ontologies#Paragraph')
      assert.equal(para.get('firstChild'), '')
    })

    it('translates to Json', () => {
      assert.deepStrictEqual(para.toJson(), {
        id: 'tag1',
        type: 'http://www.solidoc.net/ontologies#Paragraph',
        children: [],
        name: 'alice'
      });
    });

    it('discards an unknown quad', () => {
      let turtle = '<http://example.org/alice> <http://www.solidoc.net/ontologies#unknown> "abc".';
      let quads = parser.parse(turtle)
      para.fromQuad(quads[0])
      let sparql = para.getSparqlForUpdate('http://example.org/alice#tag1');
      assert.strictEqual(sparql, '')
    });
  });

  describe('Sets and gets', () => {

    it('sets and gets a known property', () => {
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

    it('sets an unknown property', () => {
      para.set({ age: 25 });
      assert.deepStrictEqual(JSON.parse(para.get('option')), {
        name: "alice",
        "age": 25
      })
    })

    it('ignores id and children properties', () => {
      para.set({ id: 'fake id', children: [] });
      let sparql = para.getSparqlForUpdate('http://example.org/alice#tag1');
      assert.strictEqual(sparql, '')
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
    let next: Branch
    beforeEach(() => {
      next = <Branch>page.createNode('http://example.org/alice#tag2', 'http://www.solidoc.net/ontologies#Paragraph');
    })

    it('set("next") is together with setNext()', () => {
      para.set({ "next": "http://example.org/alice#tag2" })
      assert.strictEqual(para.getNext(), next)
    });

    it('setNext() is together with set("next")', () => {
      para.setNext(next)
      assert.strictEqual(para.get("next"), 'http://example.org/alice#tag2');
    });

    it('parses #nextNode from quads and synced with getNext()', () => {
      let turtle = `<http://example.org/alice#tag1> <http://www.solidoc.net/ontologies#nextNode> <http://example.org/alice#tag2>.`;
      let quads = parser.parse(turtle)
      para.fromQuad(quads[0])
      assert.strictEqual(para.getNext(), next)
    })

    it('unsets next', () => {
      para.setNext(next)
      para.commit()
      para.setNext(undefined)
      assert.strictEqual(para.getNext(), undefined)
    })
  });

  describe('performs deletion', () => {

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

    it('generates sparql after deletion', () => {
      para.delete();
      const sparql = para.getSparqlForUpdate('http://example.org/test');
      assert.strictEqual(sparql, 'WITH <http://example.org/test> DELETE { <http://example.org/alice#tag1> ?p ?o } WHERE { <http://example.org/alice#tag1> ?p ?o };\n');
    });

    it('disallows committing a deleted node', () => {
      para.delete();
      try {
        para.commit();
      } catch (e) {
        return;
      }
      assert(0)
    })

    it('commits attributes', () => {
      para.set({ next: 'http://example.org/alice#tag2' })
      para.commit()
      para.undo()
      assert.strictEqual(para.get('next'), 'http://example.org/alice#tag2')
    })

    it('undoes deletion', () => {
      para.delete();
      para.undo();
      assert.strictEqual(para.isDeleted(), false);
    });

    it('undoes attributes', () => {
      para.set({ next: 'http://example.org/alice#tag2' })
      para.delete()
      para.undo()
      assert.strictEqual(para.get('next'), '')
    })

  });
});
