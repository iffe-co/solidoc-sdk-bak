import { NamedNodeProperty, TextProperty, JsonProperty } from '../src/Property';
import { ont } from '../config/ontology'
import { config, turtle } from '../config/test'
import * as assert from 'power-assert';

import * as n3 from 'n3';
const parser = new n3.Parser();

const node = config.text[8]
const page = config.page

const quads: any[] = parser.parse(turtle.text[8]);

describe('Type: a NamedNode Property', () => {
  let type: NamedNodeProperty;

  const deleteClause = `DELETE WHERE { GRAPH <${page.id}> { <${node.id}> <${ont.rdf.type}> ?o } };\n`;
  const insertClause = `INSERT DATA { GRAPH <${page.id}> { <${node.id}> <${ont.rdf.type}> <${ont.sdoc.paragraph}>} };\n`;

  beforeEach(() => {
    type = new NamedNodeProperty(ont.rdf.type, 'type');
    type.fromQuad(quads[0]);
  });

  it('parses quad as a named node', () => {
    assert.strictEqual(type.get(), node.type);
  });

  it('generates null sparql for a new property', () => {
    const sparql: string = type.getSparqlForUpdate(page.id, node.id);
    assert.strictEqual(sparql, '');
  });

  it('generate sparql for updated property', () => {
    type.set(ont.sdoc.paragraph);
    const sparql: string = type.getSparqlForUpdate(page.id, node.id);
    assert.strictEqual(sparql, deleteClause + insertClause);
  });

  it('generate sparql for deleted property', () => {
    type.set('');
    const sparql: string = type.getSparqlForUpdate(page.id, node.id);
    assert.strictEqual(sparql, deleteClause);
  });

  it('generate sparql for a just-set property', () => {
    type.set('');
    type.commit()
    type.set(ont.sdoc.paragraph);
    const sparql: string = type.getSparqlForUpdate(page.id, node.id);
    assert.strictEqual(sparql, insertClause);
  });

  it('commits correctly', () => {
    type.set(ont.sdoc.paragraph);
    type.commit();
    assert.strictEqual(type.get(), ont.sdoc.paragraph);
  });

  it('undoes correctly', () => {
    type.set(ont.sdoc.paragraph);
    type.undo();
    assert.strictEqual(type.get(), node.type);
  });
});

describe('Text Property', () => {
  let text: TextProperty;

  const deleteClause = `DELETE WHERE { GRAPH <${page.id}> { <${node.id}> <${ont.sdoc.text}> ?o } };\n`;
  const insertClause = `INSERT DATA { GRAPH <${page.id}> { <${node.id}> <${ont.sdoc.text}> "Hello world!"} };\n`;

  beforeEach(() => {
    text = new TextProperty(ont.sdoc.text, 'text');
    text.fromQuad(quads[1]);
  });

  it('parses quad as text', () => {
    assert.strictEqual(text.value, node.text);
  });

  it('generates sparql for update', async () => {
    text.set('Hello world!');
    const sparql: string = text.getSparqlForUpdate(page.id, node.id);
    assert.strictEqual(sparql, deleteClause + insertClause);
  });

  it('generates sparql for deletion only', async () => {
    text.set('');
    const sparql: string = text.getSparqlForUpdate(page.id, node.id);
    assert.strictEqual(sparql, deleteClause);
  });

  it('generates sparql for insertion only', async () => {
    text.set('');
    text.commit();
    text.set('Hello world!');
    const sparql: string = text.getSparqlForUpdate(page.id, node.id);
    assert.strictEqual(sparql, insertClause);
  });
});

describe('Json Property', () => {
  let option: JsonProperty;

  let insertClause = `INSERT DATA { GRAPH <${page.id}> { <${node.id}> <${ont.sdoc.option}> "{\\"name\\":\\"alice\\"}"} };\n`;

  beforeEach(() => {
    option = new JsonProperty(ont.sdoc.option, 'option');
  });

  it('before init', () => {
    assert.strictEqual(option.value, '{}')
  });

  it('gets sparql after set from null', () => {
    option.set({ name: 'alice' })
    const sparql: string = option.getSparqlForUpdate(page.id, node.id);
    assert.strictEqual(sparql, insertClause);
  });

  describe('after init', () => {
    beforeEach(() => {
      insertClause = `INSERT DATA { GRAPH <${page.id}> { <${node.id}> <${ont.sdoc.option}> "{\\"bold\\":true,\\"size\\":25}"} };\n`;
      option.fromQuad(quads[2]);
    })

    it('parses quad as json', () => {
      assert.deepStrictEqual(option.json, { bold: true });
      const sparql: string = option.getSparqlForUpdate(page.id, node.id);
      assert.strictEqual(sparql, '');
    });

    it('gets sparql after reseting a property', () => {
      option.set({ bold: false })
      assert.deepStrictEqual(JSON.parse(option.get()), { bold: false })
    });
  })
});
