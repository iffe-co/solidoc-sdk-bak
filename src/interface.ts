import { Editor, Element, Text, Node, Path, Transforms, Range } from 'slate';
import * as _ from 'lodash';

export interface myText extends Text {
  id: string;
  type: string;
}
export interface myElement extends Element {
  id: string;
  type: string;
  children: myNode[];
}
export interface myEditor extends Editor {
  id: string;
  type: string;
  title: string;
  modified: number;
  children: myNode[];
}
export type myNode = myEditor | myText | myElement;

export const myNode = {
  ...Node,

  get: (root: myNode, path: Path): myNode => {
    const node = Node.get(root, path);
    return <myNode>node;
  },

  getContext: (root: myNode, path: Path) => {
    // const node = <myNode>Node.get(root, path);
    // let parent: myNode | undefined;

    if (path.length === 0) {
      const node = root;
      const firstChild = !Text.isText(root) ? root.children[0] : undefined;
      return { node, firstChild };
    }

    const parent = <myEditor | myElement>Node.parent(root, path);

    const offset = path[path.length - 1];
    const node = <myNode>Node.get(parent, [offset]);

    const prev = parent.children[offset - 1]; // can be undefined
    const next = parent.children[offset + 1]; // can be undefined

    const firstChild =
      node && !Text.isText(node) ? node.children[0] : undefined;

    return { node, parent, prev, next, firstChild };
  },
};

export type InsertNodeOperation = {
  type: 'insert_node';
  path: Path;
  node: myNode;
  [key: string]: any;
};

export type InsertTextOperation = {
  type: 'insert_text';
  path: Path;
  offset: number;
  text: string;
  [key: string]: any;
};

export type MergeNodeOperation = {
  type: 'merge_node';
  path: Path;
  position: number;
  target: number | null;
  properties: Partial<myNode>;
  [key: string]: any;
};

export type MoveNodeOperation = {
  type: 'move_node';
  path: Path;
  newPath: Path;
  [key: string]: any;
};

export type RemoveNodeOperation = {
  type: 'remove_node';
  path: Path;
  node: myNode;
  [key: string]: any;
};

export type RemoveTextOperation = {
  type: 'remove_text';
  path: Path;
  offset: number;
  text: string;
  [key: string]: any;
};

export type SetNodeOperation = {
  type: 'set_node';
  path: Path;
  properties: Partial<myNode>;
  newProperties: Partial<myNode>;
  [key: string]: any;
};

export declare type SetSelectionOperation =
  | {
      type: 'set_selection';
      [key: string]: unknown;
      properties: null;
      newProperties: Range;
    }
  | {
      type: 'set_selection';
      [key: string]: unknown;
      properties: Partial<Range>;
      newProperties: Partial<Range>;
    }
  | {
      type: 'set_selection';
      [key: string]: unknown;
      properties: Range;
      newProperties: null;
    };

export type SplitNodeOperation = {
  type: 'split_node';
  path: Path;
  position: number;
  target: number | null;
  properties: Partial<myNode>;
  [key: string]: any;
};

export type NodeOperation =
  | InsertNodeOperation
  | MergeNodeOperation
  | MoveNodeOperation
  | RemoveNodeOperation
  | SetNodeOperation
  | SplitNodeOperation;

export type SelectionOperation = SetSelectionOperation;

export type TextOperation = InsertTextOperation | RemoveTextOperation;

/**
 * `Operation` objects define the low-level instructions that Slate editors use
 * to apply changes to their internal state. Representing all changes as
 * operations is what allows Slate editors to easily implement history,
 * collaboration, and other features.
 */

export type Operation = NodeOperation | SelectionOperation | TextOperation;

export const transform = (editor: myEditor, op: Operation) => {
  const opCloned = _.cloneDeep(op);
  Transforms.transform(editor, opCloned);
  delete editor.selection;
};

export type myPath = Path;
export const myPath = {
  ...Path,

  anchor: (path: Path): Path => {
    const lastOffset = path[path.length - 1];
    if (lastOffset === undefined) {
      throw new Error('Root node does not have anchor');
    }

    return lastOffset <= 0 ? Path.parent(path) : Path.previous(path);
  },

  offset: (node: myEditor | myElement | undefined, position: number): Path => {
    if (!node) {
      throw new Error('Node is empty');
    }

    if (node.children.length === 0 || position < 0) {
      return [];
    }

    return [Math.min(position, node.children.length - 1)];
  },
};
