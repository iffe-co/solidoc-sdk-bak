import { Graph } from './Graph';
import { ont, labelToId, subjTypeToPredArray } from '../config/ontology';
import {
  myEditor as Editor,
  myNode as Node,
  Operation,
  transform,
} from './interface';
import { Text, Path } from 'slate';
import { Subject } from './Subject';

class Page extends Graph {
  private _editor: Editor;

  constructor(id: string, turtle: string) {
    super(id, turtle);
    subjTypeToPredArray.forEach(this.createPredicate);
    this.setValue(id, ont.rdf.type, ont.sdoc.root);
    this._editor = <Editor>this._toJsonRecursive(this.getRoot());
  }

  public toJson = (): Editor => {
    return this._editor;
  };

  public apply = (op: Operation) => {
    this._preprocess(op);

    transform(this._editor, op);
  };

  private _preprocess(op: Operation) {
    // TODO: should operation on a deleted subject allowed?
    switch (op.type) {
      case 'insert_node':
        this._preInsertRecursive(op.node);
        break;

      case 'split_node':
        this.createSubject(<string>op.properties.id);
        break;
      case 'remove_node':
        this._preRemoveRecursive(op.path);
        break;
      case 'merge_node':
        this.deleteSubject(<string>Node.get(this._editor, op.path).id);
        break;
    }
    return;
  }

  private _preInsertRecursive = (node: Node) => {
    this.createSubject(node.id);

    if (Text.isText(node)) return;

    node.children.forEach(child => {
      this._preInsertRecursive(child);
    });
  };

  private _preRemoveRecursive = (path: Path) => {
    const node = <Node>Node.get(this._editor, path);
    this.deleteSubject(node.id);

    if (Text.isText(node)) return;

    node.children.forEach((_child, index) => {
      this._preRemoveRecursive([...path, index]);
    });
  };

  public update() {
    this._updateRecursive(this._editor);
    const timestamp = Date.parse(new Date().toISOString());
    this.setValue(this._id, ont.dct.modified, timestamp);
    this._editor.modified = timestamp;
  }

  private _updateRecursive(node: Node, nextNode?: Node) {
    const subject = this.getSubject(node.id);
    subject.fromJson(node, this._predicateMap);

    this._updatedSet.add(subject);

    if (nextNode) {
      this.setValue(node.id, ont.sdoc.next, nextNode.id);
    }

    if (Text.isText(node)) return;

    node.children.forEach((childNode: Node, index: number) => {
      this._updateRecursive(childNode, node.children[index + 1]);
      index === 0 && this.setValue(node.id, ont.sdoc.firstChild, childNode.id);
    });
  }

  public undo() {
    super.undo();
    this._editor = <Editor>this._toJsonRecursive(this.getRoot());
  }

  private _toJsonRecursive(subject: Subject): Node {
    let result: Node = subject.toJson();
    if (Text.isText(result)) return result;

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
