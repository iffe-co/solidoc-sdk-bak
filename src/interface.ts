// import isPlainObject from 'is-plain-object'
import { produce } from 'immer'

export interface Text {
  id: string
  type: string
  text: string
  [key: string]: any
}
export interface Element {
  id: string
  type: string
  children: Node[]
  [key: string]: any
}
export type Node = Text | Element
export type Descendant = Element | Text
export type Ancestor = Element

export type InsertNodeOperation = {
  type: 'insert_node'
  path: Path
  node: Node
  [key: string]: any
}

export type InsertTextOperation = {
  type: 'insert_text'
  path: Path
  offset: number
  text: string
  [key: string]: any
}

export type MergeNodeOperation = {
  type: 'merge_node'
  path: Path
  // position: number
  // target: number | null
  // properties: Partial<Node>
  [key: string]: any
}

export type MoveNodeOperation = {
  type: 'move_node'
  path: Path
  newPath: Path
  [key: string]: any
}

export type RemoveNodeOperation = {
  type: 'remove_node'
  path: Path
  // node: Node
  [key: string]: any
}

export type RemoveTextOperation = {
  type: 'remove_text'
  path: Path
  offset: number
  text: string
  [key: string]: any
}

export type SetNodeOperation = {
  type: 'set_node'
  path: Path
  // properties: Partial<Node>
  newProperties: Partial<Node>
  [key: string]: any
}

export type SetSelectionOperation =
  {
    type: 'set_selection'
    [key: string]: any
    properties: null
    newProperties: null
  }

export type SplitNodeOperation = {
  type: 'split_node'
  path: Path
  position: number
  // target: number | null
  properties: Partial<Node>
  [key: string]: any
}

export type NodeOperation =
  | InsertNodeOperation
  | MergeNodeOperation
  | MoveNodeOperation
  | RemoveNodeOperation
  | SetNodeOperation
  | SplitNodeOperation

export type SelectionOperation = SetSelectionOperation

export type TextOperation = InsertTextOperation | RemoveTextOperation

/**
 * `Operation` objects define the low-level instructions that Slate editors use
 * to apply changes to their internal state. Representing all changes as
 * operations is what allows Slate editors to easily implement history,
 * collaboration, and other features.
 */

export type Operation = NodeOperation | SelectionOperation | TextOperation

/**
 * Transform the editor by an operation.
 */

export const transform = (editor: Element, op: Operation) => {

  switch (op.type) {
    case 'insert_node': {
      const { path, node } = op
      const parent = Node.parent(editor, path)
      const index = path[path.length - 1]
      parent.children.splice(index, 0, node)

      break
    }

    case 'insert_text': {
      const { path, offset, text } = op
      const node = Node.leaf(editor, path)
      const before = node.text.slice(0, offset)
      const after = node.text.slice(offset)
      node.text = before + text + after

      break
    }

    case 'merge_node': {
      const { path } = op
      const node = Node.get(editor, path)
      const prevPath = Path.previous(path)
      const prev = Node.get(editor, prevPath)
      const parent = Node.parent(editor, path)
      const index = path[path.length - 1]

      if (Text.isText(node) && Text.isText(prev)) {
        prev.text += node.text
      } else if (!Text.isText(node) && !Text.isText(prev)) {
        prev.children.push(...node.children)
      } else {
        throw new Error(
          `Cannot apply a "merge_node" operation at path [${path}] to nodes of different interaces: ${node} ${prev}`
        )
      }

      parent.children.splice(index, 1)

      break
    }

    case 'move_node': {
      const { path, newPath } = op

      if (Path.isAncestor(path, newPath)) {
        throw new Error(
          `Cannot move a path [${path}] to new path [${newPath}] because the destination is inside itself.`
        )
      }

      const node = Node.get(editor, path)
      const parent = Node.parent(editor, path)
      const index = path[path.length - 1]

      // This is tricky, but since the `path` and `newPath` both refer to
      // the same snapshot in time, there's a mismatch. After either
      // removing the original position, the second step's path can be out
      // of date. So instead of using the `op.newPath` directly, we
      // transform `op.path` to ascertain what the `newPath` would be after
      // the operation was applied.
      parent.children.splice(index, 1)
      const truePath = Path.transform(path, op)!
      const newParent = Node.get(editor, Path.parent(truePath))
      const newIndex = truePath[truePath.length - 1]

      newParent.children.splice(newIndex, 0, node)

      break
    }

    case 'remove_node': {
      const { path } = op
      const index = path[path.length - 1]
      const parent = Node.parent(editor, path)
      parent.children.splice(index, 1)

      break
    }

    case 'remove_text': {
      const { path, offset, text } = op
      const node = Node.leaf(editor, path)
      const before = node.text.slice(0, offset)
      const after = node.text.slice(offset + text.length)
      node.text = before + after

      break
    }

    case 'set_node': {
      const { path, newProperties } = op

      if (path.length === 0) {
        throw new Error(`Cannot set properties on the root node!`)
      }

      const node = Node.get(editor, path)

      for (const key in newProperties) {
        if (key === 'children' || key === 'text') {
          throw new Error(`Cannot set the "${key}" property of nodes!`)
        }

        const value = newProperties[key]

        if (value == null) {
          delete node[key]
        } else {
          node[key] = value
        }
      }

      break
    }

    case 'split_node': {
      const { path, position, properties } = op

      if (path.length === 0) {
        throw new Error(
          `Cannot apply a "split_node" operation at path [${path}] because the root node cannot be split.`
        )
      }

      const node = Node.get(editor, path)
      const parent = Node.parent(editor, path)
      const index = path[path.length - 1]
      let newNode: Descendant

      if (Text.isText(node)) {
        const before = node.text.slice(0, position)
        const after = node.text.slice(position)
        node.text = before
        newNode = {
          ...node,
          ...(properties as Partial<Text>),
          text: after,
        }
      } else {
        const before = node.children.slice(0, position)
        const after = node.children.slice(position)
        node.children = before

        newNode = {
          ...node,
          ...(properties as Partial<Element>),
          children: after,
        }
      }

      parent.children.splice(index + 1, 0, newNode)

      break
    }
  }
}

export const Node = {

  /**
   * Get the descendant node referred to by a specific path. If the path is an
   * empty array, it refers to the root node itself.
   */

  get(root: Node, path: Path): Node {
    let node = root

    for (let i = 0; i < path.length; i++) {
      const p = path[i]

      if (Text.isText(node) || !node.children[p]) {
        throw new Error(
          `Cannot find a descendant at path [${path}] in node: ${JSON.stringify(
            root
          )}`
        )
      }

      node = node.children[p]
    }

    return node
  },

  /**
   * Get the node at a specific path, ensuring it's a leaf text node.
   */

  leaf(root: Node, path: Path): Text {
    const node = Node.get(root, path)

    if (!Text.isText(node)) {
      throw new Error(
        `Cannot get the leaf node at path [${path}] because it refers to a non-leaf node: ${node}`
      )
    }

    return node
  },

  /**
   * Get the parent of a node at a specific path.
   */

  parent(root: Node, path: Path): Ancestor {
    const parentPath = Path.parent(path)
    const p = Node.get(root, parentPath)

    if (Text.isText(p)) {
      throw new Error(
        `Cannot get the parent of path [${path}] because it does not exist in the root.`
      )
    }

    return p
  },

}

export type Path = number[]

export const Path = {

  /**
   * Compare a path to another, returning an integer indicating whether the path
   * was before, at, or after the other.
   *
   * Note: Two paths of unequal length can still receive a `0` result if one is
   * directly above or below the other. If you want exact matching, use
   * [[Path.equals]] instead.
   */

  compare(path: Path, another: Path): -1 | 0 | 1 {
    const min = Math.min(path.length, another.length)

    for (let i = 0; i < min; i++) {
      if (path[i] < another[i]) return -1
      if (path[i] > another[i]) return 1
    }

    return 0
  },

  /**
   * Check if a path ends before one of the indexes in another.
   */

  endsBefore(path: Path, another: Path): boolean {
    const i = path.length - 1
    const as = path.slice(0, i)
    const bs = another.slice(0, i)
    const av = path[i]
    const bv = another[i]
    return Path.equals(as, bs) && av < bv
  },

  /**
   * Check if a path is exactly equal to another.
   */

  equals(path: Path, another: Path): boolean {
    return (
      path.length === another.length && path.every((n, i) => n === another[i])
    )
  },

  /**
   * Check if a path is an ancestor of another.
   */

  isAncestor(path: Path, another: Path): boolean {
    return path.length < another.length && Path.compare(path, another) === 0
  },

  /**
   * Given a path, get the path to the next sibling node.
   */

  next(path: Path): Path {
    if (path.length === 0) {
      throw new Error(
        `Cannot get the next path of a root path [${path}], because it has no next index.`
      )
    }

    const last = path[path.length - 1]
    return path.slice(0, -1).concat(last + 1)
  },

  /**
   * Given a path, return a new path referring to the parent node above it.
   */

  parent(path: Path): Path {
    if (path.length === 0) {
      throw new Error(`Cannot get the parent path of the root path [${path}].`)
    }

    return path.slice(0, -1)
  },

  /**
   * Given a path, get the path to the previous sibling node.
   */

  previous(path: Path): Path {
    if (path.length === 0) {
      throw new Error(
        `Cannot get the previous path of a root path [${path}], because it has no previous index.`
      )
    }

    const last = path[path.length - 1]

    if (last <= 0) {
      throw new Error(
        `Cannot get the previous path of a first child path [${path}] because it would result in a negative index.`
      )
    }

    return path.slice(0, -1).concat(last - 1)
  },

  /**
   * Transform a path by an operation.
   */

  transform(
    path: Path,
    operation: Operation,
    options: { affinity?: 'forward' | 'backward' | null } = {}
  ): Path | null {
    return produce(path, p => {
      const { affinity = 'forward' } = options

      // PERF: Exit early if the operation is guaranteed not to have an effect.
      if (path.length === 0) {
        return
      }

      switch (operation.type) {
        case 'insert_node': {
          const { path: op } = operation

          if (
            Path.equals(op, p) ||
            Path.endsBefore(op, p) ||
            Path.isAncestor(op, p)
          ) {
            p[op.length - 1] += 1
          }

          break
        }

        case 'remove_node': {
          const { path: op } = operation

          if (Path.equals(op, p) || Path.isAncestor(op, p)) {
            return null
          } else if (Path.endsBefore(op, p)) {
            p[op.length - 1] -= 1
          }

          break
        }

        case 'merge_node': {
          const { path: op, position } = operation

          if (Path.equals(op, p) || Path.endsBefore(op, p)) {
            p[op.length - 1] -= 1
          } else if (Path.isAncestor(op, p)) {
            p[op.length - 1] -= 1
            p[op.length] += position
          }

          break
        }

        case 'split_node': {
          const { path: op, position } = operation

          if (Path.equals(op, p)) {
            if (affinity === 'forward') {
              p[p.length - 1] += 1
            } else if (affinity === 'backward') {
              // Nothing, because it still refers to the right path.
            } else {
              return null
            }
          } else if (Path.endsBefore(op, p)) {
            p[op.length - 1] += 1
          } else if (Path.isAncestor(op, p) && path[op.length] >= position) {
            p[op.length - 1] += 1
            p[op.length] -= position
          }

          break
        }

        case 'move_node': {
          const { path: op, newPath: onp } = operation

          // If the old and new path are the same, it's a no-op.
          if (Path.equals(op, onp)) {
            return
          }

          if (Path.isAncestor(op, p) || Path.equals(op, p)) {
            const copy = onp.slice()

            if (Path.endsBefore(op, onp) && op.length < onp.length) {
              const i = Math.min(onp.length, op.length) - 1
              copy[i] -= 1
            }

            return copy.concat(p.slice(op.length))
          } else if (
            Path.endsBefore(onp, p) ||
            Path.equals(onp, p) ||
            Path.isAncestor(onp, p)
          ) {
            if (Path.endsBefore(op, p)) {
              p[op.length - 1] -= 1
            }

            p[onp.length - 1] += 1
          } else if (Path.endsBefore(op, p)) {
            if (Path.equals(onp, p)) {
              p[onp.length - 1] += 1
            }

            p[op.length - 1] -= 1
          }

          break
        }
      }
    })
  },

}

export const Text = {

  /**
   * Check if a value implements the `Text` interface.
   */

  isText(value: any): value is Text {
    // return isPlainObject(value) && typeof value.text === 'string'
    return typeof value.text === 'string'
  },



}