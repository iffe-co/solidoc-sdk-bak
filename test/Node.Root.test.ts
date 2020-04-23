import { Subject } from '../src/Subject';
import { Root, createNode, Branch, Leaf } from '../src/Node';
import { ont } from '../config/ontology'
import { config, turtle } from '../config/test'
import * as assert from 'power-assert';

import * as n3 from 'n3';
const parser = new n3.Parser();

const nodeMap = new Map<string, Subject>();

const page = config.page
const quads: any[] = parser.parse(turtle.page);

describe('Root', () => {
  let root: Root;
  let branch: Branch[] = []
  let leaf: Leaf[] = []

  beforeEach(() => {
    nodeMap.clear()
    root = <Root>createNode(page, nodeMap);
    quads.forEach(quad => root.fromQuad(quad, nodeMap));
    for (let i = 0; i < 3; i++) {
      root.insertRecursive(config.para[i], i, nodeMap);
      branch[i] = <Branch>nodeMap.get(config.para[i].id)
    }
    for (let i = 0; i < 9; i++) {
      leaf[i] = <Leaf>nodeMap.get(config.text[i].id)
    }
    for (let node of nodeMap.values()) {
      node.commit();
    }
  });

  it('converts to json recursively', () => {
    assert.deepStrictEqual(root.toJson(), page)
  })

  it('maintains children', () => {
    assert.strictEqual(root.getChildrenNum(), 3)
    assert.strictEqual(root.getIndexedChild(-1), undefined)
    assert.strictEqual(root.getIndexedChild(0), branch[0])
    assert.strictEqual(root.getLastChild(), branch[2])
    assert.strictEqual(root.getIndexedChild(3), undefined)
  })

  describe('Undo', () => {
    it('undoes and sets children to []', () => {
      root.undo(nodeMap)

      assert.strictEqual(root.getChildrenNum(), 0)
    })

    it('reconstruct the tree after undo', () => {
      for (let node of nodeMap.values()) {
        node.undo(nodeMap);
      }
      root.assembleChlildren(nodeMap)

      assert.deepStrictEqual(root.toJson(), page)
    })
  })
  
  describe('Detach single node', () => {

    it('detaches in the front', () => {
      root.detachChildren(0, 1)

      assert.strictEqual(root.getChildrenNum(), 2)
      assert(!root.isAncestor(branch[0]))
      assert(!root.isAncestor(leaf[2]))
    })

    it('detaches in the middle', () => {
      root.detachChildren(1, 1)

      assert.strictEqual(root.getChildrenNum(), 2)
      assert(!root.isAncestor(branch[1]))
      assert(!root.isAncestor(leaf[3]))
    })

    it('detaches in the end', () => {
      root.detachChildren(2, 1)

      assert.strictEqual(root.getChildrenNum(), 2)
      assert(!root.isAncestor(branch[3]))
      assert(!root.isAncestor(leaf[6]))
    })
  })

  describe('Detach mutliple nodes', () => {

    it('detaches in the front', () => {
      root.detachChildren(0, 2)

      assert.strictEqual(root.getChildrenNum(), 1)
      assert(!root.isAncestor(branch[1]))
      assert(!root.isAncestor(leaf[5]))
    })

    it('detaches in the end', () => {
      root.detachChildren(1, 2)

      assert.strictEqual(root.getChildrenNum(), 1)
      assert(!root.isAncestor(branch[2]))
      assert(!root.isAncestor(leaf[8]))
    })

    it('detaches with partial overlap', () => {
      root.detachChildren(2, 2)

      assert.strictEqual(root.getChildrenNum(), 2)
      assert(!root.isAncestor(branch[2]))
      assert(!root.isAncestor(leaf[8]))
    })

    it('detaches without overlap', () => {
      root.detachChildren(3, 2)

      assert.strictEqual(root.getChildrenNum(), 3)
    })

  })

  describe('attach single node', () => {
    beforeEach(() => {
      root.detachChildren(2, 1);
    })

    it('attach in the front', () => {
      root.attachChildren(branch[2], 0)

      assert.strictEqual(root.getChildrenNum(), 3)
      assert.strictEqual(root.getIndexedChild(0), branch[2])
      assert(root.isAncestor(leaf[8]));
    })

    it('attach in the middle', () => {
      root.attachChildren(branch[2], 1)

      assert.strictEqual(root.getChildrenNum(), 3)
      assert.strictEqual(root.getIndexedChild(1), branch[2])
      assert(root.isAncestor(leaf[8]));
    })

    it('attach in the end', () => {
      root.attachChildren(branch[2], 2)

      assert.strictEqual(root.getChildrenNum(), 3)
      assert.strictEqual(root.getIndexedChild(2), branch[2])
      assert(root.isAncestor(leaf[8]));
    })

    it('attach in the far end', () => {
      root.attachChildren(branch[2], 10)

      assert.strictEqual(root.getChildrenNum(), 3)
      assert.strictEqual(root.getIndexedChild(2), branch[2])
      assert(root.isAncestor(leaf[8]));
    })

  })

  describe('attach multiple node', () => {
    beforeEach(() => {
      root.detachChildren(1, 2);
    })

    it('attach in the front', () => {
      root.attachChildren(branch[1], 0)

      assert.strictEqual(root.getChildrenNum(), 3)
      assert.strictEqual(root.getIndexedChild(1), branch[2])
      assert(root.isAncestor(leaf[8]));
    })

    it('attach in the end', () => {
      root.attachChildren(branch[1], 1)

      assert.strictEqual(root.getChildrenNum(), 3)
      assert.strictEqual(root.getIndexedChild(2), branch[2])
      assert(root.isAncestor(leaf[8]));
    })

    it('attach in the far end', () => {
      root.attachChildren(branch[1], 10)

      assert.strictEqual(root.getChildrenNum(), 3)
      assert.strictEqual(root.getIndexedChild(2), branch[2])
      assert(root.isAncestor(leaf[8]));
    })

  })

  describe('Ancestor', () => {

    it('is ancestor of itself', () => {
      assert(root.isAncestor(root))
    })

    it('is ancestor of its child', () => {
      let branch = <Subject>nodeMap.get(config.para[0].id)

      assert(root.isAncestor(branch))
    })

    it('is ancestor of its grand-child', () => {
      let leaf = <Subject>nodeMap.get(config.text[0].id)

      assert(root.isAncestor(leaf))
    })

    it('is not ancestor of others', () => {
      let otherBranch = new Branch(page.id + '#other');

      assert(!root.isAncestor(otherBranch))
    })

  })

  describe('about title & #nextNode & delete', () => {

    it('sets title', () => {
      root.set({ title: 'Welcome' })

      assert.strictEqual(root.get('title'), 'Welcome')
    })

    it('throws on parsing #nextNode predicate', () => {
      let turtle = `<${page.id}> <${ont.sdoc.next}> <${config.para[0].id}>.`;
      let quads = parser.parse(turtle)

      assert.throws(() => {
        root.fromQuad(quads[0], nodeMap)
      })
    })

    it('throws on setNext(node)', () => {
      let next = new Root(config.para[0].id)

      assert.throws(() => {
        root.setNext(next)
      });
    })

    it('is ok to setNext(undefined)', () => {
      root.setNext(undefined)

      assert.strictEqual(root.getNext(), undefined)
    })

    it('disallows deletion', () => {
      assert.throws(() => {
        root.delete()
      })
    })
  })

});
