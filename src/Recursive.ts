import { Node } from './interface'
import { Branch, createNode } from './Node'
import { Subject } from './Subject'

const idToUri = (id: string, parent: Branch) => {
  let parentUri: string = parent.get('uri')
  let pageUri = parentUri.substr(0, parentUri.indexOf('#'))
  return pageUri + '#' + id
}

const Recursive = {
  assembleTree: (head: Subject | undefined, nodeMap: Map<string, Subject>) => {
    if (!(head instanceof Branch)) return

    let currUri = head.get('firstChild');
    let curr: Subject | undefined = nodeMap.get(currUri)
    curr && head.insertChildren(curr, 0)

    while (curr) {
      Recursive.assembleTree(curr, nodeMap);
      curr = curr.getNext()
    }
  },

  toJson: (head: Subject | undefined): Node => {
    if (!head) {
      throw new Error('Jsonify a null node')
    }
    const headJson = head.toJson();

    // TODO: use map??
    for (let i = 0; head instanceof Branch && i < head.getChildrenNum(); i++) {
      headJson.children.push(Recursive.toJson(head.getIndexedChild(i)))
    }

    return headJson
  },

  insert: (json: Node, parent: Branch, offset: number): Subject[] => {
    let result: Subject[] = []
    let currUri: string = idToUri(json.id, parent)
    let curr: Subject = createNode(currUri, json.type)
    result.push(curr)

    curr.set(json);
    parent.insertChildren(curr, offset);

    for (let i = 0; curr instanceof Branch && i < json.children.length; i++) {
      result.push(
        ...Recursive.insert(json.children[i], curr, i)
      )
    }
    return result
  },

  remove: (head: Subject) => {
    head.delete()

    // TODO: use map??
    for (let i = 0; head instanceof Branch && i < head.getChildrenNum(); i++) {
      Recursive.remove(<Subject>head.getIndexedChild(i))
    }
  },

  isAncestor: (from: Subject, to: Subject): boolean => {
    if (from === to) return true

    // TODO: use map??
    for (let i = 0; from instanceof Branch && i < from.getChildrenNum(); i++) {
      let curr = from.getIndexedChild(i)
      if (Recursive.isAncestor(<Subject>curr, to)) return true
    }
    return false
  },
}

export { Recursive }