import { Subject } from '../src/Subject'
import { Branch, Leaf, createNode } from '../src/Node';
import { config } from '../config/test'
import * as assert from 'power-assert';

const nodeMap = new Map<string, Subject>();

const para0 = config.para[0]
let branch: Branch
let leaf: Leaf[] = []

describe('Branch', () => {

  beforeEach(() => {
    nodeMap.clear()

    branch = <Branch>createNode(para0, nodeMap);

    leaf[0] = <Leaf>createNode(config.text[0], nodeMap);
    leaf[1] = <Leaf>createNode(config.text[1], nodeMap);
    leaf[2] = <Leaf>createNode(config.text[2], nodeMap);

    leaf[0].setNext(leaf[1]);
    leaf[1].setNext(leaf[2]);
    branch.set({'firstChild': leaf[0].get('id')})
    branch.assembleChlildren(nodeMap);

    leaf[3] = <Leaf>createNode(config.text[3], nodeMap);
    leaf[4] = <Leaf>createNode(config.text[4], nodeMap);
    leaf[3].setNext(leaf[4])
  });

  it('converts to Json', () => {
    assert.deepStrictEqual(branch.toJson(), para0)
  });
  
  it('converts to blank Json', () => {
    assert.deepStrictEqual(branch.toBlankJson(), {
      ...para0,
      children: []
    })
  })

  it('deletes iteratively', () => {
    branch.delete();

    assert(branch.isDeleted())
    assert(leaf[0].isDeleted())
  })

  describe('Attach', () => {

    it('inserts children to the beginning', () => {
      branch.attachChildren(leaf[3], 0);
      assert.strictEqual(branch.getChildrenNum(), 5);
      assert.strictEqual(branch.getIndexedChild(0), leaf[3])
      assert.strictEqual(branch.getLastChild(), leaf[2])
    })

    it('inserts children to the middle', () => {
      branch.attachChildren(leaf[3], 1);
      assert.strictEqual(branch.getChildrenNum(), 5);
      assert.strictEqual(branch.getIndexedChild(2), leaf[4])
    })

    it('inserts children to the tail', () => {
      branch.attachChildren(leaf[3], Infinity);
      assert.strictEqual(branch.getChildrenNum(), 5);
      assert.strictEqual(branch.getLastChild(), leaf[4])
    })

    it('disallows inserting children to offset < 0', () => {
      assert.throws(() => {
        branch.attachChildren(leaf[3], -1);
      })
    })

    it('throws on inserting an undefined child', () => {
      try {
        branch.attachChildren(undefined, 0)
      } catch (e) {
        return
      }
      assert(0)
    })
  })

  describe('Detach', () => {

    beforeEach(() => {
      nodeMap.clear()
      branch = <Branch>createNode(para0, nodeMap);
  
      leaf[0] = <Leaf>createNode(config.text[0], nodeMap);
      leaf[1] = <Leaf>createNode(config.text[1], nodeMap);
      leaf[2] = <Leaf>createNode(config.text[2], nodeMap);
  
      leaf[0].setNext(leaf[1]);
      leaf[1].setNext(leaf[2]);
      branch.attachChildren(leaf[0], 0);
    })
  
    it('throws on deleting if length <= 0', () => {
      try {
        branch.detachChildren(0, 0)
      } catch (e) {
        return
      }
      assert(0)
    });
  
    it('deletes at the beginning', () => {
      branch.detachChildren(0, 1);
      assert.strictEqual(branch.getChildrenNum(), 2);
      assert.strictEqual(branch.getIndexedChild(0), leaf[1])
      assert.strictEqual(branch.getIndexedChild(1), leaf[2])
    })
  
    it('deletes in the middle', () => {
      branch.detachChildren(1, 2);
      assert.strictEqual(branch.getChildrenNum(), 1);
      assert.strictEqual(branch.getIndexedChild(0), leaf[0])
    })
  
    it('deletes all', () => {
      branch.detachChildren(0, Infinity);
      assert.strictEqual(branch.getChildrenNum(), 0)
    })
  
  })
});


