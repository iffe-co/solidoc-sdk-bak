import { Subject } from '../src/Subject'
import { Branch, createNodes } from '../src/Node';
import { ont } from '../config/ontology'
import { config, turtle } from '../config/test'
import * as assert from 'power-assert';

import * as n3 from 'n3';
const parser = new n3.Parser();

const nodeMap = new Map<string, Subject>();

const para0 = config.para[0]
const para1 = config.para[1]
const para2 = config.para[2]
const page = config.page

describe('Subject', () => {
  // let para0: Branch;
  let branch1: Branch;
  let branch2: Branch;
  let quads: any[];

  beforeEach(() => {
    branch2 = <Branch>createNodes(para2, nodeMap);
    quads = parser.parse(turtle.para[2]);
    quads.forEach(quad => branch2.fromQuad(quad, nodeMap));
  });

  describe('Create Node', () => {

    it('parses from quads', () => {
      assert.equal(branch2.get('uri'), para2.id)
      assert.equal(branch2.get('type'), para2.type)
      assert.equal(branch2.get('next'), '')
      assert.equal(branch2.get('firstChild'), para2.children[0].id)
    })

    it('translates to Json', () => {
      assert.deepStrictEqual(branch2.toJson(), para2);
    });

    it('discards an unknown quad', () => {
      let turtle = `<${para2.id}> <${ont.sdoc.text}> "abc".`;
      let quads = parser.parse(turtle)
      branch2.fromQuad(quads[0], nodeMap)
      let sparql = branch2.getSparqlForUpdate(page.id);
      assert.strictEqual(sparql, '')
    });
  });

  describe('Sets and gets', () => {

    it('sets and gets a known property', () => {
      branch2.set({ type: ont.sdoc.numberedList });
      assert.strictEqual(branch2.get('type'), ont.sdoc.numberedList);
    });

    it('throws on getting an unkown property', () => {
      try {
        branch2.get('unknown')
      } catch (e) {
        return
      }
      assert(0)
    })

    it('ignores id and children properties', () => {
      branch2.set({ id: 'fake id', children: ['something'] });
      let sparql = branch2.getSparqlForUpdate(page.id);
      assert.strictEqual(sparql, '')
    })

    it('adds an optional property', () => {
      branch2.set({ author: 'alice' });
      assert.deepStrictEqual(JSON.parse(branch2.get('option')), {
        author: "alice",
      })
    })

    it('deletes optional property', () => {
      branch2.set({ author: "alice" })
      branch2.commit()
      branch2.set({ author: null })
      let json: any = branch2.toJson();
      assert.strictEqual(json.author, undefined);
      assert.strictEqual(branch2.get('option'), '{}')
    });

    it('modifies optional property', () => {
      branch2.set({ author: "alice" })
      branch2.commit()
      branch2.set({ author: "bob" })
      let json: any = branch2.toJson();
      assert.strictEqual(json.author, 'bob');
    })
  });

  describe('#nextNode property', () => {
    beforeEach(() => {
      branch1 = <Branch>createNodes(para1, nodeMap);
    })

    it('setNext() is together with set("next")', () => {
      branch1.setNext(branch2)
      assert.strictEqual(branch1.get("next"), branch2.get('uri'));
    });

    it('disallows set("next")', () => {
      try {
        branch1.set({ "next": branch2.get('uri') })
      } catch (e) {
        return
      }
      assert(0)
    });

    it('parses #nextNode from quads and synced with getNext()', () => {
      let quads = parser.parse(turtle.para[1])
      // note the index of quads
      branch1.fromQuad(quads[1], nodeMap)
      assert.strictEqual(branch1.getNext(), branch2)
    })

    it('throws if #nextNode inconsistent with next', () => {
      let quads = parser.parse(turtle.para[1])
      // note the index of quads
      quads[1].object.id = para0.id
      try {
        branch1.fromQuad(quads[1], nodeMap)
      } catch (e) {
        return
      }
      assert(0)
    })

    it('unsets next', () => {
      branch1.setNext(branch2)
      branch1.commit()
      branch1.setNext(undefined)
      assert.strictEqual(branch1.getNext(), undefined)
    })
  });

  describe('performs deletion', () => {

    it('performs deletion', () => {
      assert.strictEqual(branch2.isDeleted(), false)
      branch2.delete()
      assert.strictEqual(branch2.isDeleted(), true)
    });

    it('throws on setting a deleted node', () => {
      branch2.delete()
      try {
        branch2.set({ type: ont.sdoc.numberedList });
      } catch (e) {
        return
      }
      assert(0)
    })

    it('generates sparql after deletion', () => {
      branch2.delete();
      const sparql = branch2.getSparqlForUpdate(page.id);
      assert.strictEqual(sparql, `WITH <${page.id}> DELETE { <${para2.id}> ?p ?o } WHERE { <${para2.id}> ?p ?o };\n`);
    });

    it('disallows committing a deleted node', () => {
      branch2.delete();
      try {
        branch2.commit();
      } catch (e) {
        return;
      }
      assert(0)
    })
  });

  describe('commits and undoes', () => {

    it('undoes deletion', () => {
      branch2.delete();
      branch2.undo();
      assert.strictEqual(branch2.isDeleted(), false);
    });

    it('undoes attributes', () => {
      branch2.set({ type: ont.sdoc.numberedList })
      branch2.delete()
      branch2.undo()
      assert.strictEqual(branch2.get('type'), para2.type)
    })

    it('commits attributes', () => {
      branch2.set({ type: ont.sdoc.numberedList })
      branch2.commit()
      branch2.undo()
      assert.strictEqual(branch2.get('type'), ont.sdoc.numberedList)
    })

  })

});
