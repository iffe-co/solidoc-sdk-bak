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
    options: 'http://www.solidoc.net/ontologies#options',
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

const subjTypeToPredArray = {
  'http://www.solidoc.net/ontologies#Root': [
    ont.rdf.type,
    ont.dct.title,
    ont.sdoc.firstChild,
    ont.sdoc.options,
  ],
  'http://www.solidoc.net/ontologies#Leaf': [
    ont.rdf.type,
    ont.sdoc.text,
    ont.sdoc.next,
    ont.sdoc.options,
  ],
  'http://www.solidoc.net/ontologies#Heading1': [
    ont.rdf.type,
    ont.sdoc.firstChild,
    ont.sdoc.next,
    ont.sdoc.options,
  ],
  'http://www.solidoc.net/ontologies#Heading2': [
    ont.rdf.type,
    ont.sdoc.firstChild,
    ont.sdoc.next,
    ont.sdoc.options,
  ],
  'http://www.solidoc.net/ontologies#Heading3': [
    ont.rdf.type,
    ont.sdoc.firstChild,
    ont.sdoc.next,
    ont.sdoc.options,
  ],
  'http://www.solidoc.net/ontologies#Paragraph': [
    ont.rdf.type,
    ont.sdoc.firstChild,
    ont.sdoc.next,
    ont.sdoc.options,
  ],
  'http://www.solidoc.net/ontologies#NumberedList': [
    ont.rdf.type,
    ont.sdoc.firstChild,
    ont.sdoc.next,
    ont.sdoc.options,
  ],
  'http://www.solidoc.net/ontologies#BulletedList': [
    ont.rdf.type,
    ont.sdoc.firstChild,
    ont.sdoc.next,
    ont.sdoc.options,
  ],
  'http://www.solidoc.net/ontologies#TaskList': [
    ont.rdf.type,
    ont.sdoc.firstChild,
    ont.sdoc.next,
    ont.sdoc.options,
    ont.sdoc.checked,
  ],
  'http://www.solidoc.net/ontologies#MathEquation': [
    ont.rdf.type,
    ont.sdoc.firstChild,
    ont.sdoc.next,
    ont.sdoc.options,
    ont.sdoc.formula,
  ],
  'http://www.solidoc.net/ontologies#Pre': [
    ont.rdf.type,
    ont.sdoc.firstChild,
    ont.sdoc.next,
    ont.sdoc.options,
    ont.sdoc.language,
  ],
  'http://www.solidoc.net/ontologies#Quote': [
    ont.rdf.type,
    ont.sdoc.firstChild,
    ont.sdoc.next,
    ont.sdoc.options,
  ],
  'http://www.solidoc.net/ontologies#Hint': [
    ont.rdf.type,
    ont.sdoc.firstChild,
    ont.sdoc.next,
    ont.sdoc.options,
    ont.sdoc.hintState,
  ],
  'http://www.solidoc.net/ontologies#Divider': [
    ont.rdf.type,
    ont.sdoc.firstChild,
    ont.sdoc.next,
    ont.sdoc.options,
  ],
};

const predIdToAlias = {
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'type',
  'http://purl.org/dc/terms/title': 'title',
  'http://www.solidoc.net/ontologies#firstChild': 'firstChild',
  'http://www.solidoc.net/ontologies#nextNode': 'next',
  'http://www.solidoc.net/ontologies#text': 'text',
  'http://www.solidoc.net/ontologies#options': 'options',
  'http://www.solidoc.net/ontologies#checked': 'checked',
  'http://www.solidoc.net/ontologies#language': 'language',
  'http://www.solidoc.net/ontologies#formula': 'formula',
  'http://www.solidoc.net/ontologies#hintState': 'hintState',
};

const predIdToType = {
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'NamedNode',
  'http://purl.org/dc/terms/title': 'Text',
  'http://www.solidoc.net/ontologies#firstChild': 'NamedNode',
  'http://www.solidoc.net/ontologies#nextNode': 'NamedNode',
  'http://www.solidoc.net/ontologies#text': 'Text',
  'http://www.solidoc.net/ontologies#options': 'Json',
  'http://www.solidoc.net/ontologies#checked': 'Boolean',
  'http://www.solidoc.net/ontologies#language': 'Text', // TODO: better be NamedNode
  'http://www.solidoc.net/ontologies#formula': 'Text',
  'http://www.solidoc.net/ontologies#hintState': 'Text',
};

export { ont, predIdToAlias, predIdToType, subjTypeToPredArray };
