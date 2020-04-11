import { Node } from './Node'

export interface Path {
  parentUri: string,
  offset: number
}

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
  properties: Partial<Node>
  newProperties: Partial<Node>
  [key: string]: any
}

export type SetSelectionOperation =
  | {
    type: 'set_selection'
    [key: string]: any
    properties: null
    newProperties: Range
  }
  | {
    type: 'set_selection'
    [key: string]: any
    properties: Partial<Range>
    newProperties: Partial<Range>
  }
  | {
    type: 'set_selection'
    [key: string]: any
    properties: Range
    newProperties: null
  }

export type SplitNodeOperation = {
  type: 'split_node'
  path: Path
  position: number
  target: number | null
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
