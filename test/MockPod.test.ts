const $rdf = require('rdflib');

const init = (turtle: string, baseURI: string) => {
  const kb = $rdf.graph();

  $rdf.parse(turtle, kb, baseURI);

  return kb;
};

const transform = (sparql: string): string => {
  let start = sparql.indexOf('{');
  let end = sparql.indexOf('{', start + 1);
  sparql = sparql.substring(0, start) + sparql.substring(end);

  end = sparql.lastIndexOf('}');
  start = sparql.lastIndexOf('}', end - 1);
  sparql = sparql.substring(0, start) + sparql.substring(end);

  if (sparql.startsWith('DELETE')) {
    let start = sparql.indexOf('{');
    let end = sparql.lastIndexOf('}');
    let substring = sparql.substring(start, end + 1);
    sparql = `DELETE ${substring} WHERE ${substring};`;
  }
  return sparql;
};

export const updatePod = (
  turtle: string,
  sparqlAll: string,
  baseURI: string,
): string => {
  const temp = console.log;
  console.log = () => {};

  const kb = init(turtle, baseURI);
  const target = kb.sym(baseURI);

  sparqlAll.split('\n').forEach(sparql => {
    sparql = transform(sparql);
    const patchObject = $rdf.sparqlUpdateParser(sparql, kb, baseURI);
    kb.applyPatch(patchObject, target, (msg: string) => {
      if (msg) {
        throw new Error(msg);
      }
    });
  });

  console.log = temp;

  // obtain result
  return $rdf.serialize(target, kb, baseURI);
};
