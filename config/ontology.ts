import { myNode as Node } from '../src/interface';

const ont = {
  rdf: {
    type: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
  },
  dct: {
    title: 'http://purl.org/dc/terms/title',
    modified: 'http://purl.org/dc/terms/modified',
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
    link: 'http://www.solidoc.net/ontologies#link',
    // subjects
    Root: 'http://www.solidoc.net/ontologies#Root',
    Leaf: 'http://www.solidoc.net/ontologies#Leaf',
    Heading1: 'http://www.solidoc.net/ontologies#Heading1',
    Heading2: 'http://www.solidoc.net/ontologies#Heading2',
    Heading3: 'http://www.solidoc.net/ontologies#Heading3',
    NumberedList: 'http://www.solidoc.net/ontologies#NumberedList',
    NumberedSubList: 'http://www.solidoc.net/ontologies#NumberedSubList',
    NumberedRow: 'http://www.solidoc.net/ontologies#NumberedRow',
    BulletedList: 'http://www.solidoc.net/ontologies#BulletedList',
    BulletedSubList: 'http://www.solidoc.net/ontologies#BulletedSubList',
    BulletedRow: 'http://www.solidoc.net/ontologies#BulletedRow',
    TaskList: 'http://www.solidoc.net/ontologies#TaskList',
    TaskSubList: 'http://www.solidoc.net/ontologies#TaskSubList',
    TaskRow: 'http://www.solidoc.net/ontologies#TaskRow',
    Quote: 'http://www.solidoc.net/ontologies#Quote',
    Pre: 'http://www.solidoc.net/ontologies#Pre',
    PreRow: 'http://www.solidoc.net/ontologies#PreRow',
    Paragraph: 'http://www.solidoc.net/ontologies#Paragraph',
    Divider: 'http://www.solidoc.net/ontologies#Divider',
    Hint: 'http://www.solidoc.net/ontologies#Hint',
    Image: 'http://www.solidoc.net/ontologies#Image',
    Video: 'http://www.solidoc.net/ontologies#Video',
    File: 'http://www.solidoc.net/ontologies#File',
    MathEquation: 'http://www.solidoc.net/ontologies#MathEquation',
    Page: 'http://www.solidoc.net/ontologies#Page',
    Table: 'http://www.solidoc.net/ontologies#Table',
    TableRow: 'http://www.solidoc.net/ontologies#TableRow',
    TableCell: 'http://www.solidoc.net/ontologies#Cell',
  },
};

const sdocAllPreds = [
  ont.rdf.type,
  ont.dct.title,
  ont.dct.modified,
  ont.sdoc.firstChild,
  ont.sdoc.next,
  ont.sdoc.text,
  ont.sdoc.checked,
  ont.sdoc.language,
  ont.sdoc.formula,
  ont.sdoc.hintState,
  ont.sdoc.bold,
  ont.sdoc.link,
];

const labelToId = (label: string): string => {
  if (ont.sdoc[label]) return ont.sdoc[label];
  if (ont.rdf[label]) return ont.rdf[label];
  if (ont.xsd[label]) return ont.xsd[label];
  if (ont.dct[label]) return ont.dct[label];
  throw new Error('Cannot find id for: ' + label);
};

const idToLabel = (id: string): string => {
  let begin = id.lastIndexOf('#') + 1 || id.lastIndexOf('/') + 1;
  return id.substr(begin);
};

const predIdToRange = {
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': ont.xsd.anyURI,
  'http://purl.org/dc/terms/title': ont.xsd.string,
  'http://purl.org/dc/terms/modified': ont.xsd.dateTime,
  'http://www.solidoc.net/ontologies#firstChild': ont.xsd.anyURI,
  'http://www.solidoc.net/ontologies#nextNode': ont.xsd.anyURI,
  'http://www.solidoc.net/ontologies#text': ont.xsd.string,
  'http://www.solidoc.net/ontologies#checked': ont.xsd.boolean,
  'http://www.solidoc.net/ontologies#language': ont.xsd.string, // TODO: better be enum
  'http://www.solidoc.net/ontologies#formula': ont.xsd.string,
  'http://www.solidoc.net/ontologies#hintState': ont.xsd.string,
  'http://www.solidoc.net/ontologies#bold': ont.xsd.boolean,
  'http://www.solidoc.net/ontologies#link': ont.xsd.anyURI,
};

// TODO: use pred.default
const defaultJson = (id: string, type: string): Node => {
  switch (labelToId(type)) {
    case ont.sdoc.Root:
      return {
        id: id,
        type: type,
        title: '',
        modified: 0,
        children: [],
      };
    case ont.sdoc.Leaf:
      return {
        id: id,
        type: type,
        text: '',
      };
    case ont.sdoc.TaskList:
      return {
        id: id,
        type: type,
        checked: false,
        children: [],
      };
    case ont.sdoc.MathEquation:
      return {
        id: id,
        type: type,
        formula: '',
        children: [],
      };
    case ont.sdoc.Pre:
      return {
        id: id,
        type: type,
        language: '',
        children: [],
      };
    case ont.sdoc.Hint:
      return {
        id: id,
        type: type,
        hitState: '',
        children: [],
      };
    case ont.sdoc.Page:
      return {
        id: id,
        type: type,
        link: undefined,
        children: [],
      };
    default:
      return {
        id: id,
        type: type,
        children: [],
      };
  }
};

export { ont, idToLabel, predIdToRange, sdocAllPreds, labelToId, defaultJson };
