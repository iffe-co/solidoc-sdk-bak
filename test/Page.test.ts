/* eslint-disable no-undef */
import { Page } from '../src/Page';
import { config as cfg, turtle } from '../config/test';
import { ont, idToLabel } from '../config/ontology';
import { Operation } from '../src/interface';
import * as assert from 'power-assert';
import { updatePod } from './MockPod.test';

let page: Page;

let turtleAll = '';
turtleAll += turtle.page + '\n';
turtleAll += turtle.para.join('\n') + '\n';
turtleAll += turtle.text.join('\n') + '\n';

const checkPodConsistency = (turtle: string, page: Page) => {
  page.update();
  const sparql = page.getSparqlForUpdate();
  const turtleNew = updatePod(turtle, sparql, page.id);

  const pageNew = new Page(page.id, turtleNew);
  assert.deepStrictEqual(pageNew.toJson(), page.toJson());
};

describe('Create Page', () => {
  it('parses from quads', () => {
    page = new Page(cfg.page.id, turtleAll);

    assert.deepStrictEqual(page.toJson(), cfg.page);
  });

  it('updates and sets modified time', () => {
    page = new Page(cfg.page.id, turtleAll);

    checkPodConsistency(turtleAll, page);

    assert(page.toJson().modified > 0);
  });

  it('inserts type definition if not defined', () => {
    let turtle = `<${cfg.page.id}> <${ont.dct.modified}> "${new Date(0)}"^^<${
      ont.xsd.dateTime
    }> .`;
    page = new Page(cfg.page.id, turtle);

    checkPodConsistency(turtle, page);

    assert.strictEqual(page.toJson().type, idToLabel[ont.sdoc.root]);
  });
});

describe('Insert Node', () => {
  let op0: Operation;
  let turtle = `<${cfg.page.id}> a <${ont.sdoc.root}>; <${ont.dct.title}> "${cfg.page.title}".`;

  beforeEach(() => {
    page = new Page(cfg.page.id, turtle);
    op0 = {
      type: 'insert_node',
      path: [0],
      node: cfg.para[0],
    };
  });

  it('inserts a paragraph', () => {
    page.apply(op0);

    assert.deepStrictEqual(page.toJson().children[0], cfg.para[0]);
    assert(page.getSubject(cfg.para[0].id).isInserted);
    assert(page.getSubject(cfg.text[0].id).isInserted);

    checkPodConsistency(turtle, page);
  });

  // it('applies no insertion if operation is failed', () => {
  //   op0.path = [10, 0];
  //   assert.throws(() => {
  //     page.apply(op0);
  //   }, /^Error: Cannot find a descendant/);
  //   assert.throws(() => {
  //     page.getSubject(op0.node.id);
  //   }, /^Error: Subject not found/);
  // });

  it('disallows inserting a duplicated node', () => {
    page.apply(op0);
    assert.throws(() => {
      page.apply(op0);
    }, /^Error: Duplicated node insertion/);
  });

  it('commits', () => {
    page.apply(op0);
    page.update();
    page.commit();

    assert(!page.getSubject(cfg.para[0].id).isInserted);
    assert(!page.getSubject(cfg.text[0].id).isInserted);
  });

  it('undoes', () => {
    page.apply(op0);
    page.undo();

    assert.throws(() => {
      page.getSubject(cfg.para[0].id);
    });
    assert.throws(() => {
      page.getSubject(cfg.text[0].id);
    });

    checkPodConsistency(turtle, page);
  });
});

describe('Split Node', () => {
  let op0: Operation;

  beforeEach(() => {
    page = new Page(cfg.page.id, turtleAll);

    op0 = {
      type: 'split_node',
      path: [0],
      position: 1,
      target: null,
      properties: {
        id: cfg.page.id + '#temp',
      },
    };
  });

  it('splits a paragraph', () => {
    page.apply(op0);

    assert(page.getSubject(cfg.page.id + '#temp').isInserted);

    checkPodConsistency(turtleAll, page);
  });

  it('disallows duplicated node', () => {
    page.apply(op0);

    assert.throws(() => {
      page.apply(op0);
    }, /^Error: Duplicated node insertion/);
  });

  it('commits splitting', () => {
    page.apply(op0);
    page.update();
    page.commit();

    assert(!page.getSubject(cfg.page.id + '#temp').isInserted);
  });

  it('undoes splitting', () => {
    page.apply(op0);
    page.update();
    page.undo();

    assert.throws(() => {
      page.getSubject(cfg.page.id + '#temp');
    }, /^Error: Subject not found/);

    checkPodConsistency(turtleAll, page);
  });
});

describe('Remove Node', () => {
  let op0: Operation;
  let op1: Operation;
  let op2: Operation;

  beforeEach(() => {
    page = new Page(cfg.page.id, turtleAll);

    op0 = {
      type: 'remove_node',
      path: [0],
      node: {
        id: '',
        type: '',
        text: '',
      },
    };
    op1 = {
      type: 'remove_node',
      path: [0, 0],
      node: {
        id: '',
        type: '',
        text: '',
      },
    };
    op2 = {
      type: 'insert_node',
      path: [0],
      node: cfg.para[0],
    };
  });

  it('removes a paragraph', () => {
    page.apply(op0);

    assert(page.getSubject(cfg.para[0].id).isDeleted);
    assert(page.getSubject(cfg.text[0].id).isDeleted);

    checkPodConsistency(turtleAll, page);
  });

  it('removes a text', () => {
    page.apply(op1);
    page.apply(op1);
    page.apply(op1);

    checkPodConsistency(turtleAll, page);

    assert.deepStrictEqual(page.toJson().children[0].children, []);
  });

  it('inserts a deleted subject', () => {
    page.apply(op0);
    page.apply(op2);

    checkPodConsistency(turtleAll, page);

    assert(!page.getSubject(cfg.para[0].id).isDeleted);
    assert(!page.getSubject(cfg.para[0].id).isInserted);
  });

  it('commits removal', () => {
    page.apply(op0);
    page.update();
    page.commit();

    assert.throws(() => {
      page.getSubject(cfg.para[0].id);
    }, /^Error: Subject not found/);

    assert.throws(() => {
      page.getSubject(cfg.text[0].id);
    }, /^Error: Subject not found/);
  });

  it('undoes removal', () => {
    page.apply(op0);
    page.update();
    page.undo();

    assert(!page.getSubject(cfg.para[0].id).isDeleted);
    assert(!page.getSubject(cfg.text[0].id).isDeleted);

    checkPodConsistency(turtleAll, page);
  });
});

describe('Merge Node', () => {
  let op0: Operation;

  beforeEach(() => {
    page = new Page(cfg.page.id, turtleAll);

    op0 = {
      type: 'merge_node',
      position: 0,
      target: null,
      path: [1],
      properties: {},
    };
  });

  it('merges a paragraph', () => {
    page.apply(op0);

    checkPodConsistency(turtleAll, page);

    assert(page.getSubject(cfg.para[1].id).isDeleted);
  });

  it('commits merging', () => {
    page.apply(op0);
    page.update();
    page.commit();

    assert.throws(() => {
      page.getSubject(cfg.para[1].id);
    }, /^Error: Subject not found/);
  });

  it('undoes merging', () => {
    page.apply(op0);
    page.update();
    page.undo();

    assert(!page.getSubject(cfg.para[1].id).isDeleted);

    checkPodConsistency(turtleAll, page);
  });
});

describe('Set Node', () => {
  let op0: Operation;

  beforeEach(() => {
    page = new Page(cfg.page.id, turtleAll);

    op0 = {
      type: 'set_node',
      path: [0, 0],
      properties: {},
      newProperties: {
        bold: null,
      },
    };
  });

  it('set a paragraph', () => {
    page.apply(op0);

    checkPodConsistency(turtleAll, page);

    page.commit();
    let leaf = page.getSubject(cfg.text[0].id);
    assert.deepStrictEqual(leaf.toJson(), {
      id: cfg.text[0].id,
      type: cfg.text[0].type,
      text: cfg.text[0].text,
    });
  });

  it('updates the subject', () => {
    page.apply(op0);
    page.update();
    page.commit();

    assert.strictEqual(page.getValue(cfg.text[0].id, ont.sdoc.bold), false);
  });
});
