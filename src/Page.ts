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

class Page extends Graph {
  private _editor: Editor;
  private _dirtyPaths: Set<string> = new Set();

  constructor(id: string, turtle: string) {
    super(id, turtle);

    subjTypeToPredArray.forEach(this.createPredicate);
    this.setValue(id, ont.rdf.type, ont.sdoc.Root);

    this._editor = <Editor>this._toJsonRecursive(id);
  }

  public toJson = (): Editor => {
    return this._editor;
  };

  private _toJsonRecursive(subjectId: string): Node {
    const subject = this.getSubject(subjectId);

    const result: Node = subject.toJson();

    if (Text.isText(result)) return result;

    let childId = this.getValue(subjectId, ont.sdoc.firstChild);

    while (childId && typeof childId === 'string') {
      const child = this._toJsonRecursive(childId);

      result.children.push(child);

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
          this._insertNode(<string>n.id, [...op.path, ...p]);
        }
        break;
      }

      case 'remove_node': {
        const node = Node.get(this._editor, op.path);
        for (let [n, p] of Node.nodes(node)) {
          this._removeNode(<string>n.id, [...op.path, ...p]);
        }
        break;
      }

      case 'move_node': {
        this._addDirtyPath(Path.transform(op.path, op));
        this._addDirtyPath(Path.transform(Path.anchor(op.path), op));
        this._addDirtyPath(Path.transform(Path.anchor(op.newPath), op));

        break;
      }

      case 'merge_node': {
        const { node, prev } = Node.getContext(this._editor, op.path);
        this._removeNode(node.id, op.path);

        Text.isText(prev) ||
          this._addDirtyPath(Path.lastChild(prev, Path.previous(op.path)));
        break;
      }

      case 'split_node': {
        const { node } = Node.getContext(this._editor, op.path);
        this._insertNode(<string>op.properties.id, Path.next(op.path));

        Text.isText(node) ||
          this._addDirtyPath(Path.anchor([...op.path, op.position]));
        break;
      }
    }
  }

  private _insertNode(nodeId: string, path: Path) {
    this.createSubject(nodeId);
    this._addDirtyPath(path);
    this._addDirtyPath(Path.anchor(path));
  }

  private _removeNode(nodeId: string, path: Path) {
    this.deleteSubject(nodeId);
    this._addDirtyPath(Path.anchor(path));
  }

  private _addDirtyPath(path: Path | null) {
    if (!path) return;
    this._dirtyPaths.add(path.join(','));
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
    const { node, next, firstChild } = Node.getContext(this._editor, path);

    const subject = this.getSubject(node.id);
    this._updatedSubjs.add(subject); // TODO: better done in _addDirtyPath()?

    subject.fromJson(node, this._predicateMap);
    next && this.setValue(node.id, ont.sdoc.next, next.id);
    firstChild && this.setValue(node.id, ont.sdoc.firstChild, firstChild.id);
  }

  public undo() {
    super.undo();
    this._editor = <Editor>this._toJsonRecursive(this._id);
    this._dirtyPaths.clear();
  }
}

export { Page };
