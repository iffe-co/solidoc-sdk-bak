import { Subject, Branch, Leaf, createSubject } from '../src/Subject'
import { config } from '../config/test'
import * as assert from 'power-assert';

const subjectMap = new Map<string, Subject>();

let branch: Branch
let leaf: Leaf[] = []

describe('Branch', () => {

  beforeEach(() => {
    subjectMap.clear()

    branch = <Branch>createSubject(config.para[0], subjectMap);

    leaf[0] = <Leaf>createSubject(config.text[0], subjectMap);
    leaf[1] = <Leaf>createSubject(config.text[1], subjectMap);
    leaf[2] = <Leaf>createSubject(config.text[2], subjectMap);

    branch.set(config.para[0])
    leaf[0].set(config.text[0], config.text[1])
    leaf[1].set(config.text[1], config.text[2])
  });
  
  it('converts to blank Json', () => {
    assert.deepStrictEqual(branch.toJson(), {
      ...config.para[0],
      children: []
    })
  })
});


