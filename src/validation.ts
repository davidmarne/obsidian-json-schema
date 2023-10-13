
import { TFile, Vault, parseYaml } from 'obsidian';
import Ajv, { ErrorObject } from 'ajv';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import {unified} from 'unified';
import { Root } from 'mdast';
import { SchemaCacheManager } from 'src/SchemaCacheManager';

const ajv = new Ajv();

const compiler = unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm);

export const getMDAST = async (vault: Vault, file: TFile): Promise<Root> => {
    const data = await vault.read(file);
    return compiler.parse(data);
}

export const getPropertiesFromAst = (ast: Root) => {
    const firstNode = ast.children[0];
    if (firstNode['type'] === 'yaml' && 'value' in firstNode) {
        const yaml = parseYaml(firstNode.value)
        return yaml
    }
    
    return null;
}

export const getMarkdownSchemaFileNameFromAst = (path: string, ast: Root): string | null => {
    const props = getPropertiesFromAst(ast);
    const fileName = props['markdown-schema'];
    return fileName !== null ? [path,  fileName].join("/") : null
}

export const getSchemasFromAst = async (schemaCache: SchemaCacheManager, ast: Root, schemasDirectory: string): Promise<object | null> => {
    const path = getMarkdownSchemaFileNameFromAst(schemasDirectory, ast)
    if (path) {
        return await schemaCache.getSchema(path)
    }
    return null;
}

export const validateFile = async (schemaCache: SchemaCacheManager, vault: Vault, file: TFile, schemasDirectory: string)=> {
    const ast = await getMDAST(vault, file);
    const schema = await getSchemasFromAst(schemaCache, ast, schemasDirectory);
    let errors: ErrorObject[] = [];
    if (schema) {
        const validate = ajv.compile(schema);
        validate(ast);
        if (validate.errors) {
            errors.concat(validate.errors)
        }
    }

    return errors;
};

