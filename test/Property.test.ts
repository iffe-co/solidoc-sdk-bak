import { TextProperty, NamedNodeProperty, JsonProperty } from '../src/Property';
import * as n3 from 'n3';
import * as assert from 'power-assert';

const parser = new n3.Parser();

describe('Named Node Property', () => {
  let prop: NamedNodeProperty;
  const turtle = '<http://example.org/alice> a <http://xmlns.com/foaf/0.1/Person> .';
  const quads: any[] = parser.parse(turtle);

  const deleteClause = 'WITH <http://example.org/test> DELETE WHERE { <http://example.org/alice> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ?o };\n';
  const insertClause = 'INSERT DATA { GRAPH <http://example.org/test> { <http://example.org/alice> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://xmlns.com/foaf/0.1/homepage>} };\n';

  beforeEach(() => {
    prop = new NamedNodeProperty('http://www.w3.org/1999/02/22-rdf-syntax-ns#type', 'type');
  });
  it('parses quad as a named node', () => {
    prop.fromQuad(quads[0]);
    assert.strictEqual(prop.get(), 'http://xmlns.com/foaf/0.1/Person');
  });
  it('generates null sparql for a new property', () => {
    const sparql: string = prop.getSparqlForUpdate('http://example.org/test', 'http://example.org/alice');
    assert.strictEqual(sparql, '');
  });
  it('generate sparql for updated property', () => {
    prop.fromQuad(quads[0]);
    prop.set('http://xmlns.com/foaf/0.1/homepage');

    const sparql: string = prop.getSparqlForUpdate('http://example.org/test', 'http://example.org/alice');
    assert.strictEqual(sparql, deleteClause + insertClause);
  });
  it('generate sparql for deleted property', () => {
    prop.fromQuad(quads[0]);
    prop.set('');

    const sparql: string = prop.getSparqlForUpdate('http://example.org/test', 'http://example.org/alice');
    assert.strictEqual(sparql, deleteClause);
  });
  it('generate sparql for a just-set property', () => {
    prop.set('http://xmlns.com/foaf/0.1/homepage');

    const sparql: string = prop.getSparqlForUpdate('http://example.org/test', 'http://example.org/alice');
    assert.strictEqual(sparql, insertClause);
  });
  it('commits correctly', () => {
    prop.fromQuad(quads[0]);
    prop.set('http://xmlns.com/foaf/0.1/homepage');
    prop.commit();
    assert.strictEqual(prop.get(), 'http://xmlns.com/foaf/0.1/homepage');
  });
  it('undoes correctly', () => {
    prop.fromQuad(quads[0]);
    prop.set('http://xmlns.com/foaf/0.1/homepage');
    prop.undo();
    assert.strictEqual(prop.get(), 'http://xmlns.com/foaf/0.1/Person');

  });
});

describe('Text Property', () => {
  let prop: TextProperty;
  const turtle = `<http://example.org/alice> <http://www.solidoc.net/ontologies#option> "{\\"name\\":\\"alice\\"}" .`;
  const quads: any[] = parser.parse(turtle);

  const deleteClause = `WITH <http://example.org/test> DELETE WHERE { <http://example.org/alice> <http://www.solidoc.net/ontologies#option> ?o };\n`;
  const insertClause = `INSERT DATA { GRAPH <http://example.org/test> { <http://example.org/alice> <http://www.solidoc.net/ontologies#option> "{\\"name\\":\\"alice\\",\\"age\\":25}"} };\n`;

  beforeEach(() => {
    prop = new TextProperty('http://www.solidoc.net/ontologies#option', 'option');
  });

  it('parses quad as text', () => {
    prop.fromQuad(quads[0]);
    assert.strictEqual(prop.value, '{"name":"alice"}');
  });

  it('generates sparql for update', async () => {
    prop.fromQuad(quads[0]);
    prop.set('{"name":"alice","age":25}');
    const sparql: string = prop.getSparqlForUpdate('http://example.org/test', 'http://example.org/alice');
    assert.strictEqual(sparql, deleteClause + insertClause);
  });

  it('generates sparql for deletion only', async () => {
    prop.fromQuad(quads[0]);
    prop.set('');
    const sparql: string = prop.getSparqlForUpdate('http://example.org/test', 'http://example.org/alice');
    assert.strictEqual(sparql, deleteClause);
  });

  it('generates sparql for insertion only', async () => {
    prop.fromQuad(quads[0]);
    prop.set('');
    prop.commit();
    prop.set('{"name":"alice","age":25}');
    const sparql: string = prop.getSparqlForUpdate('http://example.org/test', 'http://example.org/alice');
    assert.strictEqual(sparql, insertClause);
  });
});

describe('Json Property', () => {
  let prop: JsonProperty;
  const turtle = `<http://example.org/alice> <http://www.solidoc.net/ontologies#option> "{\\"name\\":\\"alice\\"}" .`;
  const quads: any[] = parser.parse(turtle);

  const deleteClause = `WITH <http://example.org/test> DELETE WHERE { <http://example.org/alice> <http://www.solidoc.net/ontologies#option> ?o };\n`;
  const insertClause = `INSERT DATA { GRAPH <http://example.org/test> { <http://example.org/alice> <http://www.solidoc.net/ontologies#option> "{\\"name\\":\\"alice\\"}"} };\n`;

  beforeEach(() => {
    prop = new JsonProperty('http://www.solidoc.net/ontologies#option', 'option');
  });

  it('initial value', () => {
    assert.strictEqual(prop.value, '{}')
    let sparql = prop.getSparqlForUpdate('http://example.org/test', 'http://example.org/alice')
    assert.strictEqual(sparql, '');
  });

  it('parses quad as json', () => {
    prop.fromQuad(quads[0]);
    assert.deepStrictEqual(prop.options, { name: 'alice' });
    let sparql = prop.getSparqlForUpdate('http://example.org/test', 'http://example.org/alice')
    assert.strictEqual(sparql, '');
  });

  it('gets sparql after set from null', () => {
    prop.set({ name: 'alice' })
    let sparql = prop.getSparqlForUpdate('http://example.org/test', 'http://example.org/alice')
    assert.strictEqual(sparql, insertClause);
  });

  it('gets sparql after adding a property', () => {
    prop.fromQuad(quads[0]);
    prop.set({ age: 25 })
    let sparql = prop.getSparqlForUpdate('http://example.org/test', 'http://example.org/alice')
    let insertClause = `INSERT DATA { GRAPH <http://example.org/test> { <http://example.org/alice> <http://www.solidoc.net/ontologies#option> "{\\"name\\":\\"alice\\",\\"age\\":25}"} };\n`;
    assert.strictEqual(sparql, deleteClause + insertClause);
  });

  it('gets sparql after removing a property', () => {
    prop.fromQuad(quads[0]);
    prop.set({ name: null })
    let sparql = prop.getSparqlForUpdate('http://example.org/test', 'http://example.org/alice')
    let insertClause = `INSERT DATA { GRAPH <http://example.org/test> { <http://example.org/alice> <http://www.solidoc.net/ontologies#option> "{}"} };\n`;
    assert.strictEqual(sparql, deleteClause + insertClause);
  });

  it('gets sparql after reseting a property', () => {
    prop.fromQuad(quads[0]);
    prop.set({ name: 'Alice' })
    let sparql = prop.getSparqlForUpdate('http://example.org/test', 'http://example.org/alice')
    let insertClause = `INSERT DATA { GRAPH <http://example.org/test> { <http://example.org/alice> <http://www.solidoc.net/ontologies#option> "{\\"name\\":\\"Alice\\"}"} };\n`;
    assert.strictEqual(sparql, deleteClause + insertClause);
  });
});
