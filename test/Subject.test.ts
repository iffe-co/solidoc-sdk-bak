/* eslint-disable no-undef */
import { Subject } from '../src/Subject';
import { Predicate } from '../src/Predicate';
import { ont, subjTypeToPredArray } from '../config/ontology';
import { config, turtle } from '../config/test';
import { myElement as Element } from '../src/interface';
import * as assert from 'power-assert';
import * as _ from 'lodash';

import * as n3 from 'n3';
const parser = new n3.Parser();
let quads: any[];

const predicates: { [key: string]: Predicate } = {};
const createPredicates = () => {
  const predIdArray: string[] = subjTypeToPredArray;
  predIdArray.forEach(predId => {
    predicates[predId] = new Predicate(predId, config.page._id);
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
    branch2 = new Subject(para2.id, config.page.id);
  });

  describe('Create Node', () => {
    it('constructs an empty node', () => {
      assert.strictEqual(
        branch2.getProperty(predicates[ont.rdf.type]),
        undefined,
      );
      assert.strictEqual(
        branch2.getProperty(predicates[ont.sdoc.next]),
        undefined,
      );
      assert.strictEqual(
        branch2.getProperty(predicates[ont.sdoc.firstChild]),
        undefined,
      );
      assert(!branch2.isDeleted);
      assert(!branch2.isInserted);
    });

    it('translates to Json', () => {
      let pred = predicates[ont.rdf.type];
      branch2.setProperty(pred, ont.sdoc.paragraph);

      assert.deepStrictEqual(branch2.toJson(), {
        ...para2,
        children: [],
      });
    });

    it('parses from quads', () => {
      quads = parser.parse(turtle.para[2]);
      quads.forEach(quad => {
        branch2.fromQuad(predicates[quad.predicate.id], quad.object);
      });

      assert.equal(
        branch2.getProperty(predicates[ont.sdoc.firstChild]),
        config.para[2].children[0].id,
      );
    });

    it('discards an unknown quad', () => {
      let turtle = `<${config.para[2].id}> <${ont.sdoc.text}> "abc".`;
      let quads = parser.parse(turtle);
      branch2.fromQuad(predicates[quads[0].predicate.id], quads[0].object);

      assert(!branch2.isInserted);
    });
  });

  describe('Sets and gets', () => {
    it('sets and gets a known property', () => {
      // para2.type = ont.sdoc.numberedList;
      let pred = predicates[ont.rdf.type];
      // branch2.setProperty(pred, ont.sdoc.numberedList);
      branch2.setProperty(pred, 'NumberedList');
      branch2.commit();

      assert.strictEqual(branch2.getProperty(pred), 'NumberedList');
    });
  });

  describe('#nextNode property', () => {
    beforeEach(() => {
      branch1 = new Subject(para1.id, config.page.id);
    });

    it('setNext() is together with set("next")', () => {
      branch1.setProperty(predicates[ont.sdoc.next], para2.id);
      branch1.commit();

      assert.strictEqual(
        branch1.getProperty(predicates[ont.sdoc.next]),
        branch2.id,
      );
    });

    it('parses #nextNode from quads and synced with getNext()', () => {
      let quads = parser.parse(turtle.para[1]);
      // note the index of quads
      branch1.fromQuad(predicates[quads[1].predicate.id], quads[1].object);

      assert.strictEqual(
        branch1.getProperty(predicates[ont.sdoc.next]),
        config.para[2].id,
      );
    });
  });

  describe('performs deletion', () => {
    beforeEach(() => {
      branch2.isDeleted = true;
    });

    it('performs deletion', () => {
      assert(branch2.isDeleted);
    });

    // it('throws on setting a deleted node', () => {
    //   assert.throws(() => {
    //     branch2.set(para2);
    //   });
    // });

    // it('generates sparql after deletion', () => {
    //   const sparql = branch2.getSparqlForUpdate();

    //   assert.strictEqual(
    //     sparql,
    //     `DELETE WHERE { GRAPH <${config.page.id}> { <${config.para[2].id}> ?p ?o } };\n`,
    //   );
    // });
  });

  describe('commits', () => {
    it('commits attributes', () => {
      let pred = predicates[ont.rdf.type];
      // para2.type = ont.sdoc.numberedList;
      branch2.setProperty(pred, 'NumberedList');
      branch2.commit();

      assert.strictEqual(branch2.getProperty(pred), 'NumberedList');
      assert(!branch2.isInserted);
    });

    it('disallows committing a deleted node', () => {
      branch2.isDeleted = true;

      assert.throws(() => {
        branch2.commit();
      });
    });
  });

  describe('undoes', () => {
    beforeEach(() => {
      branch1 = new Subject(config.para[1].id, config.page.id);
    });

    it('disallows undoing a non-existOnPod node', () => {
      branch2.isInserted = true;
      assert.throws(() => {
        branch2.undo();
      });
    });

    it('undoes deletion', () => {
      branch2.isDeleted = true;
      branch2.undo();

      assert(!branch2.isDeleted);
    });

    it('undoes attributes', () => {
      let pred = predicates[ont.rdf.type];
      branch2.setProperty(pred, ont.sdoc.paragraph);
      branch2.commit(); // so {type: Paragraph} becomes value
      branch2.setProperty(pred, ont.sdoc.numberedList);
      branch2.isDeleted = true;
      branch2.undo();

      assert.strictEqual(branch2.getProperty(pred), ont.sdoc.paragraph);
    });
  });
});

describe('Root', () => {
  let page;
  let root: Subject;

  beforeEach(() => {
    page = _.cloneDeep(config.page);
    root = new Subject(page.id, config.page.id);

    let pred = predicates[ont.rdf.type];
    root.setProperty(pred, ont.sdoc.root);
  });

  it('sets title', () => {
    let pred = predicates[ont.dct.title];
    root.setProperty(pred, 'Welcome');
    root.commit();

    assert.strictEqual(root.getProperty(pred), 'Welcome');
    assert.deepStrictEqual(root.toJson().title, 'Welcome');
  });

  it('gets sparql', () => {
    let quads = parser.parse(turtle.page);
    quads.forEach(quad => {
      root.fromQuad(predicates[quad.predicate.id], quad.object);
    });
    root.setProperty(predicates[ont.sdoc.firstChild], undefined);

    assert.throws(() => {
      root.getSparqlForUpdate();
    }, /^Error: NamedNode Object with undefined value/);
  });

  it('allows parsing #nextNode predicate', () => {
    let turtle = `<${page.id}> <${ont.sdoc.next}> <${config.para[0].id}>.`;
    let quads = parser.parse(turtle);

    assert.doesNotThrow(() => {
      root.fromQuad(predicates[quads[0].predicate.id], quads[0].object);
    });
  });

  // it('throws on set("next")', () => {
  //   assert.throws(() => {
  //     root.setProperty('next', config.para[1].id);
  //   }, /^Error: Try to set an unknown Predicate/);
  // });

  it('disallows deletion', () => {
    assert.throws(() => {
      root.isDeleted = true;
    });
  });
});

describe('Leaf', () => {
  let leaf: Subject;
  const text = config.text[8];
  const quads: any[] = parser.parse(turtle.text[8]);

  beforeEach(() => {
    leaf = new Subject(text.id, config.page.id);
    quads.forEach(quad =>
      leaf.fromQuad(predicates[quad.predicate.id], quad.object),
    );
  });

  it('parses from quads', () => {
    assert.strictEqual(
      leaf.getProperty(predicates[ont.rdf.type]),
      ont.sdoc.leaf,
    );
    assert.strictEqual(leaf.getProperty(predicates[ont.sdoc.text]), text.text);
  });

  // it('translate to Json', () => {
  //   assert.deepStrictEqual(leaf.toJson(), text);
  // });
});
