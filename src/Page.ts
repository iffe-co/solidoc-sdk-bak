import { Root } from './Node';
import { Graph } from './Graph';
import { Element, Node, Operation, transform, Path, Text } from './interface'
import * as _ from 'lodash'

class Page extends Graph {
  private _editor: Element

  constructor(id: string, turtle: string) {
    super(id, turtle);
    const root = <Root>this.getRoot();
    root.assembleChlildren(this._nodeMap)
    this._editor = root.toJson()
  }

  public toJson = (): Element => {
    return this._editor
  }

  public apply = (op: Operation) => {
    const opCloned = _.cloneDeep(op)
    const newSubjects: Set<Node> = this._placeholder(opCloned);

    transform(this._editor, opCloned)

    for (let subject of newSubjects) {
      this.createNode(subject);
    }
  }

  private _placeholder(op: Operation): Set<Node> {
    const newSubjects = new Set<Node>();

    switch (op.type) {
      case 'insert_node':
        this._placeholderRecursive(op.node, newSubjects);
        break

      case 'split_node':
        const currId = Node.get(this._editor, op.path).id;
        const curr = this.getNode(currId);
        this._placeholderRecursive({
          id: <string>op.properties.id,
          type: <string>curr?.get('type'),
          children: [], // TODO: this is a workaround
        }, newSubjects)
        break

    }
    return newSubjects
  }

  private _placeholderRecursive = (node: Node, newSubjects: Set<Node>) => {
    if (this._nodeMap.has(node.id)) {
      throw new Error('Duplicated node insertion: ' + node.id)
    }
    newSubjects.add(node)

    if(Text.isText(node)) return;

    (<Element>node).children.forEach(child => {
      this._placeholderRecursive(child, newSubjects)
    });
  }

  public getSparqlForUpdate(): string {
    const visited = new Set<string>();

    this._updateNodesRecursive(this._editor, [], visited);

    this._deleteNodesIfNot(visited);

    return super.getSparqlForUpdate();

  }

  private _updateNodesRecursive = (node: Node, path: Path, visited: Set<string>) => {
    const nodeId = node.id;
    let subject = this.getNode(nodeId);

    if (subject) {
      subject.set(node);
    } else {
      subject = this.createNode(node);
    }
    !(subject instanceof Root) && subject.set({ next: this._getNodeId(Path.next(path)) });

    visited.add(nodeId)

    if (!node.children) return

    subject.set({ firstChild: this._getNodeId([...path, 0]) });

    node.children.forEach((child: Node, index: number) => {
      this._updateNodesRecursive(child, [...path, index], visited)
    });
  }

  private _getNodeId = (path: Path): string => {
    try {
      const node: Node = Node.get(this._editor, path);
      return node.id
    } catch (e) {
      return ''
    }
  }

  private _deleteNodesIfNot(visited: Set<string>) {
    for (let [nodeId, subject] of this._nodeMap.entries()) {
      if (!visited.has(nodeId)) {
        subject.delete();
      }
    }
  }

  public commit() {
    super.commit();
    const root = <Root>this.getRoot();
    root.assembleChlildren(this._nodeMap)
  }

  public undo() {
    super.undo();
    const root = <Root>this.getRoot();
    root.assembleChlildren(this._nodeMap)
    this._editor = root.toJson()
  }

}

export { Page }
