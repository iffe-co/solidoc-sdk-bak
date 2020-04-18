import { ont } from './ontology'

export const config: any = {
  page: {
    uri: 'http://example.org/alice',
  },
  para: [{}, {}, {}],
  text: [
    {}, {}, {},
    {}, {}, {},
    {}, {}, {},
  ],
}

for (let i = 0; i < 9; i++) {
  config.text[i].id = 't' + i
  config.text[i].uri = config.page.uri + '#' + config.text[i].id
  config.text[i].type = ont.sdoc.leaf
  config.text[i].json = {
    id: config.text[i].id,
    type: ont.sdoc.leaf,
    text: 'text ' + i,
    bold: true
  }
}

for (let i = 0; i < 3; i++) {
  config.para[i].id = 'p' + i
  config.para[i].uri = config.page.uri + '#' + config.para[i].id
  config.para[i].type = ont.sdoc.paragraph
  config.para[i].json = {
    id: config.para[i].id,
    type: ont.sdoc.paragraph,
    children: [
      config.text[i * 3].json,
      config.text[i * 3 + 1].json,
      config.text[i * 3 + 2].json,
    ]
  }
}

config.page = {
  ...config.page,
  id: config.page.uri,
  type: ont.sdoc.root,
  json: {
    id: config.page.uri,
    type: ont.sdoc.root,
    title: 'Homepage',
    children: [
      config.para[0].json,
      config.para[1].json,
      config.para[2].json,
    ]
  }
}

config.page.turtle = `<${config.page.uri}> a <${ont.sdoc.root}>;
  <${ont.dct.title}> "${config.page.json.title}";
  <${ont.sdoc.firstChild}> <${config.para[0].uri}>.`


config.text[8].turtle = `<${config.text[8].uri}> a <${ont.sdoc.leaf}>;
  <${ont.sdoc.text}> '${config.text[8].json.text}';
  <${ont.sdoc.option}> '{"bold":true}'.`
