import { Subject } from '../src/Subject'
import { Branch, Leaf, createNode } from '../src/Node';
import { config } from '../config/test'
import * as assert from 'power-assert';

const nodeMap = new Map<string, Subject>();

const para0 = config.para[0]

describe('Branch', () => {
  let branch: Branch
  let leaf0: Leaf
  let leaf1: Leaf
  let leaf2: Leaf

  let leaf3: Leaf
  let leaf4: Leaf

  beforeEach(() => {
    nodeMap.clear()

    branch = <Branch>createNode(para0, nodeMap);

    leaf0 = <Leaf>createNode(config.text[0], nodeMap);
    leaf1 = <Leaf>createNode(config.text[1], nodeMap);
    leaf2 = <Leaf>createNode(config.text[2], nodeMap);

    leaf0.setNext(leaf1);
    leaf1.setNext(leaf2);
    branch.set({'firstChild': leaf0.get('id')})
    branch.assembleChlildren(nodeMap);

    leaf3 = <Leaf>createNode(config.text[3], nodeMap);
    leaf4 = <Leaf>createNode(config.text[4], nodeMap);
    leaf3.setNext(leaf4)
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

  it('is ancestor of its child', () => {
    assert(branch.isAncestor(leaf0))
  })

  it('is not ancestor of itself', () => {
    assert(branch.isAncestor(branch))
  })

  it('is not ancestor of others', () => {
    assert(!branch.isAncestor(leaf4))
  })

  describe('Insertion', () => {

    it('inserts children to the beginning', () => {
      branch.attachChildren(leaf3, 0);
      assert.strictEqual(branch.getChildrenNum(), 5);
      assert.strictEqual(branch.getIndexedChild(0), leaf3)
      assert.strictEqual(branch.getLastChild(), leaf2)
    })

    it('inserts children to the middle', () => {
      branch.attachChildren(leaf3, 1);
      assert.strictEqual(branch.getChildrenNum(), 5);
      assert.strictEqual(branch.getIndexedChild(2), leaf4)
    })

    it('inserts children to the tail', () => {
      branch.attachChildren(leaf3, Infinity);
      assert.strictEqual(branch.getChildrenNum(), 5);
      assert.strictEqual(branch.getLastChild(), leaf4)
    })

    it('inserts children to offset < 0', () => {
      branch.attachChildren(leaf3, -1);
      assert.strictEqual(branch.getChildrenNum(), 5);
      assert.strictEqual(branch.getIndexedChild(0), leaf3);
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

  describe('Deletion', () => {

    beforeEach(() => {
      branch = <Branch>createNode(para0, nodeMap);

      leaf0 = <Leaf>createNode(config.text[0], nodeMap);
      leaf1 = <Leaf>createNode(config.text[1], nodeMap);
      leaf2 = <Leaf>createNode(config.text[2], nodeMap);

      leaf0.setNext(leaf1);
      leaf1.setNext(leaf2);
      branch.attachChildren(leaf0, 0);
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
      assert.strictEqual(branch.getIndexedChild(0), leaf1)
      assert.strictEqual(branch.getIndexedChild(1), leaf2)
    })

    it('deletes in the middle', () => {
      branch.detachChildren(1, 2);
      assert.strictEqual(branch.getChildrenNum(), 1);
      assert.strictEqual(branch.getIndexedChild(0), leaf0)
    })

    it('deletes all', () => {
      branch.detachChildren(0, Infinity);
      assert.strictEqual(branch.getChildrenNum(), 0)
    })

  })

});

