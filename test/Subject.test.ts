import { Subject } from '../src/Subject'
import { Branch, createNode } from '../src/Node';
import { ont } from '../config/ontology'
import { config, turtle } from '../config/test'
import * as assert from 'power-assert';

import * as n3 from 'n3';
const parser = new n3.Parser();

const nodeMap = new Map<string, Subject>();

// const page = config.page

describe('src/Subject.ts', () => {
  let branch1: Branch;
  let branch2: Branch;
  let quads: any[];

  beforeEach(() => {
    branch2 = <Branch>createNode(config.para[2], nodeMap);
  });

  describe('Create Node', () => {

    it('constructs an empty node', () => {
      assert.strictEqual(branch2.get('id'), config.para[2].id)
      assert.strictEqual(branch2.get('type'), config.para[2].type)
      assert.strictEqual(branch2.get('next'), '')
      assert.strictEqual(branch2.get('firstChild'), '')
      assert.strictEqual(branch2.get('option'), '{}')
      assert(!branch2.isDeleted())
      assert(!branch2.isFromPod())
    })

    it('translates to Json', () => {
      assert.deepStrictEqual(branch2.toJson(), {
        ...config.para[2],
        children: [],
      });
    });

    it('parses from quads', () => {
      quads = parser.parse(turtle.para[2]);
      quads.forEach(quad => branch2.fromQuad(quad, nodeMap));

      assert.equal(branch2.get('firstChild'), config.para[2].children[0].id);
    })

    it('discards an unknown quad', () => {
      let turtle = `<${config.para[2].id}> <${ont.sdoc.text}> "abc".`;
      let quads = parser.parse(turtle)
      branch2.fromQuad(quads[0], nodeMap)

      assert(!branch2.isFromPod())
    });

  })

  describe('Sets and gets', () => {

    it('sets and gets a known property', () => {
      branch2.set({ type: ont.sdoc.numberedList });

      assert.strictEqual(branch2.get('type'), ont.sdoc.numberedList);
    });

    it('throws on getting an unkown property', () => {
      assert.throws(() => {
        branch2.get('unknown')
      })
    })

    it('ignores id and children properties', () => {
      branch2.commit();
      branch2.set({ id: 'fake id', children: ['something'] });

      let sparql = branch2.getSparqlForUpdate(config.page.id);
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
      branch1 = <Branch>createNode(config.para[1], nodeMap);
    })

    it('setNext() is together with set("next")', () => {
      branch1.setNext(branch2)

      assert.strictEqual(branch1.get("next"), branch2.get('id'));
    });

    it('disallows set("next")', () => {
      try {
        branch1.set({ "next": branch2.get('id') })
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
      quads[1].object.id = config.para[0].id

      assert.throws(() => {
        branch1.fromQuad(quads[1], nodeMap)
      })
    })

    it('unsets next', () => {
      branch1.setNext(branch2)
      branch1.commit()
      branch1.setNext(undefined)
      assert.strictEqual(branch1.getNext(), undefined)
    })
  });

  describe('performs deletion', () => {

    beforeEach(() => {
      branch2.delete()
    })

    it('performs deletion', () => {
      assert.strictEqual(branch2.isDeleted(), true)
    });

    it('throws on setting a deleted node', () => {
      assert.throws(() => {
        branch2.set({ type: ont.sdoc.numberedList });
      })
    })

    it('generates sparql after deletion', () => {
      const sparql = branch2.getSparqlForUpdate(config.page.id);

      assert.strictEqual(sparql, `WITH <${config.page.id}> DELETE { <${config.para[2].id}> ?p ?o } WHERE { <${config.para[2].id}> ?p ?o };\n`);
    });

  });

  describe('commits', () => {

    it('commits attributes', () => {
      branch2.set({ type: ont.sdoc.numberedList })
      branch2.commit()
      branch2.undo(nodeMap)

      assert.strictEqual(branch2.get('type'), ont.sdoc.numberedList)
      assert(branch2.isFromPod())
    })

    it('disallows committing a deleted node', () => {
      branch2.delete();

      assert.throws(() => {
        branch2.commit();
      })
    })

  })

  describe('undoes', () => {
    beforeEach(() => {
      branch1 = <Branch>createNode(config.para[1], nodeMap);
    })

    it('disallows undoing a non-existOnPod node', () => {
      assert.throws(() => {
        branch2.undo(nodeMap)
      });
    })

    it('undoes deletion', () => {
      branch2.setFromPod()  // otherwise it disallows undo
      branch2.delete();
      branch2.undo(nodeMap);

      assert.strictEqual(branch2.isDeleted(), false);
    });

    it('undoes attributes', () => {
      branch2.commit() // so {type: Paragraph} becomes value
      branch2.set({ type: ont.sdoc.numberedList })
      branch2.delete()
      branch2.undo(nodeMap)

      assert.strictEqual(branch2.get('type'), config.para[2].type)
    })

    it('undoes next', () => {
      branch2.setFromPod()  // otherwise it disallows undo
      branch2.setNext(branch1);
      branch2.undo(nodeMap);

      assert.strictEqual(branch2.getNext(), undefined)
    })
  });

});
