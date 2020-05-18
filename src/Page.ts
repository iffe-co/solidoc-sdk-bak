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
    const { subjToInsert, subjToRemove } = this._preprocess(op);

    transform(this._editor, op);

    for (let node of subjToInsert.values()) {
      let subject = this._subjectMap.get(node.id);
      if (subject) {
        subject.isDeleted = false;
      } else {
        subject = this.createSubject(node.id);
        subject.isInserted = true;
      }
    }

    for (let nodeId of subjToRemove.values()) {
      let subject = this.getSubject(nodeId);
      subject.isDeleted = true;
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
            type: <string>Node.get(this._editor, op.path).type,
            children: [], // TODO: this is a workaround
          },
          subjToInsert,
        );
        break;
      case 'remove_node':
        this._preRemoveRecursive(op.path, subjToRemove);
        break;
      case 'merge_node':
        subjToRemove.add(<string>Node.get(this._editor, op.path).id);
        break;
    }
    return { subjToInsert, subjToRemove };
  }

  private _preInsertRecursive = (node: Node, subjToInsert: Set<Node>) => {
    const subject = this._subjectMap.get(node.id);
    if (subject && !subject.isDeleted) {
      throw new Error('Duplicated node insertion: ' + node.id);
    }
    subjToInsert.add(node);

    if (Text.isText(node)) return;

    node.children.forEach(child => {
      this._preInsertRecursive(child, subjToInsert);
    });
  };

  private _preRemoveRecursive = (path: Path, subjToRemove: Set<string>) => {
    const node = Node.get(this._editor, path);
    subjToRemove.add(<string>node.id);

    if (Text.isText(node)) return;

    node.children.forEach((_child, index) => {
      this._preRemoveRecursive([...path, index], subjToRemove);
    });
  };

  public update() {
    this._updateRecursive(this._editor);
    const timestamp = Date.parse(new Date().toISOString());
    this.setValue(this._id, ont.dct.modified, timestamp);
    this._editor.modified = timestamp;
  }

  private _updateRecursive(node: Node, nextNode?: Node) {
    this.getSubject(node.id).fromJson(node, this._predicateMap);

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
