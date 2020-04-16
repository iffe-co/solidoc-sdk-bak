const uriToKey = {
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'type',
  'http://purl.org/dc/terms/title': 'title',
  'http://www.solidoc.net/ontologies#firstChild': 'firstChild',
  'http://www.solidoc.net/ontologies#nextNode': 'next',
  'http://www.solidoc.net/ontologies#option': 'option',
  'http://www.solidoc.net/ontologies#text': 'text'
};

const keyToUri = {};

Object.keys(uriToKey).forEach(uri => {
  let key = uriToKey[uri];
  keyToUri[key] = uri
});

export { keyToUri, uriToKey }