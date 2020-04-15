import { Graph } from './Graph'
import { Node } from './interface'
import { createNode, Branch, Leaf } from './Node'
import { Subject } from './Subject'
import * as n3 from 'n3';

const parser = new n3.Parser();

const Process = {
  parseTurtle: (turtle: string, graph: Graph) => {
    const quads: any[] = parser.parse(turtle);
    quads.forEach(quad => {
      if (quad.predicate.id === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type') {
        // nodes[quad.subject.id] = Process.createNode(quad.subject.id, quad.object.id)
        let node = createNode(quad.subject.id, quad.object.id);
        graph.setNode(node)
      }
    })

    quads.forEach(quad => {
      let node = graph.getNode(quad.subject.id)
      node.fromQuad(quad);
      if (quad.predicate.id === 'http://www.solidoc.net/ontologies#nextNode') {
        let next = graph.getNode(quad.object.id)
        node.setNext(next)
      }
    })
  },

  assembleTree: (head: Subject, graph: Graph) => {
    if (!(head instanceof Branch)) return

    let currUri = head.get('firstChild');
    let curr: Subject | null = graph.getNode(currUri)
    curr && head.appendChildren(curr)

    while (curr) {
      Process.assembleTree(curr, graph);
      curr = curr.getNext()
    }
  },

  toJson: (head: Subject): Node => {
    const headJson = head.toJson();

    // TODO: use map??
    for (let i = 0; head instanceof Branch && i < head.getChildrenNum(); i++) {
      if (i == 0 && head.get('firstChild') !== head.getChildFromChildren(i).get('id')) {
        throw new Error('firstChild error')
      } else if (i < head.getChildrenNum() - 1 && head.getChildFromChildren(i).get('next') !== head.getChildFromChildren(i + 1).get('id')) {
        throw new Error('next error')
      }
      headJson.children.push(Process.toJson(head.getChildFromChildren(i)))
    }

    return headJson
  },

  insertRecursive: (json: Node, graph: Graph, parent: Branch, offset: number): Subject => {
    let currUri: string = graph.getUri() + '#' + json.id
    let curr: Subject = (json.type === 'http://www.solidoc.net/ontologies#Leaf') ? new Leaf(currUri) : new Branch(currUri)

    curr.set(json);
    graph.setNode(curr);

    parent.insertChild(curr, offset);

    for (let i = 0; curr instanceof Branch && i < json.children.length; i++) {
      Process.insertRecursive(json.children[i], graph, curr, i)
    }
    return curr
  },

  removeRecursive: (head: Subject) => {
    head.delete()

    // TODO: use map??
    for (let i = 0; head instanceof Branch && i < head.getChildrenNum(); i++) {
      Process.removeRecursive(head.getChildFromChildren(i))
    }
  },

  isAncestor: (from: Subject, to: Subject): boolean => {
    if (from === to) return true

    // TODO: use map??
    for (let i = 0; from instanceof Branch && i < from.getChildrenNum(); i++) {
      let curr = from.getChildFromChildren(i)
      if (Process.isAncestor(curr, to)) return true
    }
    return false
  },
}

export { Process }