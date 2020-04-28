// import { Subject } from './Subject'
import { Graph } from './Graph';
import { Element, Node, Operation, transform, Path, Text } from './interface'
import * as _ from 'lodash'
import { Subject } from './Subject';

class Page extends Graph {
  private _editor: Element

  constructor(id: string, turtle: string) {
    super(id, turtle);
    this._editor = <Element>this._toJsonRecursive(this.getRoot())
  }

  public toJson = (): Element => {
    return this._editor
  }

  public apply = (op: Operation) => {
    const opCloned = _.cloneDeep(op)
    const { subjToInsert, subjToRemove } = this._placeholder(opCloned);

    transform(this._editor, opCloned)

    for (let node of subjToInsert.values()) {
      let subject = this.createSubject(node);
      subject.insert() // TODO
    }

    for (let nodeId of subjToRemove.values()) {
      let subject = this.getSubject(nodeId)
      subject.delete()
    }

  }

  private _placeholder(op: Operation) {
    const subjToInsert = new Set<Node>();
    const subjToRemove = new Set<string>();

    switch (op.type) {
      case 'insert_node':
        this._placeholderRecursive(op.node, subjToInsert);
        break

      case 'split_node':
        const currId = Node.get(this._editor, op.path).id;
        const curr = this.getSubject(currId);
        this._placeholderRecursive({
          id: <string>op.properties.id,
          type: curr.getProperty('type'),
          children: [], // TODO: this is a workaround
        }, subjToInsert)
        break
      case 'remove_node':
        this._removeRecursive(op.path, subjToRemove);
        break
      case 'merge_node':
        subjToRemove.add(Node.get(this._editor, op.path).id)
        break

    }
    return { subjToInsert, subjToRemove }
  }

  private _placeholderRecursive = (node: Node, subjToInsert: Set<Node>) => {
    if (this._subjectMap.has(node.id)) {
      throw new Error('Duplicated node insertion: ' + node.id)
    }
    subjToInsert.add(node)

    if (Text.isText(node)) return;

    (<Element>node).children.forEach(child => {
      this._placeholderRecursive(child, subjToInsert)
    });
  }

  private _removeRecursive = (path: Path, subjToRemove: Set<string>) => {
    const node = Node.get(this._editor, path);
    subjToRemove.add(node.id);

    if (Text.isText(node)) return;

    (<Element>node).children.forEach((_child, index) => {
      this._removeRecursive([...path, index], subjToRemove)
    });

  }

  private _updateRecursive(node: Node, nextNode?: Node) {
    let subject = this.getSubject(node.id)
    subject.set(node);
    nextNode && subject.setProperty('next', nextNode.id)

    if (!node.children) return;

    const firstChildId = node.children[0] ? node.children[0].id : '';
    subject.setProperty('firstChild', firstChildId)

    node.children.forEach((childNode: Node, index: number) => {
      const child = this._subjectMap.get(childNode.id)
      if (!child) {
        throw new Error('Child not found: ' + childNode.id)
      }
      this._updateRecursive(childNode, node.children[index + 1])
    });

  }

  private _toJsonRecursive(subject: Subject): Node {
    let result = subject.toJson()
    if (!result.children) return result

    let childId = subject.getProperty('firstChild')
    let child: Subject | undefined = this._subjectMap.get(childId);

    while (child) {
      result.children.push(this._toJsonRecursive(child))
      childId = child.getProperty('next')
      child = this._subjectMap.get(childId);
    }

    return result
  }


  public getSparqlForUpdate(): string {

    this._updateRecursive(this._editor)

    return super.getSparqlForUpdate();

  }

  public commit() {
    super.commit();
  }

  public undo() {
    super.undo();
    this._editor = <Element>this._toJsonRecursive(this.getRoot())
  }

}

export { Page }
