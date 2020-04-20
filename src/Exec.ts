import { Branch, Leaf, Root } from './Node'
import { Subject } from './Subject'
import { Node, Path } from './interface'

const getParentInstance = (id: string, nodeMap: Map<string, Subject>): Branch => {
  const parent = nodeMap.get(id)

  if (!parent || !(parent instanceof Branch)) {
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

  insertNodeRecursive: (json: Node, path: Path, nodeMap: Map<string, Subject>): Subject => {

    const parent: Branch = getParentInstance(path.parentId, nodeMap);

    const node = Exec.createNode(json, nodeMap)

    parent.attachChildren(node, path.offset)

    for (let i = 0; node instanceof Branch && i < json.children.length; i++) {
      Exec.insertNodeRecursive(json.children[i], {
        parentId: json.id,
        offset: i,
      }, nodeMap);
    }

    return node
  },

  removeNodeRecursive: (path: Path, nodeMap: Map<string, Subject>) => {

    const parent = getParentInstance(path.parentId, nodeMap)

    const node = parent.detachChildren(path.offset, 1)

    for (let i = 0; node instanceof Branch && i < node.getChildrenNum(); i++) {
      Exec.removeNodeRecursive({
        parentId: node.get('id'),
        offset: i,
      }, nodeMap)
    }

    // deletion should be at last, otherwise will throw    
    node?.delete()
  },

  moveNode: (path: Path, length: number, newPath: Path, nodeMap: Map<string, Subject>) => {

    const parent = getParentInstance(path.parentId, nodeMap)
    const newParent = getParentInstance(newPath.parentId, nodeMap)
    const curr = parent.getIndexedChild(path.offset)

    if(!curr || (curr instanceof Branch && curr.isAncestor(newParent)) ) {
      throw new Error('Cannot move')
    }

    parent.detachChildren(path.offset, length);

    newParent.attachChildren(curr, newPath.offset);
  },


}


export { Exec }