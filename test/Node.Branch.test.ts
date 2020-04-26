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

  });

  it('converts to Json', () => {
    assert.deepStrictEqual(branch.toJsonRecursive(nodeMap), para0)
  });
  
  it('converts to blank Json', () => {
    assert.deepStrictEqual(branch.toJson(), {
      ...para0,
      children: []
    })
  })



});


