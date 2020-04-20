import { Branch, Leaf, Root } from './Node'
import { Subject } from './Subject'
import { Node } from './interface'

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

  insertNodeRecurrsive: (json: Node, nodeMap: Map<string, Subject>, parent: Branch | undefined, offset: number) : Subject => {

    const node = Exec.createNode(json, nodeMap)

    parent?.attachChildren(node, offset)

    for (let i = 0; node instanceof Branch && i < json.children.length; i++ ) {
      Exec.insertNodeRecurrsive(json.children[i], nodeMap, node, i)
    }

    return node
  },

  removeNodeRecurrsive: (parent: Branch, offset: number) => {

    const node = parent.detachChildren(offset, 1)

    if (!node) return;

    node.delete()

    for (let i = 0; node instanceof Branch && i < node.getChildrenNum(); i++) {
      Exec.removeNodeRecurrsive(node, i)
    }

  },

  moveNode: (parent: Branch, offset: number, length: number, newParent: Branch, newOffset: number) => {

    const curr: Subject | undefined = parent.detachChildren(offset, length);

    newParent.attachChildren(curr, newOffset);

  },


}


export { Exec }