import { Page } from '../src/Page';
import { config, turtle } from '../config/test'
import { Operation } from '../src/interface'
import * as assert from 'power-assert';

// let extractChildrenId = (array: any) => {
//   return array.children.map(ele => ele.id.substr(ele.id.indexOf('#') + 1))
// }


let page: Page;
let turtleAll = '';
turtleAll += turtle.page + '\n';
turtleAll += turtle.para.join('\n') + '\n'
turtleAll += turtle.text.join('\n') + '\n'

describe('Create Page', () => {

  it('parses from quads', () => {
    page = new Page(config.page.id, turtleAll);
    assert.deepStrictEqual(page.toJson(), config.page);
  });

  it('parses from an empty string', () => {
    page = new Page(config.page.id, '');
    assert.deepStrictEqual(page.toJson(), page.getRoot()?.toJson());
  });

});

describe('Operations', () => {
  let insertNodeOp0: Operation;
  let insertNodeOp1: Operation;
  let insertNodeOp2: Operation;
  let insertNodeOp3: Operation;

  let removeNodeOp0: Operation;
  let removeNodeOp1: Operation;
  let removeNodeOp2: Operation;
  let removeNodeOp3: Operation;

  beforeEach(() => {
    insertNodeOp0 = {
      type: 'insert_node',
      path: { parentId: config.page.id, offset: 0 },
      node: config.para[0]
    }
    insertNodeOp1 = {
      type: 'insert_node',
      path: { parentId: config.page.id, offset: 1 },
      node: config.para[1]
    }
    insertNodeOp2 = {
      type: 'insert_node',
      path: { parentId: config.page.id, offset: 2 },
      node: config.para[2]
    }
    insertNodeOp3 = {
      type: 'insert_node',
      path: { parentId: config.para[0].id, offset: 1 },
      node: config.text[3]
    }
    removeNodeOp0 = {
      type: 'remove_node',
      path: { parentId: config.page.id, offset: 0 }
    }
    removeNodeOp1 = {
      type: 'remove_node',
      path: { parentId: config.page.id, offset: 1 }
    }
    removeNodeOp2 = {
      type: 'remove_node',
      path: { parentId: config.page.id, offset: 2 }
    }
    removeNodeOp3 = {
      type: 'remove_node',
      path: { parentId: config.para[0].id, offset: 1 }
    }

  });

  describe('Insert Node', () => {

    beforeEach(() => {
      page = new Page(config.page.id, '');
      page.getRoot()?.set(config.page)
    })

    it('inserts a paragraph', () => {
      page.apply(insertNodeOp0)

      assert.deepStrictEqual(page.toJson().children[0], config.para[0])
      assert(!page.getNode(config.para[0].id)?.isFromPod())
      assert(!page.getNode(config.text[0].id)?.isFromPod())
    })

    it('inserts a second paragraph', () => {
      page.apply(insertNodeOp0)
      page.apply(insertNodeOp1)

      assert.deepStrictEqual(page.toJson().children[1], config.para[1])
      assert(!page.getNode(config.para[1].id)?.isFromPod())
      assert(!page.getNode(config.text[4].id)?.isFromPod())
    })

    it('inserts a third paragraph', () => {
      page.apply(insertNodeOp0)
      page.apply(insertNodeOp1)
      page.apply(insertNodeOp2)

      assert.deepStrictEqual(page.toJson(), config.page)
      assert(!page.getNode(config.para[2].id)?.isFromPod())
      assert(!page.getNode(config.text[8].id)?.isFromPod())
    })

    it('throws if parent is not found', () => {
      insertNodeOp0.path.parentId = config.page.id + '#fake';
      assert.throws(() => {
        page.apply(insertNodeOp0)
      })
    })

    it('inserts a text node', () => {
      page.apply(insertNodeOp0);
      page.apply(insertNodeOp3);

      assert.deepStrictEqual(page.toJson().children[0].children, [config.text[0], config.text[3], config.text[1], config.text[2]])
    })

    it('throws if parent is a leaf node', () => {
      page.apply(insertNodeOp0)
      insertNodeOp3.path.parentId = config.text[0].id;
      assert.throws(() => {
        page.apply(insertNodeOp3)
      })
    })

    it('inserts to the tail if offset > length', () => {
      page.apply(insertNodeOp0);
      insertNodeOp1.path.offset = 100
      page.apply(insertNodeOp1);

      assert(page.toJson().children[1], config.para[1])
    })

    it('disallows inserting to offset < 0', () => {
      insertNodeOp0.path.offset = -1;
      assert.throws(() => {
        page.apply(insertNodeOp0)
      })
    })

    it('disallows inserting with a duplicated node', () => {
      page.apply(insertNodeOp0)
      assert.throws(() => {
        page.apply(insertNodeOp0)
      })
    })

    it('undoes', () => {
      page.apply(insertNodeOp0)
      page.apply(insertNodeOp1)
      page.apply(insertNodeOp2)
      page.undo()

      assert.deepStrictEqual(page.toJson(), page.getRoot()?.toBlankJson())
      assert.strictEqual(page.getNode(config.para[0].id), undefined)
      assert.strictEqual(page.getNode(config.text[0].id), undefined)
    });
  });

  describe('Remove Node', () => {
    beforeEach(() => {
      page = new Page(config.page.id, turtleAll);
    });

    it('removes a paragraph in the beginning', () => {
      page.apply(removeNodeOp0)

      assert.deepStrictEqual(page.toJson().children, [config.para[1], config.para[2]])
      assert(page.getNode(config.para[0].id)?.isDeleted())
      assert(page.getNode(config.text[0].id)?.isDeleted())
    });

    it('removes a paragraph in the middle', () => {
      page.apply(removeNodeOp1)

      assert.deepStrictEqual(page.toJson().children, [config.para[0], config.para[2]])
      assert(page.getNode(config.para[1].id)?.isDeleted())
      assert(page.getNode(config.text[4].id)?.isDeleted())
    });

    it('removes a paragraph in the end', () => {
      page.apply(removeNodeOp2)

      assert.deepStrictEqual(page.toJson().children, [config.para[0], config.para[1]])
      assert(page.getNode(config.para[2].id)?.isDeleted())
      assert(page.getNode(config.text[8].id)?.isDeleted())
    });

    it('does nothing to remove at offset > length', () => {
      removeNodeOp0.path.offset = 100
      page.apply(removeNodeOp0)

      assert.deepStrictEqual(page.toJson(), config.page)
    });

    it('removes a text node', () => {
      page.apply(removeNodeOp3);

      assert.deepStrictEqual(page.toJson().children[0].children, [config.text[0], config.text[2]])
    });

    it('throws if parent is not found', () => {
      removeNodeOp0.path.parentId = config.page.id + '#fake';
      assert.throws(() => {
        page.apply(removeNodeOp0)
      })
    });

    it('throws if parent is a leaf node', () => {
      removeNodeOp3.path.parentId = config.text[0].id;
      assert.throws(() => {
        page.apply(removeNodeOp3)
      })
    })

    it('throws on offset < 0', () => {
      removeNodeOp3.path.offset = -1;
      assert.throws(() => {
        page.apply(removeNodeOp3)
      })
    })

    it('undoes to the original state after a bunch of operations', () => {
      page.apply(removeNodeOp2);
      page.apply(removeNodeOp1);
      page.undo();

      assert.deepStrictEqual(page.toJson(), config.page);
      assert.deepStrictEqual(page.getSparqlForUpdate(), '')
    })

  });


  
});


// describe('Move Node', () => {
//   beforeEach(() => {
//     page = new Page(pageId, turtle);
//   });

//   it('moves paragraph 2 to the beginning', () => {
//     let op: Operation = { type: 'move_node', path: { parentId: pageId, offset: 1 }, newPath: { parentId: pageId, offset: 0 } }
//     page.apply(op)
//     let pageJson = page.toJson()
//     assert.deepStrictEqual(extractChildrenId(pageJson), [pid2, pid1])
//     assert.deepStrictEqual(pageJson.children[0].children[0], textJson2)
//   });
//   it('moves paragraph 1 to the end', () => {
//     let op: Operation = { type: 'move_node', path: { parentId: pageId, offset: 0 }, newPath: { parentId: pageId, offset: 1 } }
//     page.apply(op)
//     let pageJson = page.toJson()
//     assert.deepStrictEqual(extractChildrenId(pageJson), [pid2, pid1])
//     assert.deepStrictEqual(pageJson.children[1].children[0], textJson1)
//   });
//   it('moves text', () => {
//     let op: Operation = { type: 'move_node', path: { parentId: paraId1, offset: 0 }, newPath: { parentId: paraId2, offset: 1 } }
//     page.apply(op)
//     let pageJson = page.toJson()
//     assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [])
//     assert.deepStrictEqual(extractChildrenId(pageJson.children[1]), [tid2, tid1])
//   });
//   it('disallows moving below a child', () => {
//     let op: Operation = { type: 'move_node', path: { parentId: pageId, offset: 0 }, newPath: { parentId: paraId1, offset: 0 } }
//     try {
//       page.apply(op)
//     } catch (e) {
//       return
//     }
//     assert(0)
//   });
// });

// describe('Merge Text Node', () => {
//   beforeEach(() => {
//     page = new Page(pageId, turtle);
//     let op: Operation = { type: 'insert_node', path: { parentId: paraId1, offset: 1 }, node: textJson3 }
//     page.apply(op)
//   });
//   it('merges text nodes', () => {
//     let op: Operation = { type: 'merge_node', path: { parentId: paraId1, offset: 1 } }
//     page.apply(op)
//     let pageJson = page.toJson()
//     assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [tid1])
//     assert.strictEqual(pageJson.children[0].children[0].text, textJson1.text + textJson3.text)
//   });
//   // it('throws on merging text node 0', () => {
//   //   let op: Operation = { type: 'merge_node', path: { parentId: paraId1, offset: 0 } }
//   //   try {
//   //     page.apply(op)
//   //   } catch (e) {
//   //     return
//   //   }
//   //   assert(0)
//   // });
//   // it('throws on merging offset > length', () => {
//   //   let op: Operation = { type: 'merge_node', path: { parentId: paraId1, offset: 2 } }
//   //   try {
//   //     page.apply(op)
//   //   } catch (e) {
//   //     return
//   //   }
//   //   assert(0);
//   // });
// });

// describe('Merge Element Node', () => {
//   beforeEach(() => {
//     page = new Page(pageId, turtle);
//     let op: Operation = { type: 'insert_node', path: { parentId: paraId2, offset: 1 }, node: textJson3 }
//     page.apply(op)
//   });
//   it('merges paragraph 2', () => {
//     let op: Operation = { type: 'merge_node', path: { parentId: pageId, offset: 1 } }
//     page.apply(op)
//     let pageJson = page.toJson()
//     assert.deepStrictEqual(extractChildrenId(pageJson.children[0]), [tid1, tid2, tid3])
//   });
//   // it('throws on merging paragraph 1', () => {
//   //   let op: Operation = { type: 'merge_node', path: { parentId: pageId, offset: 0 } }
//   //   try {
//   //     page.apply(op)
//   //   } catch (e) {
//   //     return
//   //   }
//   //   assert(0)
//   // });
//   // it('throws on merging offset > length', () => {
//   //   let op: Operation = { type: 'merge_node', path: { parentId: pageId, offset: 2 } }
//   //   try {
//   //     page.apply(op)
//   //   } catch (e) {
//   //     return
//   //   }
//   //   assert(0)
//   // });
// });

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

// describe('Set Node', () => {
//   beforeEach(() => {
//     page = new Page(pageId, turtle);
//   });

//   // it('sets page title', () => {
//   //   let op: Operation = { type: 'set_node', path: { parentId: '', offset: 0 }, newProperties: { title: 'Welcome' } }
//   //   page.apply(op)
//   //   let pageJson: any = page.toJson()
//   //   assert.strictEqual(pageJson.title, 'Welcome')
//   // })

//   it('sets a paragraph by adding a property', () => {
//     let op: Operation = { type: 'set_node', path: { parentId: pageId, offset: 0 }, newProperties: { name: 'alice' } }
//     page.apply(op)
//     let pageJson = page.toJson()
//     assert.strictEqual(pageJson.children[0].name, 'alice')
//     // TODO: sparql
//   });
//   it('sets a paragraph by adding and removing', () => {
//     let insertNodeOp1: Operation = { type: 'set_node', path: { parentId: pageId, offset: 0 }, newProperties: { name: 'alice' } }
//     let insertNodeOp2: Operation = { type: 'set_node', path: { parentId: pageId, offset: 0 }, newProperties: { name: null, age: 25 } }
//     page.apply(insertNodeOp1)
//     page.apply(insertNodeOp2)
//     let pageJson = page.toJson()
//     assert.strictEqual(pageJson.children[0].name, undefined)
//     assert.strictEqual(pageJson.children[0].age, 25)
//     // TODO: sparql
//   });
//   it('sets a text by adding a property', () => {
//     let op: Operation = { type: 'set_node', path: { parentId: paraId1, offset: 0 }, newProperties: { bold: false } }
//     page.apply(op)
//     let pageJson = page.toJson()
//     assert.strictEqual(pageJson.children[0].children[0].bold, false)
//     // TODO: sparql
//   });
// });
