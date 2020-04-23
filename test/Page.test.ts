import { Page } from '../src/Page';
import { config as cfg, turtle } from '../config/test'
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
    page = new Page(cfg.page.id, turtleAll);
    assert.deepStrictEqual(page.toJson(), cfg.page);
  });

  it('parses from an empty string', () => {
    page = new Page(cfg.page.id, '');
    assert.deepStrictEqual(page.toJson(), page.getRoot()?.toJson());
  });

});

describe('Operations', () => {
  let op0: Operation;
  let op1: Operation;
  let op2: Operation;
  let op3: Operation;

  beforeEach(() => {
    op0 = {
      type: 'insert_node',
      path: { parentId: cfg.page.id, offset: 0 },
      node: cfg.para[0]
    }
    op1 = {
      type: 'insert_node',
      path: { parentId: cfg.page.id, offset: 1 },
      node: cfg.para[1]
    }
    op2 = {
      type: 'insert_node',
      path: { parentId: cfg.page.id, offset: 2 },
      node: cfg.para[2]
    }
    op3 = {
      type: 'insert_node',
      path: { parentId: cfg.para[0].id, offset: 1 },
      node: cfg.text[3]
    }
  });

  describe('Insert Node', () => {

    beforeEach(() => {
      page = new Page(cfg.page.id, '');
      page.getRoot()?.set(cfg.page)
    })

    it('inserts a paragraph', () => {
      page.apply(op0)

      assert.deepStrictEqual(page.toJson().children[0], cfg.para[0])
      assert(!page.getNode(cfg.para[0].id)?.isFromPod())
      assert(!page.getNode(cfg.text[0].id)?.isFromPod())
    })

    it('inserts a second paragraph', () => {
      page.apply(op0)
      page.apply(op1)

      assert.deepStrictEqual(page.toJson().children[1], cfg.para[1])
      assert(!page.getNode(cfg.para[1].id)?.isFromPod())
      assert(!page.getNode(cfg.text[4].id)?.isFromPod())
    })

    it('inserts a third paragraph', () => {
      page.apply(op0)
      page.apply(op1)
      page.apply(op2)

      assert.deepStrictEqual(page.toJson(), cfg.page)
      assert(!page.getNode(cfg.para[2].id)?.isFromPod())
      assert(!page.getNode(cfg.text[8].id)?.isFromPod())
    })

    it('throws if parent is not found', () => {
      op0.path.parentId = cfg.page.id + '#fake';
      assert.throws(() => {
        page.apply(op0)
      })
    })

    it('inserts a text node', () => {
      page.apply(op0);
      page.apply(op3);

      assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0], cfg.text[3], cfg.text[1], cfg.text[2]])
    })

    it('throws if parent is a leaf node', () => {
      page.apply(op0)
      op3.path.parentId = cfg.text[0].id;
      assert.throws(() => {
        page.apply(op3)
      })
    })

    it('inserts to the tail if offset > length', () => {
      page.apply(op0);
      op1.path.offset = 100
      page.apply(op1);

      assert(page.toJson().children[1], cfg.para[1])
    })

    it('disallows inserting to offset < 0', () => {
      op0.path.offset = -1;
      assert.throws(() => {
        page.apply(op0)
      })
    })

    it('disallows inserting with a duplicated node', () => {
      page.apply(op0)
      assert.throws(() => {
        page.apply(op0)
      })
    })

    it('undoes', () => {
      page.apply(op0)
      page.apply(op1)
      page.apply(op2)
      page.undo()

      assert.deepStrictEqual(page.toJson(), page.getRoot()?.toBlankJson())
      assert.strictEqual(page.getNode(cfg.para[0].id), undefined)
      assert.strictEqual(page.getNode(cfg.text[0].id), undefined)
    });
  });

  describe('Remove Node', () => {
    beforeEach(() => {
      page = new Page(cfg.page.id, turtleAll);
      op0 = {
        type: 'remove_node',
        path: { parentId: cfg.page.id, offset: 0 }
      }
      op1 = {
        type: 'remove_node',
        path: { parentId: cfg.page.id, offset: 1 }
      }
      op2 = {
        type: 'remove_node',
        path: { parentId: cfg.page.id, offset: 2 }
      }
      op3 = {
        type: 'remove_node',
        path: { parentId: cfg.para[0].id, offset: 1 }
      }

    });

    it('removes a paragraph in the beginning', () => {
      page.apply(op0)

      assert.deepStrictEqual(page.toJson().children, [cfg.para[1], cfg.para[2]])
      assert(page.getNode(cfg.para[0].id)?.isDeleted())
      assert(page.getNode(cfg.text[0].id)?.isDeleted())
    });

    it('removes a paragraph in the middle', () => {
      page.apply(op1)

      assert.deepStrictEqual(page.toJson().children, [cfg.para[0], cfg.para[2]])
      assert(page.getNode(cfg.para[1].id)?.isDeleted())
      assert(page.getNode(cfg.text[4].id)?.isDeleted())
    });

    it('removes a paragraph in the end', () => {
      page.apply(op2)

      assert.deepStrictEqual(page.toJson().children, [cfg.para[0], cfg.para[1]])
      assert(page.getNode(cfg.para[2].id)?.isDeleted())
      assert(page.getNode(cfg.text[8].id)?.isDeleted())
    });

    it('does nothing to remove at offset > length', () => {
      op0.path.offset = 100
      page.apply(op0)

      assert.deepStrictEqual(page.toJson(), cfg.page)
    });

    it('removes a text node', () => {
      page.apply(op3);

      assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0], cfg.text[2]])
    });

    it('throws if parent is not found', () => {
      op0.path.parentId = cfg.page.id + '#fake';
      assert.throws(() => {
        page.apply(op0)
      })
    });

    it('throws if parent is a leaf node', () => {
      op3.path.parentId = cfg.text[0].id;
      assert.throws(() => {
        page.apply(op3)
      })
    })

    it('throws on offset < 0', () => {
      op3.path.offset = -1;
      assert.throws(() => {
        page.apply(op3)
      })
    })

    it('undoes to the original state after a bunch of operations', () => {
      page.apply(op2);
      page.apply(op1);
      page.undo();

      assert.deepStrictEqual(page.toJson(), cfg.page);
      assert.deepStrictEqual(page.getSparqlForUpdate(), '')
    })

  });

  describe('Move Node', () => {
    beforeEach(() => {
      page = new Page(cfg.page.id, turtleAll);
      op0 = {
        type: 'move_node',
        path: { parentId: cfg.page.id, offset: 0 },
        newPath: { parentId: cfg.page.id, offset: 1 },
      }
      op1 = {
        type: 'move_node',
        path: { parentId: cfg.page.id, offset: 1 },
        newPath: { parentId: cfg.para[0].id, offset: 1 },
      }
      op2 = {
        type: 'move_node',
        path: { parentId: cfg.para[0].id, offset: 0 },
        newPath: { parentId: cfg.para[1].id, offset: 2 },
      }
      op3 = {
        type: 'move_node',
        path: { parentId: cfg.para[0].id, offset: 2 },
        newPath: { parentId: cfg.page.id, offset: 3 },
      }
    });

    it('moves a branch to the same level', () => {
      page.apply(op0)

      assert.deepStrictEqual(page.toJson().children, [cfg.para[1], cfg.para[0], cfg.para[2]])
    });

    it('moves a branch to a lower level', () => {
      page.apply(op1)

      assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0], cfg.para[1], cfg.text[1], cfg.text[2]])
      assert.deepStrictEqual(page.toJson().children[1], cfg.para[2])
    })

    it('moves a leaf across branches', () => {
      page.apply(op2)

      assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[1], cfg.text[2]])
      assert.deepStrictEqual(page.toJson().children[1].children, [cfg.text[3], cfg.text[4], cfg.text[0], cfg.text[5]])
    })

    it('moves a leaf to an upper level', () => {
      page.apply(op3)

      assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0], cfg.text[1]])
      assert.deepStrictEqual(page.toJson().children[3], cfg.text[2])
    })

    it('disallows moving below a child', () => {
      page.apply(op1)
      op0.newPath.parentId = cfg.para[1].id

      assert.throws(() => {
        page.apply(op0)
      })
    });

    it('disallows moving below itself', () => {
      op0.newPath.parentId = cfg.para[0].id

      assert.throws(() => {
        page.apply(op0)
      })
    });

    it('throws if the parent is not found', () => {
      op0.path.parentId = cfg.page.id + '#fake';
      assert.throws(() => {
        page.apply(op0)
      })
    })

    it('throws if the newParent is not found', () => {
      op0.newPath.parentId = cfg.page.id + '#fake';
      assert.throws(() => {
        page.apply(op0)
      })
    })

    it('throws if the parent is a leaf', () => {
      op0.path.parentId = cfg.text[0].id;
      assert.throws(() => {
        page.apply(op0)
      })
    })

    it('throws if the newParent is a leaf', () => {
      op0.newPath.parentId = cfg.text[4].id;
      assert.throws(() => {
        page.apply(op0)
      })
    })

    it('throws if the moving node is not found', () => {
      op0.path.offset = 10;
      assert.throws(() => {
        page.apply(op0)
      })
    })

    it('is ok to move a node to offset > length', () => {
      op3.newPath.offset = 10
      page.apply(op3)

      assert.deepStrictEqual(page.toJson().children[0].children, [cfg.text[0], cfg.text[1]])
    })

  });


});



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
//     let op1: Operation = { type: 'set_node', path: { parentId: pageId, offset: 0 }, newProperties: { name: 'alice' } }
//     let op2: Operation = { type: 'set_node', path: { parentId: pageId, offset: 0 }, newProperties: { name: null, age: 25 } }
//     page.apply(op1)
//     page.apply(op2)
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
