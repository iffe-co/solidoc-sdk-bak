import { Branch, Root, createSubject } from '../src/Subject'
import { ont } from '../config/ontology'
import { config } from '../config/test'
import { Element } from '../src/interface'
import * as assert from 'power-assert';
import * as _ from 'lodash'

// import * as n3 from 'n3';
// const parser = new n3.Parser();


describe('src/Subject.ts', () => {
  let branch1: Branch;
  let branch2: Branch;
  let para1: Element
  let para2: Element
  // let quads: any[];

  beforeEach(() => {
    para1 = _.cloneDeep(config.para[1])
    para2 = _.cloneDeep(config.para[2])
    branch2 = <Branch>createSubject(para2, config.page.id);
  });

  describe('Create Node', () => {

    it('constructs an empty node', () => {
      assert.strictEqual(branch2.get('id'), config.para[2].id)
      assert.strictEqual(branch2.get('type'), config.para[2].type)
      assert.strictEqual(branch2.get('next'), '')
      assert.strictEqual(branch2.get('firstChild'), '')
      assert.strictEqual(branch2.get('option'), '{}')
      assert(!branch2.isDeleted())
      assert(!branch2.isFromPod())
    })

    it('translates to Json', () => {
      assert.deepStrictEqual(branch2.toJson(), {
        ...config.para[2],
        children: [],
      });
    });

    // it('parses from quads', () => {
    //   quads = parser.parse(turtle.para[2]);
    //   quads.forEach(quad => branch2.fromQuad(quad));

    //   assert.equal(branch2.get('firstChild'), config.para[2].children[0].id);
    // })

    // it('discards an unknown quad', () => {
    //   let turtle = `<${config.para[2].id}> <${ont.sdoc.text}> "abc".`;
    //   let quads = parser.parse(turtle)
    //   branch2.fromQuad(quads[0])

    //   assert(!branch2.isFromPod())
    // });

  })

  describe('Sets and gets', () => {

    it('sets and gets a known property', () => {
      para2.type = ont.sdoc.numberedList
      branch2.set(para2);

      assert.strictEqual(branch2.get('type'), ont.sdoc.numberedList);
    });

    it('throws on getting an unkown property', () => {
      assert.throws(() => {
        branch2.get('unknown')
      })
    })

    it('adds an optional property', () => {
      para2.author = 'alice'
      branch2.set(para2);

      assert.deepStrictEqual(JSON.parse(branch2.get('option')), {
        author: "alice",
      })
    })

    it('modifies optional property', () => {
      para2.author = 'alice'
      branch2.set(para2)
      branch2.commit()
      para2.author = 'bob'
      branch2.set(para2)

      let json: any = branch2.toJson();
      assert.strictEqual(json.author, 'bob');
    })
  });

  describe('#nextNode property', () => {
    beforeEach(() => {
      branch1 = <Branch>createSubject(para1, config.page.id);
    })

    it('setNext() is together with set("next")', () => {
      branch1.set(para1, branch2)

      assert.strictEqual(branch1.get('next'), branch2.get('id'));
    });

    // it('parses #nextNode from quads and synced with getNext()', () => {
    //   let quads = parser.parse(turtle.para[1])
    //   // note the index of quads
    //   branch1.fromQuad(quads[1])

    //   assert.strictEqual(branch1.get('next'), config.para[2].id)
    // })

    it('unsets next', () => {
      branch1.set(para1, branch2)
      branch1.commit()
      branch1.set(para1)
      assert.strictEqual(branch1.get('next'), '')
    })
  });

  describe('performs deletion', () => {

    beforeEach(() => {
      branch2.delete()
    })

    it('performs deletion', () => {
      assert.strictEqual(branch2.isDeleted(), true)
    });

    it('throws on setting a deleted node', () => {
      assert.throws(() => {
        branch2.set(para2);
      })
    })

    it('generates sparql after deletion', () => {
      const sparql = branch2.getSparqlForUpdate();

      assert.strictEqual(sparql, `DELETE WHERE { GRAPH <${config.page.id}> { <${config.para[2].id}> ?p ?o } };\n`);
    });

  });

  describe('commits', () => {

    it('commits attributes', () => {
      para2.type = ont.sdoc.numberedList
      branch2.set(para2)
      branch2.commit()
      branch2.undo()

      assert.strictEqual(branch2.get('type'), ont.sdoc.numberedList)
      assert(branch2.isFromPod())
    })

    it('disallows committing a deleted node', () => {
      branch2.delete();

      assert.throws(() => {
        branch2.commit();
      })
    })

  })

  describe('undoes', () => {
    beforeEach(() => {
      branch1 = <Branch>createSubject(config.para[1], config.page.id);
    })

    it('disallows undoing a non-existOnPod node', () => {
      assert.throws(() => {
        branch2.undo()
      });
    })

    it('undoes deletion', () => {
      branch2.setFromPod()  // otherwise it disallows undo
      branch2.delete();
      branch2.undo();

      assert.strictEqual(branch2.isDeleted(), false);
    });

    it('undoes attributes', () => {
      branch2.commit() // so {type: Paragraph} becomes value
      para2.type = ont.sdoc.numberedList
      branch2.set(para2)
      branch2.delete()
      branch2.undo()

      assert.strictEqual(branch2.get('type'), config.para[2].type)
    })

    it('undoes next', () => {
      branch2.setFromPod()  // otherwise it disallows undo
      branch2.set(para2, branch1);
      branch2.undo();

      assert.strictEqual(branch2.get('next'), '')
    })
  });

});



describe('Root', () => {
  const page = config.page
  let root: Root;

  beforeEach(() => {
    root = <Root>createSubject(page, config.page.id);
  });


  it('sets title', () => {
    let pageCloned = _.cloneDeep(page);
    pageCloned.title = 'Welcome'
    root.set(pageCloned)

    assert.strictEqual(root.get('title'), 'Welcome')
  })

  // it('throws on parsing #nextNode predicate', () => {
  //   let turtle = `<${page.id}> <${ont.sdoc.next}> <${config.para[0].id}>.`;
  //   let quads = parser.parse(turtle)

  //   assert.throws(() => {
  //     root.fromQuad(quads[0])
  //   })
  // })

  it('throws on set("next")', () => {
    assert.throws(() => {
      root.set(page, config.para[0])
    });
  })

  it('disallows deletion', () => {
    assert.throws(() => {
      root.delete()
    })
  })

});



// describe('Leaf', () => {
//   let leaf: Leaf;
//   const text = config.text[8]
//   const quads: any[] = parser.parse(turtle.text[8]);
  
//   beforeEach(() => {
//     leaf = <Leaf>createSubject(text, config.page.id);
//     quads.forEach(quad => leaf.fromQuad(quad));
//   });

//   it('parses from quads', () => {
//     assert.strictEqual(leaf.get('id'), text.id)
//     assert.strictEqual(leaf.get('type'), text.type)
//     assert.strictEqual(leaf.get('text'), text.text)
//   });
  
//   it('translate to Json', () => {
//     assert.deepStrictEqual(leaf.toJson(), text);
//   })

// });
