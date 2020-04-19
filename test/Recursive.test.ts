import { Subject } from '../src/Subject'
import { Root, Branch, Leaf, createNode } from '../src/Node';
import { config as cfg } from '../config/test'
import * as assert from 'power-assert';

import * as n3 from 'n3';
// import { ont } from '../config/ontology';
const parser = new n3.Parser();

const nodeMap = new Map<string, Subject>();

describe('Branch', () => {
  let root: Root

  let branch: Branch[] = []

  let leaf: Leaf[] = []

  beforeEach(() => {
    root = <Root>createNode(cfg.page.uri, cfg.page.type, nodeMap);
    let quads = parser.parse(cfg.page.turtle)
    quads.forEach(quad => {
      root.fromQuad(quad, nodeMap)
    });
  

    branch[0] = <Branch>createNode(cfg.para[0].uri, cfg.para[0].type, nodeMap);
    branch[1] = <Branch>createNode(cfg.para[1].uri, cfg.para[1].type, nodeMap);
    branch[2] = <Branch>createNode(cfg.para[2].uri, cfg.para[2].type, nodeMap);
    for (let i = 0; i < 3; i++) {
      let quads = parser.parse(cfg.para[i].turtle)
      quads.forEach(quad => {
        branch[i].fromQuad(quad, nodeMap)
      });
    }

    for (let i = 0; i < 9; i++) {
      leaf[i] = <Leaf>createNode(cfg.text[i].uri, cfg.text[i].type, nodeMap);
    }
    for (let i = 0; i < 9; i++) {
      let quads = parser.parse(cfg.text[i].turtle)
      quads.forEach(quad => {
        leaf[i].fromQuad(quad, nodeMap)
      });
    }
  });

  describe('Tree structure assembling', () => {

    it('tree', () => {
      assert(true)
    })

  })
});
  


