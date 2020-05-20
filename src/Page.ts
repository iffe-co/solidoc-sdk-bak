import { Graph } from './Graph';
import { ont, subjTypeToPredArray } from '../config/ontology';
import {
  myEditor as Editor,
  myNode as Node,
  myPath as Path,
  Operation,
  transform,
} from './interface';
import { Text } from 'slate';
import { Subject } from './Subject';

class Page extends Graph {
  private _editor: Editor;
  private _dirtyPaths: Set<string> = new Set();

  constructor(id: string, turtle: string) {
    super(id, turtle);

    subjTypeToPredArray.forEach(this.createPredicate);
    this.setValue(id, ont.rdf.type, ont.sdoc.root);

    this._editor = <Editor>this._toJsonRecursive(this.getRoot());
  }

  public toJson = (): Editor => {
    return this._editor;
  };

  private _toJsonRecursive(subject: Subject): Node {
    let result: Node = subject.toJson();

    if (Text.isText(result)) return result;

    let childId = this.getValue(subject.id, ont.sdoc.firstChild);

    while (childId && typeof childId === 'string') {
      let child = this.getSubject(childId);

      let node = this._toJsonRecursive(child);

      result.children.push(node);

      childId = this.getValue(childId, ont.sdoc.next);
    }

    return result;
  }

  public apply = (op: Operation) => {
    try {
      this._preprocess(op);

      transform(this._editor, op);

      this._update();
    } catch (e) {
      this.undo();

      throw e;
    }
  };

  private _preprocess(op: Operation) {
    switch (op.type) {
      case 'insert_text':
      case 'remove_text':
      case 'set_node': {
        this._addDirtyPath(op.path);
        break;
      }

      case 'insert_node': {
        for (let [n, p] of Node.nodes(op.node)) {
          this._addDirtyPath([...op.path, ...p]);
          this.createSubject(<string>n.id);
        }
        this._addDirtyPath(Path.anchor(op.path));
        break;
      }

      case 'remove_node': {
        const node = Node.get(this._editor, op.path);
        for (let [n] of Node.nodes(node)) {
          this.deleteSubject(<string>n.id);
        }
        this._addDirtyPath(Path.anchor(op.path));
        break;
      }

      case 'move_node': {
        this._addDirtyPath(Path.transform(op.path, op));
        this._addDirtyPath(Path.transform(Path.anchor(op.path), op));
        this._addDirtyPath(Path.transform(Path.anchor(op.newPath), op));

        break;
      }

      case 'merge_node': {
        const node = Node.get(this._editor, op.path);
        this.deleteSubject(node.id);

        const prevPath = Path.previous(op.path);
        this._addDirtyPath(prevPath);

        const prev = Node.get(this._editor, prevPath);
        Text.isText(prev) ||
          this._addDirtyPath(Path.anchor([...prevPath, prev.children.length]));
        break;
      }

      case 'split_node': {
        this._addDirtyPath(op.path);

        this._addDirtyPath(Path.next(op.path));
        this.createSubject(<string>op.properties.id);

        Text.isText(Node.get(this._editor, op.path)) ||
          this._addDirtyPath(Path.anchor([...op.path, op.position]));
        break;
      }
    }
  }

  private _addDirtyPath(path: Path | null) {
    this._dirtyPaths.add(path!.join(','));
  }

  private _update() {
    this._updateModifiedTime();

    for (let path of this._dirtyPaths.values()) {
      path.length === 0
        ? this._updateNode([])
        : this._updateNode(path.split(',').map(v => parseInt(v, 10)));
    }

    this._dirtyPaths.clear();
  }

  private _updateModifiedTime() {
    const timestamp = Date.parse(new Date().toISOString());

    this.setValue(this._id, ont.dct.modified, timestamp);
    this._editor.modified = timestamp;

    this._addDirtyPath([]);
  }

  private _updateNode(path: Path) {
    const node = Node.get(this._editor, path);

    const subject =
      this._subjectMap.get(node.id) || this.createSubject(node.id);

    this.undeleteSubject(node.id);
    subject.fromJson(node, this._predicateMap);

    const next = Node.getNext(this._editor, path);
    next && this.setValue(node.id, ont.sdoc.next, next.id);

    const firstChild = Node.getFirstChild(node);
    firstChild && this.setValue(node.id, ont.sdoc.firstChild, firstChild.id);
  }

  public undo() {
    super.undo();
    this._editor = <Editor>this._toJsonRecursive(this.getRoot());
    this._dirtyPaths.clear();
  }
}

export { Page };
