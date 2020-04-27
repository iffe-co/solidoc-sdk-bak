import { Subject, Branch, Leaf, createSubject } from '../src/Subject'
import { config } from '../config/test'
import * as assert from 'power-assert';

const subjectMap = new Map<string, Subject>();

const para0 = config.para[0]
let branch: Branch
let leaf: Leaf[] = []

describe('Branch', () => {

  beforeEach(() => {
    subjectMap.clear()

    branch = <Branch>createSubject(para0, subjectMap);

    leaf[0] = <Leaf>createSubject(config.text[0], subjectMap);
    leaf[1] = <Leaf>createSubject(config.text[1], subjectMap);
    leaf[2] = <Leaf>createSubject(config.text[2], subjectMap);

    leaf[0].set({next: config.text[1].id});
    leaf[1].set({next: config.text[2].id});
    branch.set({'firstChild': leaf[0].get('id')})

  });

  it('converts to Json', () => {
    assert.deepStrictEqual(branch.toJsonRecursive(subjectMap), para0)
  });
  
  it('converts to blank Json', () => {
    assert.deepStrictEqual(branch.toJson(), {
      ...para0,
      children: []
    })
  })



});


