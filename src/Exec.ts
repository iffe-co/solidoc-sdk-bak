import { Branch, Leaf, Root } from './Node'
import { Subject } from './Subject'
import { Node, Path } from './interface'

const getParentInstance = (id: string, nodeMap: Map<string, Subject>): Subject => {
  const parent = nodeMap.get(id)

  if (!parent /* || !(parent instanceof Branch) */) {
    throw new Error('Cannot get parent: ' + id)
  }

  return parent
}

const Exec = {

  createNode: (json: Node, nodeMap: Map<string, Subject>): Subject => {
    let node: Subject
    switch (json.type) {
      case 'http://www.solidoc.net/ontologies#Root':
        node = new Root(json.id)
        break
      case 'http://www.solidoc.net/ontologies#Leaf':
        node = new Leaf(json.id)
        break
      default:
        node = new Branch(json.id)
        break
    }
    node.set(json)
    nodeMap.set(json.id, node)
    return node
  },

  insertNode: (json: Node, path: Path, nodeMap: Map<string, Subject>): Subject => {
    const parent: Subject = getParentInstance(path.parentId, nodeMap);


    const node = <Subject>Exec.insert(parent, json, path.offset, nodeMap);

    // TODO: might not need a return
    return node
  },

  insertText: (text: string, path: Path, nodeMap: Map<string, Subject>) => {

    const parent: Subject = getParentInstance(path.parentId, nodeMap);

    const node = <Leaf>parent.getIndexedChild(path.offset)

    Exec.insert(node, text, path.offset, nodeMap)
  },

  insert: (parent: Subject, content: Node | string, offset: number, nodeMap: Map<string, Subject>) => {

    const node = (typeof content === 'string') ? content : Exec.createNode(content, nodeMap);

    parent.attachChildren(node, offset)

    return node
  },

  remove: (parent: Subject, offset: number, length: number) => {

    let node = parent.detachChildren(offset, length);

    (node && typeof node !== 'string' && node.delete());

  },

  moveNodes: (path: Path, length: number, newPath: Path, nodeMap: Map<string, Subject>) => {

    const parent = getParentInstance(path.parentId, nodeMap)
    const newParent = getParentInstance(newPath.parentId, nodeMap)

    let curr = parent.getIndexedChild(path.offset)
    if (!curr || (curr instanceof Branch && curr.isAncestor(newParent))) {
      throw new Error('Cannot move')
    }

    curr = parent.detachChildren(path.offset, length);

    newParent.attachChildren(curr, newPath.offset);
  },


  getBrotherPath: (path: Path, delta: number): Path => {
    return {
      ...path,
      offset: path.offset + delta
    }
  },

  getChildPath: (path: Path, childOffset: number, nodeMap: Map<string, Subject>): Path => {
    const parent = getParentInstance(path.parentId, nodeMap);
    const curr = parent.getIndexedChild(path.offset);

    if (!curr || !(curr instanceof Subject)) {
      throw new Error('Cannot get path')
    }

    return {
      parentId: curr.get('id'),
      offset: childOffset,
    }
  },

  getProperties: (path: Path, newProperties: Partial<Node>, nodeMap: Map<string, Subject>): Node => {
    const parent = getParentInstance(path.parentId, nodeMap);
    const curr = parent.getIndexedChild(path.offset);

    if (!curr || !(curr instanceof Subject)) {
      throw new Error('Cannot get path')
    }

    return {
      ...curr.toBlankJson(),
      ...newProperties,
    }
  },

  setProperties: (path: Path, newProperties: Partial<Node>, nodeMap: Map<string, Subject>) => {
    const parent = getParentInstance(path.parentId, nodeMap);
    const curr = parent.getIndexedChild(path.offset);

    if (!curr || !(curr instanceof Subject)) {
      throw new Error('Cannot get path')
    }

    curr.set(newProperties)
  },
}


export { Exec }