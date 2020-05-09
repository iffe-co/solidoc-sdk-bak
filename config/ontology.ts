import { Node } from '../src/interface';

const ont = {
  rdf: {
    type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  },
  dct: {
    title: 'http://purl.org/dc/terms/title',
  },
  xsd: {
    anyURI: 'http://www.w3.org/2001/XMLSchema#anyURI',
    string: 'http://www.w3.org/2001/XMLSchema#string',
    boolean: 'http://www.w3.org/2001/XMLSchema#boolean',
    integer: 'http://www.w3.org/2001/XMLSchema#integer',
    float: 'http://www.w3.org/2001/XMLSchema#float',
    date: 'http://www.w3.org/2001/XMLSchema#date',
    dateTime: 'http://www.w3.org/2001/XMLSchema#dateTime',
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
    bold: 'http://www.solidoc.net/ontologies#bold',
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
  ont.sdoc.bold,
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
  bold: 'http://www.solidoc.net/ontologies#bold',
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
  'http://www.solidoc.net/ontologies#bold': 'bold',
};

const predIdToRange = {
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': ont.xsd.anyURI,
  'http://purl.org/dc/terms/title': ont.xsd.string,
  'http://www.solidoc.net/ontologies#firstChild': ont.xsd.anyURI,
  'http://www.solidoc.net/ontologies#nextNode': ont.xsd.anyURI,
  'http://www.solidoc.net/ontologies#text': ont.xsd.string,
  'http://www.solidoc.net/ontologies#checked': ont.xsd.boolean,
  'http://www.solidoc.net/ontologies#language': ont.xsd.string, // TODO: better be enum
  'http://www.solidoc.net/ontologies#formula': ont.xsd.string,
  'http://www.solidoc.net/ontologies#hintState': ont.xsd.string,
  'http://www.solidoc.net/ontologies#bold': ont.xsd.boolean,
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
