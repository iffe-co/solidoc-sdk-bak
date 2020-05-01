import { Subject } from '../src/Subject';
import { Predicate } from '../src/Predicate';
import { ont, subjTypeToPredArray, predIdToType } from '../config/ontology';
import { config, turtle } from '../config/test';
import { Element } from '../src/interface';
import * as assert from 'power-assert';
import * as _ from 'lodash';

import * as n3 from 'n3';
const parser = new n3.Parser();
let quads: any[];

const predicates: { [key: string]: Predicate } = {};
const createPredicates = () => {
  const predIdArray: string[] = subjTypeToPredArray;
  predIdArray.forEach(predId => {
    predicates[predId] = new Predicate(
      predId,
      predIdToType[predId],
      config.page._id,
    );
  });
};
createPredicates();

describe('test/Subject.test.ts', () => {
  let branch1: Subject;
  let para1: Element;

  let branch2: Subject;
  let para2: Element;

  beforeEach(() => {
    para1 = _.cloneDeep(config.para[1]);
    para2 = _.cloneDeep(config.para[2]);
    branch2 = new Subject(para2.id, para2.type, config.page.id, predicates);
  });

  describe('Create Node', () => {
    it('constructs an empty node', () => {
      assert.strictEqual(branch2.getProperty(ont.rdf.type), '');
      assert.strictEqual(branch2.getProperty(ont.sdoc.next), '');
      assert.strictEqual(branch2.getProperty(ont.sdoc.firstChild), '');
      assert(!branch2.isDeleted());
      assert(!branch2.isInserted());
    });

    it('translates to Json', () => {
      branch2.set(para2);
      assert.deepStrictEqual(branch2.toJson(), {
        ...para2,
        children: [],
      });
    });

    it('parses from quads', () => {
      quads = parser.parse(turtle.para[2]);
      quads.forEach(quad => {
        branch2.fromQuad(quad);
      });

      assert.equal(
        branch2.getProperty(ont.sdoc.firstChild),
        config.para[2].children[0].id,
      );
    });

    it('discards an unknown quad', () => {
      let turtle = `<${config.para[2].id}> <${ont.sdoc.text}> "abc".`;
      let quads = parser.parse(turtle);
      branch2.fromQuad(quads[0]);

      assert(!branch2.isInserted());
    });
  });

  describe('Sets and gets', () => {
    it('sets and gets a known property', () => {
      para2.type = ont.sdoc.numberedList;
      branch2.set(para2);

      assert.strictEqual(
        branch2.getProperty(ont.rdf.type),
        ont.sdoc.numberedList,
      );
    });

    it('throws on getting an unkown property', () => {
      assert.throws(() => {
        branch2.getProperty('unknown');
      });
    });
  });

  describe('#nextNode property', () => {
    beforeEach(() => {
      branch1 = new Subject(para1.id, para1.type, config.page.id, predicates);
    });

    it('setNext() is together with set("next")', () => {
      branch1.setProperty(ont.sdoc.next, para2.id);

      assert.strictEqual(
        branch1.getProperty(ont.sdoc.next),
        branch2.getProperty('id'),
      );
    });

    it('parses #nextNode from quads and synced with getNext()', () => {
      let quads = parser.parse(turtle.para[1]);
      // note the index of quads
      branch1.fromQuad(quads[1]);

      assert.strictEqual(branch1.getProperty(ont.sdoc.next), config.para[2].id);
    });
  });

  describe('performs deletion', () => {
    beforeEach(() => {
      branch2.delete();
    });

    it('performs deletion', () => {
      assert.strictEqual(branch2.isDeleted(), true);
    });

    it('throws on setting a deleted node', () => {
      assert.throws(() => {
        branch2.set(para2);
      });
    });

    it('generates sparql after deletion', () => {
      const sparql = branch2.getSparqlForUpdate();

      assert.strictEqual(
        sparql,
        `DELETE WHERE { GRAPH <${config.page.id}> { <${config.para[2].id}> ?p ?o } };\n`,
      );
    });
  });

  describe('commits', () => {
    it('commits attributes', () => {
      para2.type = ont.sdoc.numberedList;
      branch2.set(para2);
      branch2.commit();

      assert.strictEqual(
        branch2.getProperty(ont.rdf.type),
        ont.sdoc.numberedList,
      );
      assert(!branch2.isInserted());
    });

    it('disallows committing a deleted node', () => {
      branch2.delete();

      assert.throws(() => {
        branch2.commit();
      });
    });
  });

  describe('undoes', () => {
    beforeEach(() => {
      branch1 = new Subject(
        config.para[1].id,
        config.para[1].type,
        config.page.id,
        predicates,
      );
    });

    it('disallows undoing a non-existOnPod node', () => {
      branch2.insert();
      assert.throws(() => {
        branch2.undo();
      });
    });

    it('undoes deletion', () => {
      branch2.delete();
      branch2.undo();

      assert.strictEqual(branch2.isDeleted(), false);
    });

    it('undoes attributes', () => {
      branch2.set(para2);
      branch2.commit(); // so {type: Paragraph} becomes value
      para2.type = ont.sdoc.numberedList;
      branch2.set(para2);
      branch2.delete();
      branch2.undo();

      assert.strictEqual(
        branch2.getProperty(ont.rdf.type),
        config.para[2].type,
      );
    });
  });
});

describe('Root', () => {
  let page;
  let root: Subject;

  beforeEach(() => {
    page = _.cloneDeep(config.page);
    root = new Subject(page.id, page.type, config.page.id, predicates);
  });

  it('sets title', () => {
    page.title = 'Welcome';
    root.set(page);

    assert.strictEqual(root.getProperty(ont.dct.title), 'Welcome');
  });

  it('gets sparql', () => {
    let quads = parser.parse(turtle.page);
    quads.forEach(quad => {
      root.fromQuad(quad);
    });
    root.setProperty(ont.sdoc.firstChild, '');
    let sparql = root.getSparqlForUpdate();

    assert(sparql.startsWith('DELETE WHERE'));
  });

  it('throws on parsing #nextNode predicate', () => {
    let turtle = `<${page.id}> <${ont.sdoc.next}> <${config.para[0].id}>.`;
    let quads = parser.parse(turtle);

    assert.doesNotThrow(() => {
      root.fromQuad(quads[0]);
    });
  });

  // it('throws on set("next")', () => {
  //   assert.throws(() => {
  //     root.setProperty('next', config.para[1].id);
  //   }, /^Error: Try to set an unknown Predicate/);
  // });

  it('disallows deletion', () => {
    assert.throws(() => {
      root.delete();
    });
  });
});

describe('Leaf', () => {
  let leaf: Subject;
  const text = config.text[8];
  const quads: any[] = parser.parse(turtle.text[8]);

  beforeEach(() => {
    leaf = new Subject(text.id, text.type, config.page.id, predicates);
    quads.forEach(quad => leaf.fromQuad(quad));
  });

  it('parses from quads', () => {
    assert.strictEqual(leaf.getProperty(ont.rdf.type), text.type);
    assert.strictEqual(leaf.getProperty(ont.sdoc.text), text.text);
  });

  it('translate to Json', () => {
    assert.deepStrictEqual(leaf.toJson(), text);
  });
});
