import { Subject } from '../src/Subject'
import { Branch, Leaf, createNode } from '../src/Node';
import { config } from '../config/test'
import * as assert from 'power-assert';

const nodeMap = new Map<string, Subject>();

const text0 = config.text[0]
const text1 = config.text[1]
const text2 = config.text[2]
const text3 = config.text[3]

const para0 = config.para[0]

describe('Branch', () => {
  let branch: Branch

  let leaf0: Leaf
  let leaf1: Leaf
  let leaf2: Leaf
  let leaf3: Leaf

  beforeEach(() => {
    branch = <Branch>createNode(para0.uri, para0.type, nodeMap);

    leaf0 = <Leaf>createNode(text0.uri, text0.type, nodeMap);
    leaf1 = <Leaf>createNode(text1.uri, text1.type, nodeMap);
    leaf2 = <Leaf>createNode(text2.uri, text2.type, nodeMap);
    leaf3 = <Leaf>createNode(text3.uri, text3.type, nodeMap);
  });

  describe('Insertion', () => {

    it('converts to Json', () => {
      assert.deepStrictEqual(branch.toJson(), {
        id: para0.id,
        type: para0.type,
        children: []
      })
    })

    it('inserts one child to a parent without children', () => {
      branch.insertChildren(leaf0, 0);
      assert.strictEqual(branch.getChildrenNum(), 1);
      assert.strictEqual(branch.getIndexedChild(0), leaf0)
      assert.strictEqual(branch.getIndexedChild(1), undefined)
      assert.strictEqual(branch.getIndexedChild(-1), undefined)
      assert.strictEqual(branch.getLastChild(), leaf0)
    })

    it('inserts a bunch of children to parent without children', () => {
      leaf0.setNext(leaf1)
      branch.insertChildren(leaf0, 0);
      assert.strictEqual(branch.getChildrenNum(), 2);
    })

    it('inserts a bunch of children to the tail', () => {
      leaf0.setNext(leaf1)
      branch.insertChildren(leaf0, Infinity);
      assert.strictEqual(branch.getChildrenNum(), 2);
    })

    it('inserts a bunch of children to parent with existing children', () => {
      leaf0.setNext(leaf1)
      branch.insertChildren(leaf0, 0);
      leaf2.setNext(leaf3)
      branch.insertChildren(leaf2, 1);
      assert.strictEqual(branch.getChildrenNum(), 4);
      assert.strictEqual(branch.getLastChild(), leaf1);
    })

    it('throws on inserting an undefined child', () => {
      try {
        branch.insertChildren(undefined, 0)
      } catch (e) {
        return
      }
      assert(0)
    })
  })

  describe('Deletion', () => {

    beforeEach(() => {
      branch.insertChildren(leaf0, 0);
      branch.insertChildren(leaf1, 1);
      branch.insertChildren(leaf2, 2);
      branch.insertChildren(leaf3, 3);
    })

    it('throws on deleting if length <= 0', () => {
      try {
        branch.removeChildren(0, 0)
      } catch (e) {
        return
      }
      assert(0)
    });

    it('deletes at the beginning', () => {
      branch.removeChildren(0, 1);
      assert.strictEqual(branch.getChildrenNum(), 3);
      assert.strictEqual(branch.getIndexedChild(0), leaf1)
      assert.strictEqual(branch.getIndexedChild(1), leaf2)
      assert.strictEqual(branch.getIndexedChild(2), leaf3)
    })

    it('deletes in the middle', () => {
      branch.removeChildren(1, 2);
      assert.strictEqual(branch.getChildrenNum(), 2);
    })

    it('deletes all', () => {
      branch.removeChildren(0, Infinity);
      assert.strictEqual(branch.getChildrenNum(), 0)
    })

  })

});

