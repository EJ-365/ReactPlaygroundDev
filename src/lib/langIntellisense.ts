import * as monaco from 'monaco-editor'

type Item = { label: string; kind: 'keyword' | 'function' | 'snippet'; detail?: string; insert?: string }

const KIND = {
  keyword: monaco.languages.CompletionItemKind.Keyword,
  function: monaco.languages.CompletionItemKind.Function,
  snippet: monaco.languages.CompletionItemKind.Snippet,
} as const

const kw = (label: string): Item => ({ label, kind: 'keyword' })
const fn = (label: string, detail?: string): Item => ({ label, kind: 'function', detail })
const snip = (label: string, insert: string, detail?: string): Item => ({ label, kind: 'snippet', insert, detail })

const LISTS: Record<string, Item[]> = {
  python: [
    ...['and', 'as', 'assert', 'async', 'await', 'break', 'case', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'match', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'].map(kw),
    ...['print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'bool', 'open', 'input', 'enumerate', 'zip', 'map', 'filter', 'sum', 'min', 'max', 'abs', 'round', 'sorted', 'reversed', 'type', 'isinstance', 'any', 'all', 'repr', 'format', 'iter', 'next', 'ord', 'chr', 'hex', 'bin', 'pow', 'getattr', 'setattr', 'hasattr'].map((name) => fn(name, 'builtin')),
    snip('def', 'def ${1:name}(${2:args}):\n    ${0:pass}', 'function definition'),
    snip('class', 'class ${1:Name}:\n    def __init__(self${2}):\n        ${0:pass}', 'class definition'),
    snip('for', 'for ${1:item} in ${2:items}:\n    ${0:pass}', 'for loop'),
    snip('if', 'if ${1:condition}:\n    ${0:pass}', 'if statement'),
    snip('main', 'if __name__ == "__main__":\n    ${0:main()}', 'entry-point guard'),
    snip('try', 'try:\n    ${1:pass}\nexcept ${2:Exception} as e:\n    ${0:print(e)}', 'try/except'),
    snip('with', 'with ${1:open(path)} as ${2:f}:\n    ${0:pass}', 'with block'),
    snip('lambda', 'lambda ${1:x}: ${0:x}', 'lambda'),
    snip('from', 'from ${1:module} import ${0:name}', 'from-import'),
    snip('defm', 'def ${1:name}(self${2}):\n    ${0:pass}', 'method'),
    snip('async', 'async def ${1:name}(${2}):\n    ${0:pass}', 'async function'),
    snip('doc', '"""${0:docstring}"""', 'docstring'),
  ],
  cpp: [
    ...['alignas', 'auto', 'bool', 'break', 'case', 'catch', 'char', 'class', 'const', 'constexpr', 'continue', 'decltype', 'default', 'delete', 'do', 'double', 'else', 'enum', 'explicit', 'export', 'extern', 'false', 'float', 'for', 'friend', 'goto', 'if', 'inline', 'int', 'long', 'mutable', 'namespace', 'new', 'noexcept', 'nullptr', 'override', 'private', 'protected', 'public', 'return', 'short', 'signed', 'sizeof', 'static', 'static_assert', 'struct', 'switch', 'template', 'this', 'throw', 'true', 'try', 'typedef', 'typename', 'union', 'unsigned', 'using', 'virtual', 'void', 'volatile', 'while'].map(kw),
    ...['std::cout', 'std::cin', 'std::endl', 'std::string', 'std::vector', 'std::map', 'std::set', 'std::make_unique', 'std::make_shared', 'printf', 'scanf'].map((name) => fn(name, 'std/io')),
    snip('main', 'int main() {\n    ${0}\n    return 0;\n}', 'main function'),
    snip('inc', '#include <${1:iostream}>', '#include'),
    snip('for', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ++${1:i}) {\n    ${0}\n}', 'for loop'),
    snip('forr', 'for (const auto& ${1:item} : ${2:items}) {\n    ${0}\n}', 'range-for'),
    snip('class', 'class ${1:Name} {\npublic:\n    ${1:Name}() = default;\n    ${0}\n};', 'class'),
    snip('cout', 'std::cout << ${1:value} << std::endl;', 'print'),
    snip('if', 'if (${1:condition}) {\n    ${0}\n}', 'if'),
    snip('while', 'while (${1:condition}) {\n    ${0}\n}', 'while'),
    snip('fn', '${1:int} ${2:name}(${3}) {\n    ${0}\n}', 'function'),
    snip('try', 'try {\n    ${1}\n} catch (const std::exception& e) {\n    ${0}\n}', 'try/catch'),
  ],
  java: [
    ...['abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public', 'record', 'return', 'sealed', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'var', 'void', 'volatile', 'while'].map(kw),
    ...['System.out.println', 'System.out.print', 'String', 'Math', 'Objects', 'Optional', 'List', 'Map', 'ArrayList', 'HashMap', 'Stream', 'StringBuilder', 'Integer', 'Boolean', 'Double'].map((name) => fn(name, 'java')),
    snip('main', 'public static void main(String[] args) {\n    ${0}\n}', 'main method'),
    snip('sout', 'System.out.println(${0});', 'println'),
    snip('class', 'public class ${1:Name} {\n    ${0}\n}', 'class'),
    snip('for', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${0}\n}', 'for loop'),
    snip('fore', 'for (${1:String} ${2:item} : ${3:items}) {\n    ${0}\n}', 'enhanced for'),
    snip('if', 'if (${1:condition}) {\n    ${0}\n}', 'if'),
    snip('try', 'try {\n    ${1}\n} catch (${2:Exception} e) {\n    ${0}\n}', 'try/catch'),
    snip('fn', 'public ${1:void} ${2:name}(${3}) {\n    ${0}\n}', 'method'),
    snip('ctor', 'public ${1:Name}(${2}) {\n    ${0}\n}', 'constructor'),
  ],
  csharp: [
    ...['abstract', 'as', 'async', 'await', 'base', 'bool', 'break', 'case', 'catch', 'char', 'checked', 'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else', 'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for', 'foreach', 'goto', 'if', 'implicit', 'in', 'init', 'int', 'interface', 'internal', 'is', 'lock', 'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params', 'private', 'protected', 'public', 'readonly', 'record', 'ref', 'return', 'sbyte', 'sealed', 'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'var', 'virtual', 'void', 'volatile', 'while'].map(kw),
    ...['Console.WriteLine', 'Console.Write', 'Console.ReadLine', 'Math', 'Task', 'List', 'Dictionary', 'Enumerable', 'StringBuilder', 'DateTime'].map((name) => fn(name, 'System')),
    snip('cw', 'Console.WriteLine(${0});', 'WriteLine'),
    snip('class', 'public class ${1:Name} {\n    ${0}\n}', 'class'),
    snip('foreach', 'foreach (var ${1:item} in ${2:items}) {\n    ${0}\n}', 'foreach'),
    snip('for', 'for (int ${1:i} = 0; ${1:i} < ${2:n}; ${1:i}++) {\n    ${0}\n}', 'for loop'),
    snip('if', 'if (${1:condition}) {\n    ${0}\n}', 'if'),
    snip('prop', 'public ${1:string} ${2:Name} { get; set; }', 'property'),
    snip('try', 'try {\n    ${1}\n} catch (${2:Exception} e) {\n    ${0}\n}', 'try/catch'),
    snip('fn', 'public ${1:void} ${2:Name}(${3}) {\n    ${0}\n}', 'method'),
  ],
  go: [
    ...['break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else', 'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface', 'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var'].map(kw),
    ...['fmt.Println', 'fmt.Printf', 'fmt.Sprintf', 'fmt.Errorf', 'len', 'cap', 'append', 'make', 'new', 'copy', 'delete', 'panic', 'recover', 'print', 'println', 'nil', 'true', 'false', 'iota', 'error', 'string', 'int', 'rune', 'byte'].map((name) => fn(name)),
    snip('main', 'package main\n\nimport "fmt"\n\nfunc main() {\n    ${0}\n}', 'package + main'),
    snip('func', 'func ${1:name}(${2}) ${3} {\n    ${0}\n}', 'function'),
    snip('for', 'for ${1:i} := 0; ${1:i} < ${2:n}; ${1:i}++ {\n    ${0}\n}', 'for loop'),
    snip('forr', 'for ${1:i}, ${2:v} := range ${3:items} {\n    ${0}\n}', 'range loop'),
    snip('if', 'if ${1:condition} {\n    ${0}\n}', 'if'),
    snip('iferr', 'if err != nil {\n    ${0:return err}\n}', 'error check'),
    snip('struct', 'type ${1:Name} struct {\n    ${0}\n}', 'struct'),
    snip('iface', 'type ${1:Name} interface {\n    ${0}\n}', 'interface'),
    snip('meth', 'func (${1:r} ${2:Type}) ${3:Name}(${4}) ${5} {\n    ${0}\n}', 'method'),
  ],
  rust: [
    ...['as', 'async', 'await', 'box', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while'].map(kw),
    ...['println!', 'print!', 'eprintln!', 'format!', 'vec!', 'panic!', 'assert!', 'assert_eq!', 'dbg!', 'todo!', 'unimplemented!', 'Some', 'None', 'Ok', 'Err', 'String', 'Vec', 'Option', 'Result', 'HashMap', 'Box'].map((name) => fn(name)),
    snip('main', 'fn main() {\n    ${0}\n}', 'main function'),
    snip('fn', 'fn ${1:name}(${2}) -> ${3} {\n    ${0}\n}', 'function'),
    snip('pln', 'println!("${0}");', 'println!'),
    snip('for', 'for ${1:item} in ${2:items} {\n    ${0}\n}', 'for loop'),
    snip('if', 'if ${1:condition} {\n    ${0}\n}', 'if'),
    snip('match', 'match ${1:value} {\n    ${2:pattern} => ${3},\n    _ => ${0},\n}', 'match'),
    snip('struct', 'struct ${1:Name} {\n    ${0}\n}', 'struct'),
    snip('impl', 'impl ${1:Name} {\n    ${0}\n}', 'impl block'),
    snip('test', '#[test]\nfn ${1:name}() {\n    ${0}\n}', 'test'),
    snip('letm', 'let mut ${1:name} = ${0:value};', 'mutable binding'),
  ],
}

export function registerLanguageIntellisense() {
  for (const [language, items] of Object.entries(LISTS)) {
    monaco.languages.registerCompletionItemProvider(language, {
      provideCompletionItems(model, position) {
        const word = model.getWordUntilPosition(position)
        const range = new monaco.Range(position.lineNumber, word.startColumn, position.lineNumber, word.endColumn)
        return {
          suggestions: items.map((item) => ({
            label: item.label,
            kind: KIND[item.kind],
            detail: item.detail,
            insertText: item.insert ?? item.label,
            insertTextRules: item.kind === 'snippet' ? monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet : undefined,
            range,
          })),
        }
      },
    })
  }
}
