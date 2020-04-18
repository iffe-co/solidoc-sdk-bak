import { Branch, Leaf } from '../src/Node';
import { Page } from '../src/Page'
import * as assert from 'power-assert';

describe('Branch', () => {
  let para1: Branch
  // let para2: Branch

  let text1: Leaf
  let text2: Leaf
  let text3: Leaf
  let text4: Leaf

  let page = new Page('http://example.org/alice', '')

  describe('Insertion', () => {

    beforeEach(() => {
      para1 = <Branch>page.createNode('http://example.org/alice#tag1', 'http://www.solidoc.net/ontologies#Paragraph');
      // para2 = <Branch>page.createNode('http://example.org/alice#tag2', 'http://www.solidoc.net/ontologies#Paragraph');

      text1 = <Leaf>page.createNode('http://example.org/alice#text1', 'http://www.solidoc.net/ontologies#Leaf');
      text2 = <Leaf>page.createNode('http://example.org/alice#text2', 'http://www.solidoc.net/ontologies#Leaf');
      text3 = <Leaf>page.createNode('http://example.org/alice#text3', 'http://www.solidoc.net/ontologies#Leaf');
      text4 = <Leaf>page.createNode('http://example.org/alice#text4', 'http://www.solidoc.net/ontologies#Leaf');
    });

    it('converts to Json', () => {
      assert.deepStrictEqual(para1.toJson(), {
        id: 'tag1',
        type: '',
        children: []
      })
    })

    it('inserts one child to a parent without children', () => {
      para1.insertChildren(text1, 0);
      assert.strictEqual(para1.getChildrenNum(), 1);
      assert.strictEqual(para1.getIndexedChild(0), text1)
      assert.strictEqual(para1.getIndexedChild(1), undefined)
      assert.strictEqual(para1.getIndexedChild(-1), undefined)
      assert.strictEqual(para1.getLastChild(), text1)
    })

    it('inserts a bunch of children to parent without children', () => {
      text1.setNext(text2)
      para1.insertChildren(text1, 0);
      assert.strictEqual(para1.getChildrenNum(), 2);
    })

    it('inserts a bunch of children to the tail', () => {
      text1.setNext(text2)
      para1.insertChildren(text1, Infinity);
      assert.strictEqual(para1.getChildrenNum(), 2);
    })

    it('inserts a bunch of children to parent with existing children', () => {
      text1.setNext(text2)
      para1.insertChildren(text1, 0);
      text3.setNext(text4)
      para1.insertChildren(text3, 1);
      assert.strictEqual(para1.getChildrenNum(), 4);
    })

    it('throws on inserting an undefined child', () => {
      try {
        para1.insertChildren(undefined, 0)
      } catch (e) {
        return
      }
      assert(0)
    })
  })

  describe('Deletion', () => {

    beforeEach(() => {
      para1 = <Branch>page.createNode('http://example.org/alice#tag1', 'http://www.solidoc.net/ontologies#Paragraph');
      text1 = <Leaf>page.createNode('http://example.org/alice#text1', 'http://www.solidoc.net/ontologies#Leaf');
      text2 = <Leaf>page.createNode('http://example.org/alice#text2', 'http://www.solidoc.net/ontologies#Leaf');
      text3 = <Leaf>page.createNode('http://example.org/alice#text3', 'http://www.solidoc.net/ontologies#Leaf');
      text4 = <Leaf>page.createNode('http://example.org/alice#text4', 'http://www.solidoc.net/ontologies#Leaf');

      para1.insertChildren(text1, 0);
      para1.insertChildren(text2, 1);
      para1.insertChildren(text3, 2);
      para1.insertChildren(text4, 3);
    })

    it('throws on deleting if length <= 0', () => {
      try {
        para1.removeChildren(0, 0)
      } catch (e) {
        return
      }
      assert(0)
    });

    it('deletes at the beginning', () => {
      para1.removeChildren(0, 1);
      assert.strictEqual(para1.getChildrenNum(), 3);
      assert.strictEqual(para1.getIndexedChild(0), text2)
      assert.strictEqual(para1.getIndexedChild(1), text3)
      assert.strictEqual(para1.getIndexedChild(2), text4)
    })

    it('deletes in the middle', () => {
      para1.removeChildren(1, 2);
      assert.strictEqual(para1.getChildrenNum(), 2);
    })

    it('deletes all', () => {
      para1.removeChildren(0, Infinity);
      assert.strictEqual(para1.getChildrenNum(), 0)
    })

  })

});

