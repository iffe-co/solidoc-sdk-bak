import { config as cfg, turtle, config } from '../config/test';
import { ont } from '../config/ontology';
import * as assert from 'power-assert';

import { Graph } from '../src/Graph';
import { Subject } from '../src/Subject';

describe('Graph', () => {
  let graph: Graph;
  let root: Subject;
  let turtleAll = '';
  turtleAll += turtle.page + '\n';
  turtleAll += turtle.para.join('\n') + '\n';
  turtleAll += turtle.text.join('\n') + '\n';

  beforeEach(() => {
    graph = new Graph(cfg.page.id, turtleAll);
    root = graph.getRoot();
  });

  describe('Constructor', () => {
    it('constructs the root ', () => {
      assert.strictEqual(root, graph.getSubject(cfg.page.id));
    });

    it('constructs branch subject', () => {
      let branch0 = graph.getSubject(cfg.para[0].id);
      let branch2 = graph.getSubject(cfg.para[2].id);

      assert.strictEqual(
        graph.getValue(branch0.id, ont.sdoc.next),
        cfg.para[1].id,
      );
      assert.strictEqual(graph.getValue(branch2.id, ont.sdoc.next), undefined);
    });

    it('constructs leaf subject', () => {
      let leaf0 = graph.getSubject(cfg.text[0].id);
      let leaf2 = graph.getSubject(cfg.text[2].id);

      assert.strictEqual(
        graph.getValue(leaf0.id, ont.sdoc.next),
        cfg.text[1].id,
      );
      assert.strictEqual(graph.getValue(leaf2.id, ont.sdoc.next), undefined);
    });

    it('disallows creating a duplicated subject', () => {
      assert.throws(() => {
        graph.createSubject(cfg.para[2].id);
      }, /^Error: Duplicated subject creation/);
    });

    it('allows creating a duplicated predicate', () => {
      assert.doesNotThrow(() => {
        graph.createPredicate(ont.sdoc.next);
      });
    });

    it('throws on getting a non-existing predicate', () => {
      assert.throws(() => {
        graph.getPredicate(ont.sdoc.checked);
      });
    });

    it('handles a subject with multiple type definitions');

    it('parses from an empty string', () => {
      graph = new Graph(cfg.page.id, '');
      assert.deepStrictEqual(graph.getRoot().id, config.page.id);
    });
  });

  describe('Sparql-update', () => {
    it('generates null sparql when no change applied', () => {
      graph.commit();
      let sparql = graph.getSparqlForUpdate();

      assert(!sparql);
    });
  });

  describe('Commits and Undoes', () => {
    it('commits to remove deleted subject from memory', () => {
      let branch0 = graph.getSubject(cfg.para[0].id);
      branch0.isDeleted = true;
      graph.commit();

      assert.throws(() => {
        graph.getSubject(cfg.para[0].id);
      });
    });

    it('undoes to remove new subject from memory', () => {
      let tempId = cfg.page.id + '#temp';
      let subject = graph.createSubject(tempId);
      subject.isInserted = true;
      graph.undo();

      assert.throws(() => {
        graph.getSubject(tempId);
      });
    });

    it('undoes to recover #nextNode', () => {
      let branch0 = graph.getSubject(cfg.para[0].id);
      graph.setValue(branch0.id, ont.sdoc.next, branch0.id); // meaningless and illegal, but ok for test
      graph.undo();

      assert.strictEqual(
        graph.getValue(branch0.id, ont.sdoc.next),
        cfg.para[1].id,
      );
    });
  });
});
