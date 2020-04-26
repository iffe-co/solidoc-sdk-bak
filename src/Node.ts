import { NamedNodeProperty, TextProperty } from './Property';
import { Subject } from './Subject';
import { Element, Text, Node } from './interface'

class Branch extends Subject {

  constructor(id: string) {
    super(id);
    this._predicates.firstChild = new NamedNodeProperty('http://www.solidoc.net/ontologies#firstChild', 'firstChild');
  }

  public toJson(): Element {
    let result = super.toJson();
    result.children = []
    return result
  }

  public toJsonRecursive(nodeMap: Map<string, Subject>): Element {
    let result = this.toJson()

    let child = nodeMap.get(this.get('firstChild'))

    while (child) {
      if (child instanceof Branch) {
        result.children.push(child.toJsonRecursive(nodeMap))
      } else {
        result.children.push(child.toJson())
      }
      child = nodeMap.get(child.get('next'))
    }

    return result
  }

}

class Root extends Branch {
  constructor(id: string) {
    super(id);
    this._predicates.title = new TextProperty('http://purl.org/dc/terms/title', 'title');
  }

  public toJson(): Element {
    return {
      ...super.toJson(),
      title: this.get('title')
    }
  }

  public fromQuad(quad: any) {
    if (quad.predicate.id === 'http://www.solidoc.net/ontologies#nextNode') {
      throw new Error('fromQuad: The root node cannot have syblings: ' + this._id)
    }
    super.fromQuad(quad)
  }

  public set(props: any) {
    if (Object.keys(props).includes('next')) {
      throw new Error('Cannot set "next" property for Root: ' + this._id);
    }
    super.set(props)
  }

  public delete = () => {
    throw new Error('The root node is not removable :' + this._id);
  }

}

class Leaf extends Subject {
  constructor(id: string) {
    // TODO: using blank nodes
    super(id);
    this._predicates.text = new TextProperty('http://www.solidoc.net/ontologies#text', 'text');
  }

  public toJson = (): Text => {
    return {
      ...super.toJson(),
      text: this.get('text')
    }
  }

}

const createNode = (json: Node, nodeMap: Map<string, Subject>): Subject => {
  if (nodeMap.get(json.id)) {
    throw new Error('duplicated node creation: ' + json.id)
  }
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
}

export { Branch, Root, Leaf, createNode }
