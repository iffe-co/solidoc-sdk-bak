import { Page } from '../src/Page';
import { config as cfg, turtle } from '../config/test'
// import { Operation } from '../src/interface'
import * as assert from 'power-assert';

let page: Page;
let turtleAll = '';
turtleAll += turtle.page + '\n';
turtleAll += turtle.para.join('\n') + '\n'
turtleAll += turtle.text.join('\n') + '\n'

describe('Merge Nodes', () => {
  beforeEach(() => {
    page = new Page(cfg.page.id, turtleAll);
  });

  it('merge branches 0 and 1', () => {
    page.apply({
      type: 'merge_node',
      path: { parentId: cfg.page.id, offset: 1 },
    })

    assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0], cfg.text[1], cfg.text[2], cfg.text[3], cfg.text[4], cfg.text[5]])
    assert.deepStrictEqual(page.toJson().children[1], cfg.para[2])
    assert(page.getNode(cfg.para[1].id)?.isDeleted())
  })

  it('merge branches 1 and 2', () => {
    page.apply({
      type: 'merge_node',
      path: { parentId: cfg.page.id, offset: 2 },
    })

    assert.deepStrictEqual(page.toJson().children[0], cfg.para[0])
    assert.deepStrictEqual(page.toJson().children[1].children, [cfg.text[3], cfg.text[4], cfg.text[5], cfg.text[6], cfg.text[7], cfg.text[8]])
    assert(page.getNode(cfg.para[2].id)?.isDeleted())
  })

  it('merge text 0 and 1', () => {
    page.apply({
      type: 'merge_node',
      path: { parentId: cfg.para[0].id, offset: 1 },
    })

    assert.strictEqual(page.toJson().children[0].children[0].text, cfg.text[0].text + cfg.text[1].text)
    assert(page.getNode(cfg.text[1].id)?.isDeleted())
  })

  it('merge text 1 and 2', () => {
    page.apply({
      type: 'merge_node',
      path: { parentId: cfg.para[0].id, offset: 2 },
    })

    assert.strictEqual(page.toJson().children[0].children[1].text, cfg.text[1].text + cfg.text[2].text)
    assert(page.getNode(cfg.text[2].id)?.isDeleted())
  })

  it('throws if the parent is not found', () => {
    assert.throws(() => {
      page.apply({
        type: 'merge_node',
        path: { parentId: cfg.page.id + '#fake', offset: 1 },
      })
    })
  })

  it('throws if the parent is a leaf', () => {
    assert.throws(() => {
      page.apply({
        type: 'merge_node',
        path: { parentId: cfg.text[1].id, offset: 1 },
      })
    })
  })

  it('throws if the node to merge is not found', () => {
    assert.throws(() => {
      page.apply({
        type: 'merge_node',
        path: { parentId: cfg.page.id, offset: 10 },
      })
    })
  })

  it('throws if prev is not found (offset == 0)', () => {
    assert.throws(() => {
      page.apply({
        type: 'merge_node',
        path: { parentId: cfg.page.id, offset: 0 },
      })
    })
  })

  it('throws to merge between a leaf and a branch', () => {
    // first move a branch to a lower level
    page.apply({
      type: 'move_node',
      path: { parentId: cfg.page.id, offset: 1 },
      newPath: { parentId: cfg.para[0].id, offset: 1 },
    })
    // assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0], cfg.para[1], cfg.text[1], cfg.text[2]])

    assert.throws(() => {
      page.apply({
        type: 'merge_node',
        path: { parentId: cfg.para[0].id, offset: 1 },
      })
    })
  })
});
