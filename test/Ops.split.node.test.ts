import { Page } from '../src/Page';
import { config as cfg, turtle, config } from '../config/test';
import { Operation } from '../src/interface'
import * as assert from 'power-assert';

let page: Page;
let turtleAll = '';
turtleAll += turtle.page + '\n';
turtleAll += turtle.para.join('\n') + '\n'
turtleAll += turtle.text.join('\n') + '\n'

let newId = config.page.id + '#new'
let splitBranchOp: Operation = {
  type: 'split_node',
  path: { parentId: config.page.id, offset: 0 },
  position: 1,
  properties: { id: newId }
}

describe('Split Nodes', () => {
  beforeEach(() => {
    page = new Page(cfg.page.id, turtleAll);
  });

  it('splits branch 0', () => {
    page.apply(splitBranchOp)

    assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0]])
    assert.deepStrictEqual(page.toJson().children[1].children, [cfg.text[1], cfg.text[2]])
  })

  it('splits branch 0 at position > length', () => {
    splitBranchOp.position = 10
    page.apply(splitBranchOp)

    assert.deepStrictEqual(page.toJson().children.length, 4)
    assert.deepStrictEqual(page.toJson().children[1], {
      id: newId,
      type: 'http://www.solidoc.net/ontologies#Paragraph',
      children: []
    })
  })

  it('throws to split a branch at position -1', () => {
    assert.throws(() => {
      page.apply({
        type: 'split_node',
        path: { parentId: config.page.id, offset: 0 },
        position: -1,
        properties: { id: newId, type: 'http://www.solidoc.net/ontologies#Branch' }
      })
    });

  })

  // describe('Split Text Node', () => {
  //   beforeEach(() => {
  //     page = new Page(pageId, turtle);
  //   });
  //   it('splits text 1', () => {
  //     let op: Operation = { type: 'split_node', path: { parentId: paraId1, offset: 0 }, position: 1, properties: { id: tid3, type: 'http://www.solidoc.net/ontologies#Leaf' } }
  //     page.apply(op)
  //     let pageJson = page.toJson()
  //     assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [tid1, tid3])
  //     assert.strictEqual(pageJson.children[0].children[0].text, 'P')
  //     assert.strictEqual(pageJson.children[0].children[1].text, 'aragraph 1')
  //   });
  // });

  // describe('Split Branch Node', () => {
  //   beforeEach(() => {
  //     page = new Page(pageId, turtle);
  //     let op: Operation = { type: 'insert_node', path: { parentId: paraId1, offset: 1 }, node: textJson3 }
  //     page.apply(op)
  //   });
  //   it('splits paragraph 1', () => {
  //     let op: Operation = { type: 'split_node', path: { parentId: pageId, offset: 0 }, position: 0, properties: { id: pid3, type: 'http://www.solidoc.net/ontologies#Paragraph' } }
  //     page.apply(op)
  //     let pageJson = page.toJson()
  //     assert.deepStrictEqual(extractChildrenId(pageJson), [pid1, pid3, pid2])
  //     assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [])
  //     assert.deepStrictEqual(extractChildrenId(pageJson.children[1]), [tid1, tid3])
  //   });
  // });


});
