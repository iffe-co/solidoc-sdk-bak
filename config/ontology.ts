const uriToKey = {
  'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'type',
  'http://www.solidoc.net/ontologies#nextNode': 'next',
  'http://www.solidoc.net/ontologies#option': 'option'
};

const keyToUri = {};

Object.keys(uriToKey).forEach(uri => {
  let key = uriToKey[uri];
  keyToUri[key] = uri
});

