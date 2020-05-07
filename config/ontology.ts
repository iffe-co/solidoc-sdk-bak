import { Node } from '../src/interface';

const ont = {
  rdf: {
    type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  },
  dct: {
    title: 'http://purl.org/dc/terms/title',
  },
  sdoc: {
    // predicates
    firstChild: 'http://www.solidoc.net/ontologies#firstChild',
    next: 'http://www.solidoc.net/ontologies#nextNode',
    text: 'http://www.solidoc.net/ontologies#text',
    checked: 'http://www.solidoc.net/ontologies#checked',
    language: 'http://www.solidoc.net/ontologies#language',
    formula: 'http://www.solidoc.net/ontologies#formula',
    hintState: 'http://www.solidoc.net/ontologies#hintState',
    // subjects
    root: 'http://www.solidoc.net/ontologies#Root',
    leaf: 'http://www.solidoc.net/ontologies#Leaf',
    heading1: 'http://www.solidoc.net/ontologies#Heading1',
    heading2: 'http://www.solidoc.net/ontologies#Heading2',
    heading3: 'http://www.solidoc.net/ontologies#Heading3',
    paragraph: 'http://www.solidoc.net/ontologies#Paragraph',
    numberedList: 'http://www.solidoc.net/ontologies#NumberedList',
    bulletedList: 'http://www.solidoc.net/ontologies#BulletedList',
    taskList: 'http://www.solidoc.net/ontologies#TaskList',
    mathEquation: 'http://www.solidoc.net/ontologies#MathEquation',
    pre: 'http://www.solidoc.net/ontologies#Pre',
    hint: 'http://www.solidoc.net/ontologies#Hint',
    divider: 'http://www.solidoc.net/ontologies#Divider',
  },
};

const subjTypeToPredArray = [
  ont.rdf.type,
  ont.dct.title,
  ont.sdoc.firstChild,
  ont.sdoc.next,
  ont.sdoc.text,
  ont.sdoc.checked,
  ont.sdoc.language,
  ont.sdoc.formula,
  ont.sdoc.hintState,
];

const labelToPredId = {
  type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  title: 'http://purl.org/dc/terms/title',
  firstChild: 'http://www.solidoc.net/ontologies#firstChild',
  next: 'http://www.solidoc.net/ontologies#nextNode',
  text: 'http://www.solidoc.net/ontologies#text',
  checked: 'http://www.solidoc.net/ontologies#checked',
  language: 'http://www.solidoc.net/ontologies#language',
  formula: 'http://www.solidoc.net/ontologies#formula',
  hintState: 'http://www.solidoc.net/ontologies#hintState',
};

const predIdToLabel = {
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'type',
  'http://purl.org/dc/terms/title': 'title',
  'http://www.solidoc.net/ontologies#firstChild': 'firstChild',
  'http://www.solidoc.net/ontologies#nextNode': 'next',
  'http://www.solidoc.net/ontologies#text': 'text',
  'http://www.solidoc.net/ontologies#checked': 'checked',
  'http://www.solidoc.net/ontologies#language': 'language',
  'http://www.solidoc.net/ontologies#formula': 'formula',
  'http://www.solidoc.net/ontologies#hintState': 'hintState',
};

const predIdToRange = {
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'NamedNode',
  'http://purl.org/dc/terms/title': 'Text',
  'http://www.solidoc.net/ontologies#firstChild': 'NamedNode',
  'http://www.solidoc.net/ontologies#nextNode': 'NamedNode',
  'http://www.solidoc.net/ontologies#text': 'Text',
  'http://www.solidoc.net/ontologies#checked': 'Text', // TODO: should be Boolean
  'http://www.solidoc.net/ontologies#language': 'Text', // TODO: better be NamedNode
  'http://www.solidoc.net/ontologies#formula': 'Text',
  'http://www.solidoc.net/ontologies#hintState': 'Text',
};

// TODO: use pred.default
const defaultJson = (id: string, type: string): Node => {
  switch (type) {
    case ont.sdoc.root:
      return {
        id: id,
        type: type,
        title: '',
        children: [],
      };
    case ont.sdoc.leaf:
      return {
        id: id,
        type: type,
        text: '',
      };
    case ont.sdoc.heading1:
    case ont.sdoc.heading2:
    case ont.sdoc.heading3:
    case ont.sdoc.divider:
    case ont.sdoc.paragraph:
    case ont.sdoc.numberedList:
    case ont.sdoc.bulletedList:
      return {
        id: id,
        type: type,
        children: [],
      };
    case ont.sdoc.taskList:
      return {
        id: id,
        type: type,
        checked: false,
        children: [],
      };
    case ont.sdoc.mathEquation:
      return {
        id: id,
        type: type,
        formula: '',
        children: [],
      };
    case ont.sdoc.pre:
      return {
        id: id,
        type: type,
        language: '',
        children: [],
      };
    case ont.sdoc.hint:
      return {
        id: id,
        type: type,
        hitState: '',
        children: [],
      };
    default:
      throw new Error('Unknown type: ' + type);
  }
};

export {
  ont,
  predIdToLabel,
  predIdToRange,
  subjTypeToPredArray,
  labelToPredId,
  defaultJson,
};
