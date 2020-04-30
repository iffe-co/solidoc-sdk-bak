import { Property } from '../src/Property';
import { ont } from '../config/ontology';
import { config, turtle } from '../config/test';
import * as assert from 'power-assert';

import * as n3 from 'n3';
const parser = new n3.Parser();

const node = config.text[8];
const page = config.page;

const quads: any[] = parser.parse(turtle.text[8]);

describe('Type: a NamedNode Property', () => {
  let type: Property;

  const deleteClause = `DELETE WHERE { GRAPH <${page.id}> { <${node.id}> <${ont.rdf.type}> ?o } };\n`;
  const insertClause = `INSERT DATA { GRAPH <${page.id}> { <${node.id}> <${ont.rdf.type}> <${ont.sdoc.paragraph}>} };\n`;

  beforeEach(() => {
    type = new Property(ont.rdf.type, 'NamedNode', page.id, node.id);
  });

  it('parses quad as a named node', () => {
    assert.strictEqual(type.fromQuad(quads[0]), node.type);
  });

  it('generates null sparql if no changes applied', () => {
    const sparql: string = type.getSparql(node.type, node.type);
    assert.strictEqual(sparql, '');
  });

  it('generate sparql for updated property', () => {
    const sparql: string = type.getSparql(ont.sdoc.paragraph, node.type);
    assert.strictEqual(sparql, deleteClause + insertClause);
  });

  it('generate sparql for deleted property', () => {
    const sparql: string = type.getSparql('', node.type);
    assert.strictEqual(sparql, deleteClause);
  });

  it('generate sparql for a just-added property', () => {
    const sparql: string = type.getSparql(ont.sdoc.paragraph, '');
    assert.strictEqual(sparql, insertClause);
  });
});

describe('Text Property', () => {
  let text: Property;

  const deleteClause = `DELETE WHERE { GRAPH <${page.id}> { <${node.id}> <${ont.sdoc.text}> ?o } };\n`;
  const insertClause = `INSERT DATA { GRAPH <${page.id}> { <${node.id}> <${ont.sdoc.text}> "Hello world!"} };\n`;

  beforeEach(() => {
    text = new Property(ont.sdoc.text, 'Text', page.id, node.id);
  });

  it('parses quad as text', () => {
    assert.strictEqual(text.fromQuad(quads[1]), node.text);
  });

  it('generates null sparql', async () => {
    const sparql: string = text.getSparql(node.text, node.text);
    assert.strictEqual(sparql, '');
  });

  it('generates sparql for update', async () => {
    const sparql: string = text.getSparql('Hello world!', node.text);
    assert.strictEqual(sparql, deleteClause + insertClause);
  });

  it('generates sparql for deletion only', async () => {
    const sparql: string = text.getSparql('', node.text);
    assert.strictEqual(sparql, deleteClause);
  });

  it('generates sparql for insertion only', async () => {
    const sparql: string = text.getSparql('Hello world!', '');
    assert.strictEqual(sparql, insertClause);
  });
});

describe('Json Property', () => {
  let options: Property;

  let deleteClause = `DELETE WHERE { GRAPH <${page.id}> { <${node.id}> <${ont.sdoc.options}> ?o } };\n`;
  let insertClause = `INSERT DATA { GRAPH <${page.id}> { <${node.id}> <${ont.sdoc.options}> "{\\"name\\":\\"alice\\",\\"age\\":25}"} };\n`;

  beforeEach(() => {
    options = new Property(ont.sdoc.options, 'Json', page.id, node.id);
  });

  it('parses quad as Json', () => {
    const parsed = JSON.parse(options.fromQuad(quads[2]));
    assert.strictEqual(parsed.bold, node.bold);
  });

  it('treats inputs equal in object point of view', () => {
    const sparql: string = options.getSparql(
      '{"name":"alice","age":25}',
      '{"age":25,"name":"alice"}',
    );
    assert.strictEqual(sparql, '');
  });

  it('gets sparql after set from null', () => {
    const sparql: string = options.getSparql('{"name":"alice","age":25}', '{}');
    assert.strictEqual(sparql, insertClause);
  });

  it('gets sparql after deteting', () => {
    const sparql: string = options.getSparql(
      '{}',
      '{ "name": "alice", "age": 25 }',
    );
    assert.strictEqual(sparql, deleteClause);
  });

  it('gets sparql after changing a property', () => {
    const sparql: string = options.getSparql(
      '{"name":"alice","age":25}',
      '{"name":"alice"}',
    );
    assert.strictEqual(sparql, deleteClause + insertClause);
  });
});
