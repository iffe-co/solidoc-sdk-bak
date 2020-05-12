import { ont, idToLabel } from './ontology';

export const config: any = {
  page: {
    id: 'http://example.org/alice',
  },
  para: [{}, {}, {}],
  text: [{}, {}, {}, {}, {}, {}, {}, {}, {}],
};

for (let i = 0; i < 9; i++) {
  config.text[i] = {
    id: config.page.id + '#t' + i,
    type: idToLabel[ont.sdoc.leaf],
    text: 'text ' + i,
    bold: true,
  };
}

for (let i = 0; i < 3; i++) {
  config.para[i] = {
    id: config.page.id + '#p' + i,
    type: idToLabel[ont.sdoc.paragraph],
    children: [
      config.text[i * 3],
      config.text[i * 3 + 1],
      config.text[i * 3 + 2],
    ],
  };
}

config.page = {
  ...config.page,
  type: idToLabel[ont.sdoc.root],
  title: 'Homepage',
  modified: new Date(0),
  children: [config.para[0], config.para[1], config.para[2]],
};

export const turtle: any = {
  page: '',
  para: ['', '', ''],
  text: ['', '', '', '', '', '', '', '', ''],
};

turtle.page = `<${config.page.id}> a <${ont.sdoc.root}>;
  <${ont.dct.modified}> "1970-01-01T00:00:00.000Z"^^<http://www.w3.org/2001/XMLSchema#dateTime>;
  <${ont.dct.title}> "${config.page.title}";
  <${ont.sdoc.firstChild}> <${config.para[0].id}>.`;

turtle.para[0] = `<${config.para[0].id}> a <${ont.sdoc.paragraph}>;
  <${ont.sdoc.next}> <${config.para[1].id}>;
  <${ont.sdoc.firstChild}> <${config.text[0].id}>.`;

turtle.para[1] = `<${config.para[1].id}> a <${ont.sdoc.paragraph}>;
  <${ont.sdoc.next}> <${config.para[2].id}>;
  <${ont.sdoc.firstChild}> <${config.text[3].id}>.`;

turtle.para[2] = `<${config.para[2].id}> a <${ont.sdoc.paragraph}>;
  <${ont.sdoc.firstChild}> <${config.text[6].id}>.`;

for (let i = 0; i < 9; i++) {
  turtle.text[i] = `<${config.text[i].id}> a <${ont.sdoc.leaf}>;`;
  if (i % 3 !== 2) {
    turtle.text[i] += `  <${ont.sdoc.next}> <${config.text[i + 1].id}>;`;
  }
  turtle.text[i] += `  <${ont.sdoc.text}> '${config.text[i].text}';`;
  turtle.text[i] += `  <${ont.sdoc.bold}> true.`;
}
