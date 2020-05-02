import { Graph } from './Graph';
import { ont, aliasToPredId } from '../config/ontology';
import { Element, Node, Operation, transform, Path, Text } from './interface';
import * as _ from 'lodash';
import { Subject } from './Subject';

class Page extends Graph {
  private _editor: Element;

  constructor(id: string, turtle: string) {
    super(id, turtle);
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
      let subject = this.createSubject(node);
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
    let currId: string;
    let curr: Subject;

    // TODO: should operation on a deleted subject allowed?
    switch (op.type) {
      case 'insert_node':
        this._preInsertRecursive(op.node, subjToInsert);
        break;

      case 'split_node':
        currId = Node.get(this._editor, op.path).id;
        curr = this.getSubject(currId);
        this._preInsertRecursive(
          {
            id: <string>op.properties.id,
            type: curr.getProperty(this.getPredicate(ont.rdf.type)),
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
    let subject = this.getSubject(node.id);
    this.set(node);
    nextNode &&
      subject.setProperty(this.getPredicate(ont.sdoc.next), nextNode.id);

    if (!node.children) return;

    const firstChildId = node.children[0] ? node.children[0].id : '';
    subject.setProperty(this.getPredicate(ont.sdoc.firstChild), firstChildId);

    node.children.forEach((childNode: Node, index: number) => {
      this._updateRecursive(childNode, node.children[index + 1]);
    });
  }

  public set(node: Node) {
    let subject = this.getSubject(node.id);
    if (subject.isDeleted()) {
      throw new Error('Trying to update a deleted subject: ' + this._id);
    }

    Object.keys(node).forEach(alias => {
      if (alias === 'id' || alias === 'children') {
        //
      } else {
        const predId = aliasToPredId[alias];
        subject.setProperty(this.getPredicate(predId), node[alias]);
      }
    });
  }

  public undo() {
    super.undo();
    this._editor = <Element>this._toJsonRecursive(this.getRoot());
  }

  private _toJsonRecursive(subject: Subject): Node {
    let result = subject.toJson();
    if (!result.children) return result;

    let childId = subject.getProperty(this.getPredicate(ont.sdoc.firstChild));
    let child: Subject | undefined = this._subjectMap.get(childId);

    while (child) {
      result.children.push(this._toJsonRecursive(child));
      childId = child.getProperty(this.getPredicate(ont.sdoc.next));
      child = this._subjectMap.get(childId);
    }

    return result;
  }
}

export { Page };
