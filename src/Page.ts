import { Graph } from './Graph';
import { ont, labelToId, subjTypeToPredArray } from '../config/ontology';
import { Element, Node, Operation, transform, Path, Text } from './interface';
import * as _ from 'lodash';
import { Subject } from './Subject';

class Page extends Graph {
  private _editor: Element;

  constructor(id: string, turtle: string) {
    super(id, turtle);
    subjTypeToPredArray.forEach(this.createPredicate);
    this._editor = <Element>this._toJsonRecursive(this.getRoot());
  }

  public toJson = (): Element => {
    return this._editor;
  };

  public apply = (op: Operation) => {
    const opCloned = _.cloneDeep(op);
    const { subjToInsert, subjToRemove } = this._preprocess(opCloned);

    transform(this._editor, opCloned);

    for (let node of subjToInsert.values()) {
      let subject = this.createSubject(node.id);
      subject.insert(); // TODO
    }

    for (let nodeId of subjToRemove.values()) {
      let subject = this.getSubject(nodeId);
      subject.delete();
    }
  };

  private _preprocess(op: Operation) {
    const subjToInsert = new Set<Node>();
    const subjToRemove = new Set<string>();

    // TODO: should operation on a deleted subject allowed?
    switch (op.type) {
      case 'insert_node':
        this._preInsertRecursive(op.node, subjToInsert);
        break;

      case 'split_node':
        this._preInsertRecursive(
          {
            id: <string>op.properties.id,
            type: Node.get(this._editor, op.path).type,
            children: [], // TODO: this is a workaround
          },
          subjToInsert,
        );
        break;
      case 'remove_node':
        this._preRemoveRecursive(op.path, subjToRemove);
        break;
      case 'merge_node':
        subjToRemove.add(Node.get(this._editor, op.path).id);
        break;
    }
    return { subjToInsert, subjToRemove };
  }

  private _preInsertRecursive = (node: Node, subjToInsert: Set<Node>) => {
    if (this._subjectMap.has(node.id)) {
      throw new Error('Duplicated node insertion: ' + node.id);
    }
    subjToInsert.add(node);

    if (Text.isText(node)) return;

    (<Element>node).children.forEach(child => {
      this._preInsertRecursive(child, subjToInsert);
    });
  };

  private _preRemoveRecursive = (path: Path, subjToRemove: Set<string>) => {
    const node = Node.get(this._editor, path);
    subjToRemove.add(node.id);

    if (Text.isText(node)) return;

    (<Element>node).children.forEach((_child, index) => {
      this._preRemoveRecursive([...path, index], subjToRemove);
    });
  };

  public update() {
    this._updateRecursive(this._editor);
  }

  private _updateRecursive(node: Node, nextNode?: Node) {
    this._update(node, nextNode);

    if (!node.children) return;

    node.children.forEach((childNode: Node, index: number) => {
      this._updateRecursive(childNode, node.children[index + 1]);
    });
  }

  private _update(node: Node, nextNode?: Node) {
    // this.getSubject(node.id).clearProperties();

    Object.keys(node).forEach(label => {
      if (label !== 'id' && label !== 'children') {
        this.setValue(node.id, labelToId[label], node[label]);
      }
    });

    if (nextNode) {
      this.setValue(node.id, ont.sdoc.next, nextNode.id);
    }

    if (node.children && node.children[0]) {
      this.setValue(node.id, ont.sdoc.firstChild, node.children[0].id);
    }
  }

  public undo() {
    super.undo();
    this._editor = <Element>this._toJsonRecursive(this.getRoot());
  }

  private _toJsonRecursive(subject: Subject): Node {
    let result = subject.toJson();
    if (!result.children) return result;

    let child = this._getRelative(subject, 'firstChild');

    while (child) {
      result.children.push(this._toJsonRecursive(child));
      child = this._getRelative(child, 'next');
    }

    return result;
  }

  private _getRelative(
    subject: Subject,
    label: 'firstChild' | 'next',
  ): Subject | undefined {
    const relId = this.getValue(subject.id, labelToId[label]);
    if (relId === undefined) {
      return undefined;
    }
    return this._subjectMap.get(<string>relId);
  }
}

export { Page };
