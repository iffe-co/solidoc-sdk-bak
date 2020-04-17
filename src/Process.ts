import { Graph } from './Graph'
import { Node } from './interface'
import { createNode, nodeMap, Branch } from './Node'
import { Subject } from './Subject'
import * as n3 from 'n3';

const parser = new n3.Parser();

const Process = {
  parseTurtle: (turtle: string) => {
    const quads: any[] = parser.parse(turtle);
    quads.forEach(quad => {
      if (quad.predicate.id === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        createNode(quad.subject.id, quad.object.id);
      }
    })

    quads.forEach(quad => {
      let node = nodeMap.get(quad.subject.id)
      if (!node) {
        throw new Error('Node does not exist: ' + quad.subject.id)
      }
      node.fromQuad(quad);

    })
  },

  assembleTree: (head: Subject | undefined, graph: Graph) => {
    if (!head) {
      throw new Error('Traverse from a null head')
    }

    if (!(head instanceof Branch)) return

    let currUri = head.get('firstChild');
    let curr: Subject | undefined = nodeMap.get(currUri)
    curr && head.insertChildren(curr, 0)

    while (curr) {
      Process.assembleTree(curr, graph);
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
      // if (i == 0 && head.get('firstChild') !== head.getIndexedChild(i).get('id')) {
      //   throw new Error('firstChild error')
      // } else if (i < head.getChildrenNum() - 1 && head.getIndexedChild(i).get('next') !== head.getIndexedChild(i + 1).get('id')) {
      //   throw new Error('next error')
      // }
      headJson.children.push(Process.toJson(head.getIndexedChild(i)))
    }

    return headJson
  },

  insertRecursive: (json: Node, graph: Graph, parent: Branch, offset: number): Subject => {
    let currUri: string = graph.getUri() + '#' + json.id
    let curr: Subject = createNode(currUri, json.type)

    curr.set(json);
    parent.insertChildren(curr, offset);

    for (let i = 0; curr instanceof Branch && i < json.children.length; i++) {
      Process.insertRecursive(json.children[i], graph, curr, i)
    }
    return curr
  },

  removeRecursive: (head: Subject) => {
    head.delete()

    // TODO: use map??
    for (let i = 0; head instanceof Branch && i < head.getChildrenNum(); i++) {
      Process.removeRecursive(<Subject>head.getIndexedChild(i))
    }
  },

  isAncestor: (from: Subject, to: Subject): boolean => {
    if (from === to) return true

    // TODO: use map??
    for (let i = 0; from instanceof Branch && i < from.getChildrenNum(); i++) {
      let curr = from.getIndexedChild(i)
      if (Process.isAncestor(<Subject>curr, to)) return true
    }
    return false
  },
}

export { Process }