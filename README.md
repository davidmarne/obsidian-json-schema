# Obsidian Json Schema

An Obsidian plugin to create & leverage [json-schemas](https://json-schema.org/) to enforce consistent note structure across your vault.

## Features

This plugin demonstrates some of the basic functionality the plugin API can do.
- Continuous validation of markdown structure, note properties, and note table of contents against json-schemas
- Commands to create json-schemas from an existing note
- Commands to create notes from a schema definition

## Why?

In my personal vault, I have many templates and classes of notes that follow a similar structure. For example, I have a project note, a song note, a recipe note, etc. Generally most my notes of a given class share a structure but one or two notes do not conform. This lack of consistency can cause dataview queries to miss incorrectly formatted data, search regular expressions to miss incorrectly formatted data, and leads to an inconsistent experience across my notes.

Even worse, sometimes I want to change the structure for a given class of note, and now all the existing notes need to be updated to match the new structure. Currently, it is near impossible for me to locate which notes need to be updated and automating such a task is very difficult.

By providing a static analysis tool that validates the structure of a given note, on can keep their vault consistent and clean.

## Architecture

Obsidian JSON Schema leverages [json-schema](https://json-schema.org/) to define a schematic for your notes' structure. Obsidian JSON Schema works by transforming a note's content into an abstract syntax tree (AST) using [remark](https://github.com/remarkjs/remark) and [mdast](https://github.com/syntax-tree/mdast), then validates the AST using json-schema. 

Put simply, consumers of this plugin write json-schema which validates the AST of given note.

For example, say i have a markdown note:

```markdown
## my cool doc
```

the plugin converts this markdown content to an AST with remark, which outputs:

```json
{
    "type": "root",
    "children": [
        {
            "type": "heading",
            "depth": 2,
            "children": [
                {
                    "type": "text",
                    "value": "my cool doc",
                }
            ]
        }
    ]
}
```

now i can write a json schema to validate that this note starts with a heading 1, which will trigger a validation warning because the input document uses a headding 2 

```json
{
    "type": "object",
    "title": "root node",
    "properties": {
        "type": {
            "const": "root",
            "type": "string"
        },
        "children": {
            "type": "array",
            "items": [
                {
                    "type": "object",
                    "title": "heading node",
                    "properties": {
                        "type": {
                            "const": "heading",
                            "type": "string"
                        },
                        "depth": {
                            "const": 2,
                            "type": "number"
                        },
                        "children": {
                            "type": "array",
                            "items": [
                                {
                                    "type": "object",
                                    "title": "text node",
                                    "properties": {
                                        "type": {
                                            "const": "text",
                                            "type": "string"
                                        },
                                        "value": {
                                            "type": "string"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            ]
        }
    }
}
```


## Adding your plugin to the community plugin list

TODO: This plugin is not currently added to the community plugin list

- Check https://github.com/obsidianmd/obsidian-releases/blob/master/plugin-review.md
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## How to use

This plugin is not currently added to the official obisidian community plugin list. To consume, one must manually clone this repo and add it to their `.obsidian/plugins` directory:

- Clone this repo.
- Make sure your NodeJS is at least v16 (`node --version`).
- `npm i` or `yarn` to install dependencies.
- `npm run dev` to start compilation in watch mode.
- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.
- open obsidian, enable community plugins, and enable this plugin
- add a `$schema`` property to a file name of your choice
- run the `generate schema from current file` obsidian command (or create a json schema file manually)
  - this does a best attempt at generating a schema, the generated json file must be hand edited to make any desired changes.
- add the `$schema`` property to the same file for any notes that require the same schema
- run the `show schema validation errors` command to view any schema errors

## 1.0 Goals
- validation
  - [x] ability to validate markdown structure with json-schema
  - [x] ability to validate properties structure with json-schema
  - [x] view validation errors across all notes
  - [x] status bar shows validation error count
  - [ ] jump to location
  - [ ] human readable paths
- creating notes from a schema
  - [ ] create empty note from schema
  - [ ] leverage `react-json-schema-form` (or something similar) to prompt for inputs/unknowns when creating new notes from a schema
- schema generator 
  - [x] generate json schema from note
  - [ ] option to generate schema for just properties section (rather than the whole markdown file)
  - [ ] option to generate schema for just table of contents (rather than the whole markdown file)
  - [ ] create a way to modify schemas from within obsidian
    - [ ] provide a basic json editor
    - [ ] leverage `jsonschema-editor-react` (or something similar) to provide a user friendly way to edit schemas
- performance
  - [ ] memoize ast generation and schema validation where possible
  - [ ] investigate ways to cache/persist analysis results across sessions so all files do not need to be revalidated at startup
- documentation
  - [x] Create github repo
  - [x] Architecture overview in README
  - [ ] offical documentation with more advanced examples

