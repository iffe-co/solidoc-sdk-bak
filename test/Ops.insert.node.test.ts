import { Page } from '../src/Page';
import { config as cfg } from '../config/test'
import { Operation } from '../src/interface'
import * as assert from 'power-assert';

let page: Page;

let op0: Operation;
let op1: Operation;
let op2: Operation;
let op3: Operation;

beforeEach(() => {
  op0 = {
    type: 'insert_node',
    path: { parentId: cfg.page.id, offset: 0 },
    node: cfg.para[0]
  }
  op1 = {
    type: 'insert_node',
    path: { parentId: cfg.page.id, offset: 1 },
    node: cfg.para[1]
  }
  op2 = {
    type: 'insert_node',
    path: { parentId: cfg.page.id, offset: 2 },
    node: cfg.para[2]
  }
  op3 = {
    type: 'insert_node',
    path: { parentId: cfg.para[0].id, offset: 1 },
    node: cfg.text[3]
  }
});

describe('Insert Node', () => {

  beforeEach(() => {
    page = new Page(cfg.page.id, '');
    page.getRoot()?.set(cfg.page)
  })

  it('inserts a paragraph', () => {
    page.apply(op0)

    assert.deepStrictEqual(page.toJson().children[0], cfg.para[0])
    assert(!page.getNode(cfg.para[0].id)?.isFromPod())
    assert(!page.getNode(cfg.text[0].id)?.isFromPod())
  })

  it('inserts a second paragraph', () => {
    page.apply(op0)
    page.apply(op1)

    assert.deepStrictEqual(page.toJson().children[1], cfg.para[1])
    assert(!page.getNode(cfg.para[1].id)?.isFromPod())
    assert(!page.getNode(cfg.text[4].id)?.isFromPod())
  })

  it('inserts a third paragraph', () => {
    page.apply(op0)
    page.apply(op1)
    page.apply(op2)

    assert.deepStrictEqual(page.toJson(), cfg.page)
    assert(!page.getNode(cfg.para[2].id)?.isFromPod())
    assert(!page.getNode(cfg.text[8].id)?.isFromPod())
  })

  it('throws if parent is not found', () => {
    op0.path.parentId = cfg.page.id + '#fake';
    assert.throws(() => {
      page.apply(op0)
    })
  })

  it('inserts a text node', () => {
    page.apply(op0);
    page.apply(op3);

    assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0], cfg.text[3], cfg.text[1], cfg.text[2]])
  })

  it('throws if parent is a leaf node', () => {
    page.apply(op0)
    op3.path.parentId = cfg.text[0].id;
    assert.throws(() => {
      page.apply(op3)
    })
  })

  it('inserts to the tail if offset > length', () => {
    page.apply(op0);
    op1.path.offset = 100
    page.apply(op1);

    assert(page.toJson().children[1], cfg.para[1])
  })

  it('disallows inserting to offset < 0', () => {
    op0.path.offset = -1;
    assert.throws(() => {
      page.apply(op0)
    })
  })

  it('disallows inserting with a duplicated node', () => {
    page.apply(op0)
    assert.throws(() => {
      page.apply(op0)
    })
  })

  it('undoes', () => {
    page.apply(op0)
    page.apply(op1)
    page.apply(op2)
    page.undo()

    assert.deepStrictEqual(page.toJson(), page.getRoot()?.toBlankJson())
    assert.strictEqual(page.getNode(cfg.para[0].id), undefined)
    assert.strictEqual(page.getNode(cfg.text[0].id), undefined)
  });
});
