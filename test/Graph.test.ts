import { config as cfg, turtle } from '../config/test'
import { ont } from '../config/ontology';
import * as assert from 'power-assert';

import { Graph } from '../src/Graph';
import { Subject, Root, Branch, Leaf } from '../src/Subject';



describe('Graph', () => {
  let graph: Graph;
  let root: Subject
  let turtleAll = '';
  turtleAll += turtle.page + '\n';
  turtleAll += turtle.para.join('\n') + '\n'
  turtleAll += turtle.text.join('\n') + '\n'

  beforeEach(() => {
    graph = new Graph(cfg.page.id, turtleAll)
    root = graph.getRoot()
  })

  describe('Constructor', () => {

    it('constructs the root ', () => {
      assert(root instanceof Root)
      assert.strictEqual(root, graph.getSubject(cfg.page.id))
      assert.strictEqual(root.isDeleted(), false)
      assert.strictEqual(root.isFromPod(), true)
    })

    it('constructs branch subject', () => {
      let branch0 = graph.getSubject(cfg.para[0].id)
      let branch2 = graph.getSubject(cfg.para[2].id)

      assert(branch0 instanceof Branch);
      assert.strictEqual(branch0.get('next'), cfg.para[1].id)
      assert.strictEqual(branch2.get('next'), '')
    })

    it('constructs leaf subject', () => {
      let leaf0 = graph.getSubject(cfg.text[0].id)
      let leaf2 = graph.getSubject(cfg.text[2].id)

      assert(leaf0 instanceof Leaf);
      assert.strictEqual(leaf0.get('next'), cfg.text[1].id)
      assert.strictEqual(leaf2.get('next'), '')
    })

    it('does not construct a subject without type definition', () => {
      let tempId = cfg.page.id + '#temp';
      let turtleTemp = turtleAll + `<${tempId}> <${ont.sdoc.text}> "ABC".`
      
      assert.throws(() => {
        new Graph(cfg.page.id, turtleTemp);
      });
    })

    it('does not construct a subject with an unknown type')
    it('handles a subject with multiple type definitions')

  })

  describe('Sparql-update', () => {

    it('generates null sparql when no change applied', () => {
      let sparql = graph.getSparqlForUpdate()

      assert(!sparql)
    })
  });

  describe('Commits and Undoes', () => {

    it('commits to remove deleted subject from memory', () => {
      let branch0 = graph.getSubject(cfg.para[0].id);
      branch0.delete();
      graph.commit()

      assert.throws(() => {
        graph.getSubject(cfg.para[0].id)
      });
    });

    it('undoes to remove new subject from memory', () => {
      let tempId = cfg.page.id + '#temp';
      graph.createSubject({
        id: tempId,
        type: ont.sdoc.branch,
        children: []
      })
      graph.undo();

      assert.throws(() => {
        graph.getSubject(tempId)
      })
    })

    it('undoes to recover #nextNode', () => {
      let branch0 = graph.getSubject(cfg.para[0].id)
      branch0.set(cfg.para[0], cfg.para[0]); // meaningless and illegal, but ok for test
      graph.undo()

      assert.strictEqual(branch0.get('next'), cfg.para[1].id)
    })

  })

});

