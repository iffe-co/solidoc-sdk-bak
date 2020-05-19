import { Graph } from './Graph';
import { ont, labelToId, subjTypeToPredArray } from '../config/ontology';
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
    try {
      const dirtyPaths = this._preprocess(op);

      transform(this._editor, op);

      this._update(dirtyPaths);
    } catch (e) {
      this.undo();

      throw e;
    }
  };

  private _preprocess(op: Operation): Set<Path> {
    const dirtyPaths = new Set<Path>();

    switch (op.type) {
      case 'insert_text':
      case 'remove_text':
      case 'set_node': {
        dirtyPaths.add(op.path);
        break;
      }

      case 'insert_node': {
        for (let [n, p] of Node.nodes(op.node)) {
          dirtyPaths.add([...op.path, ...p]);
          this.createSubject(<string>n.id);
        }
        dirtyPaths.add(Path.anchor(op.path));
        break;
      }

      case 'remove_node': {
        const node = Node.get(this._editor, op.path);
        for (let [n] of Node.nodes(node)) {
          this.deleteSubject(<string>n.id);
        }
        dirtyPaths.add(Path.anchor(op.path));
        break;
      }

      case 'move_node': {
        const path = op.path.slice();
        const anchor = Path.anchor(path);

        const tPath = <Path>Path.transform(path, op);
        const tAnchor = <Path>Path.transform(anchor, op);

        dirtyPaths.add(tPath);
        dirtyPaths.add(tAnchor);
        dirtyPaths.add(Path.anchor(tPath));

        break;
      }

      case 'merge_node': {
        const node = Node.get(this._editor, op.path);
        this.deleteSubject(node.id);

        const prevPath = Path.previous(op.path);
        dirtyPaths.add(prevPath);

        const prev = Node.get(this._editor, prevPath);

        Text.isText(prev) ||
          dirtyPaths.add(Path.anchor([...prevPath, prev.children.length]));
        break;
      }

      case 'split_node': {
        dirtyPaths.add(op.path);

        dirtyPaths.add(Path.next(op.path));
        this.createSubject(<string>op.properties.id);

        Text.isText(Node.get(this._editor, op.path)) ||
          dirtyPaths.add(Path.anchor([...op.path, op.position]));
        break;
      }

      default: {
        break;
      }
    }

    return dirtyPaths;
  }

  private _update(dirtyPaths: Set<Path>) {
    const timestamp = Date.parse(new Date().toISOString());
    this.setValue(this._id, ont.dct.modified, timestamp);
    this._editor.modified = timestamp;
    dirtyPaths.add([]);

    for (let path of dirtyPaths.values()) {
      this._updateNode(path);
    }
  }

  private _updateNode(path: Path) {
    const node = Node.get(this._editor, path);

    const subject =
      this._subjectMap.get(node.id) || this.createSubject(node.id);

    this.undeleteSubject(node.id);
    subject.fromJson(node, this._predicateMap);

    try {
      const next = Node.get(this._editor, Path.next(path));
      this.setValue(node.id, ont.sdoc.next, next.id);
      // eslint-disable-next-line no-empty
    } catch (_) {}

    try {
      const firstChild = Node.get(this._editor, [...path, 0]);
      this.setValue(node.id, ont.sdoc.firstChild, firstChild.id);
      // eslint-disable-next-line no-empty
    } catch (_) {}
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
