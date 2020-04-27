import { Root } from './Subject';
import { Graph } from './Graph';
import { Element, Node, Operation, transform, Path, Text } from './interface'
import * as _ from 'lodash'

class Page extends Graph {
  private _editor: Element

  constructor(id: string, turtle: string) {
    super(id, turtle);
    const root = <Root>this.getRoot();
    this._editor = root.toJsonRecursive(this._subjectMap)
  }

  public toJson = (): Element => {
    return this._editor
  }

  public apply = (op: Operation) => {
    const opCloned = _.cloneDeep(op)
    const nodesToInsert: Set<Node> = this._placeholder(opCloned);

    transform(this._editor, opCloned)

    for (let node of nodesToInsert) {
      this.createSubject(node);
    }
  }

  private _placeholder(op: Operation): Set<Node> {
    const nodesToInsert = new Set<Node>();

    switch (op.type) {
      case 'insert_node':
        this._placeholderRecursive(op.node, nodesToInsert);
        break

      case 'split_node':
        const currId = Node.get(this._editor, op.path).id;
        const curr = this.getSubject(currId);
        this._placeholderRecursive({
          id: <string>op.properties.id,
          type: <string>curr.get('type'),
          children: [], // TODO: this is a workaround
        }, nodesToInsert)
        break

    }
    return nodesToInsert
  }

  private _placeholderRecursive = (node: Node, nodesToInsert: Set<Node>) => {
    if (this._subjectMap.has(node.id)) {
      throw new Error('Duplicated node insertion: ' + node.id)
    }
    nodesToInsert.add(node)

    if (Text.isText(node)) return;

    (<Element>node).children.forEach(child => {
      this._placeholderRecursive(child, nodesToInsert)
    });
  }

  public getSparqlForUpdate(): string {
    const visited = new Set<string>();

    this._updateSubjectsRecursive(this._editor, [], visited);

    this._deleteSubjectsIfNot(visited);

    return super.getSparqlForUpdate();

  }

  private _updateSubjectsRecursive = (node: Node, path: Path, visited: Set<string>) => {
    let subject = this.getSubject(node.id);

    subject.set(node, this._getNext(path));

    visited.add(node.id)

    node.children && node.children.forEach((child: Node, index: number) => {
      this._updateSubjectsRecursive(child, [...path, index], visited)
    });
  }

  private _getNext = (path: Path): Node | undefined => {
    try {
      const node: Node = Node.get(this._editor, Path.next(path));
      return node
    } catch (e) {
      return undefined
    }
  }

  private _deleteSubjectsIfNot(visited: Set<string>) {
    for (let [nodeId, subject] of this._subjectMap.entries()) {
      if (!visited.has(nodeId)) {
        subject.delete();
      }
    }
  }

  public commit() {
    super.commit();
  }

  public undo() {
    super.undo();
    const root = <Root>this.getRoot();
    this._editor = root.toJsonRecursive(this._subjectMap)
  }

}

export { Page }
