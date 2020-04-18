import { Branch, createNode } from '../src/Node';
import { ont } from '../config/ontology'
import { config } from '../config/test'
import * as assert from 'power-assert';

import * as n3 from 'n3';
const parser = new n3.Parser();

const node0 = config.para[0]
const node1 = config.para[1]
const node2 = config.para[2]
const page = config.page

describe('Paragraph', () => {
  // let para0: Branch;
  let para1: Branch;
  let para2: Branch;
  let quads: any[];

  beforeEach(() => {
    para2 = <Branch>createNode(node2.uri, node2.type);
    quads = parser.parse(node2.turtle);
    quads.forEach(quad => para2.fromQuad(quad));
  });

  describe('Create Node', () => {

    it('parses from quads', () => {
      assert.equal(para2.get('uri'), node2.uri)
      assert.equal(para2.get('type'), node2.type)
      assert.equal(para2.get('next'), '')
      assert.equal(para2.get('firstChild'), node2.json.children[0].uri)
    })

    it('translates to Json', () => {
      assert.deepStrictEqual(para2.toJson(), {
        ...node2.json,
        children: []
      });
    });

    it('discards an unknown quad', () => {
      let turtle = `<${node2.uri}> <${ont.sdoc.text}> "abc".`;
      let quads = parser.parse(turtle)
      para2.fromQuad(quads[0])
      let sparql = para2.getSparqlForUpdate(page.uri);
      assert.strictEqual(sparql, '')
    });
  });

  describe('Sets and gets', () => {

    it('sets and gets a known property', () => {
      para2.set({ type: ont.sdoc.numberedList });
      assert.strictEqual(para2.get('type'), ont.sdoc.numberedList);
    });

    it('throws on getting an unkown property', () => {
      try {
        para2.get('unknown')
      } catch (e) {
        return
      }
      assert(0)
    })

    it('ignores id and children properties', () => {
      para2.set({ id: 'fake id', children: ['something'] });
      let sparql = para2.getSparqlForUpdate(page.uri);
      assert.strictEqual(sparql, '')
    })

    it('adds an optional property', () => {
      para2.set({ author: 'alice' });
      assert.deepStrictEqual(JSON.parse(para2.get('option')), {
        author: "alice",
      })
    })

    it('deletes optional property', () => {
      para2.set({ author: "alice" })
      para2.commit()
      para2.set({ author: null })
      let json: any = para2.toJson();
      assert.strictEqual(json.author, undefined);
      assert.strictEqual(para2.get('option'), '{}')
    });

    it('modifies optional property', () => {
      para2.set({ author: "alice" })
      para2.commit()
      para2.set({ author: "bob" })
      let json: any = para2.toJson();
      assert.strictEqual(json.author, 'bob');
    })
  });

  describe('#nextNode property', () => {
    beforeEach(() => {
      para1 = <Branch>createNode(node1.uri, node1.type);
    })

    it('setNext() is together with set("next")', () => {
      para1.setNext(para2)
      assert.strictEqual(para1.get("next"), para2.get('uri'));
    });

    it('disallows set("next")', () => {
      try {
        para1.set({ "next": para2.get('uri') })
      } catch (e) {
        return
      }
      assert(0)
    });

    it('parses #nextNode from quads and synced with getNext()', () => {
      let quads = parser.parse(node1.turtle)
      // note the index of quads
      para1.fromQuad(quads[1], para2)
      assert.strictEqual(para1.getNext(), para2)
    })

    it('throws if #nextNode without next', () => {
      let quads = parser.parse(node1.turtle)
      try {
        // note the index of quads
        para1.fromQuad(quads[1])
      } catch (e) {
        return
      }
      assert(0)
    })

    it('throws if #nextNode inconsistent with next', () => {
      let quads = parser.parse(node1.turtle)
      // note the index of quads
      quads[1].object.id = node0.uri
      try {
        para1.fromQuad(quads[1], para2)
      } catch (e) {
        return
      }
      assert(0)
    })

    it('unsets next', () => {
      para1.setNext(para2)
      para1.commit()
      para1.setNext(undefined)
      assert.strictEqual(para1.getNext(), undefined)
    })
  });

  describe('performs deletion', () => {

    it('performs deletion', () => {
      assert.strictEqual(para2.isDeleted(), false)
      para2.delete()
      assert.strictEqual(para2.isDeleted(), true)
    });

    it('throws on setting a deleted node', () => {
      para2.delete()
      try {
        para2.set({ type: ont.sdoc.numberedList });
      } catch (e) {
        return
      }
      assert(0)
    })

    it('generates sparql after deletion', () => {
      para2.delete();
      const sparql = para2.getSparqlForUpdate(page.uri);
      assert.strictEqual(sparql, `WITH <${page.uri}> DELETE { <${node2.uri}> ?p ?o } WHERE { <${node2.uri}> ?p ?o };\n`);
    });

    it('disallows committing a deleted node', () => {
      para2.delete();
      try {
        para2.commit();
      } catch (e) {
        return;
      }
      assert(0)
    })
  });

  describe('commits and undoes', () => {

    it('undoes deletion', () => {
      para2.delete();
      para2.undo();
      assert.strictEqual(para2.isDeleted(), false);
    });

    it('undoes attributes', () => {
      para2.set({ type: ont.sdoc.numberedList })
      para2.delete()
      para2.undo()
      assert.strictEqual(para2.get('type'), node2.type)
    })

    it('commits attributes', () => {
      para2.set({ type: ont.sdoc.numberedList })
      para2.commit()
      para2.undo()
      assert.strictEqual(para2.get('type'), ont.sdoc.numberedList)
    })

  })

});
