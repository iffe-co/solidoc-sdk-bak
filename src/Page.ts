import { Root } from './Node';
import { Graph } from './Graph';
import { Element, Node, Operation, transform, Path } from './interface'


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
    transform(this._editor, op)
  }

  public getSparqlForUpdate(): string {
    let visited = new Set<string>();

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
