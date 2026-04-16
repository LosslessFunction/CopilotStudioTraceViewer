type YamlValue = string | number | boolean | null | YamlObject | YamlArray;
type YamlObject = { [key: string]: YamlValue };
type YamlArray = YamlValue[];

function isBlockScalar(val: string): boolean {
  return /^\|[+-]?$/.test(val) || /^>[+-]?$/.test(val);
}

export function parseYamlValue(s: string): YamlValue {
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (s === 'null' || s === '~') return null;
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  if (/^-?\d+\.\d+$/.test(s)) return parseFloat(s);
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

export function parseYaml(text: string): Record<string, YamlValue> {
  const lines = text.split('\n');
  const root: YamlObject = {};
  const stack: Array<{ obj: YamlValue; indent: number }> = [{ obj: root, indent: -1 }];

  function currentObj(): YamlValue { return stack[stack.length - 1].obj; }
  function currentIndent(): number { return stack[stack.length - 1].indent; }

  function consumeBlockScalar(startIdx: number, blockIndent: number): { str: string; nextIdx: number } {
    let str = '';
    let j = startIdx;
    while (j < lines.length) {
      const nr = lines[j];
      const nt = nr.trimEnd();
      if (nt === '') { str += '\n'; j++; continue; }
      if (nr.search(/\S/) <= blockIndent) break;
      if (str) str += '\n';
      str += nt.trimStart();
      j++;
    }
    return { str, nextIdx: j };
  }

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    const trimmed = raw.trimEnd();
    i++;

    if (trimmed === '' || trimmed.trimStart().startsWith('#')) continue;

    const indent = raw.search(/\S/);
    while (stack.length > 1 && indent <= currentIndent()) stack.pop();

    const content = trimmed.trimStart();

    if (content.startsWith('- ')) {
      const parent = currentObj();
      if (!Array.isArray(parent)) continue;
      const itemContent = content.substring(2).trimStart();
      if (itemContent.includes(': ')) {
        const obj: YamlObject = {};
        const colonIdx = itemContent.indexOf(': ');
        const k = itemContent.substring(0, colonIdx).trim();
        const v = itemContent.substring(colonIdx + 2).trim();
        obj[k] = parseYamlValue(v);
        (parent as YamlArray).push(obj);
        stack.push({ obj: obj, indent: indent + 2 });
      } else if (itemContent.startsWith('{') || itemContent === '') {
        const obj: YamlObject = {};
        (parent as YamlArray).push(obj);
        stack.push({ obj: obj, indent: indent + 2 });
      } else {
        (parent as YamlArray).push(parseYamlValue(itemContent));
      }
      continue;
    }

    const colonMatch = content.match(/^([^:]+?):\s*(.*)/);
    if (colonMatch) {
      const key = colonMatch[1].trim();
      const val = colonMatch[2].trim();
      const target = currentObj();

      if (Array.isArray(target)) {
        const lastItem = (target as YamlArray)[(target as YamlArray).length - 1];
        if (lastItem && typeof lastItem === 'object' && !Array.isArray(lastItem)) {
          const lastObj = lastItem as YamlObject;
          if (isBlockScalar(val)) {
            const bs = consumeBlockScalar(i, indent);
            lastObj[key] = bs.str;
            i = bs.nextIdx;
          } else if (val === '') {
            const nextLine = i < lines.length ? lines[i] : '';
            const nextContent = nextLine.trimStart();
            if (nextContent.startsWith('- ')) {
              const arr: YamlArray = [];
              lastObj[key] = arr;
              stack.push({ obj: arr, indent });
            } else {
              const obj: YamlObject = {};
              lastObj[key] = obj;
              stack.push({ obj: obj, indent });
            }
          } else {
            lastObj[key] = parseYamlValue(val);
          }
          continue;
        }
        continue;
      }

      if (typeof target !== 'object' || Array.isArray(target)) continue;
      const targetObj = target as YamlObject;

      if (isBlockScalar(val)) {
        const bs = consumeBlockScalar(i, indent);
        targetObj[key] = bs.str;
        i = bs.nextIdx;
      } else if (val === '') {
        const nextLine = i < lines.length ? lines[i] : '';
        const nextContent = nextLine.trimStart();
        if (nextContent.startsWith('- ')) {
          const arr: YamlArray = [];
          targetObj[key] = arr;
          stack.push({ obj: arr, indent });
        } else {
          const obj: YamlObject = {};
          targetObj[key] = obj;
          stack.push({ obj: obj, indent });
        }
      } else {
        targetObj[key] = parseYamlValue(val);
      }
    }
  }

  return root;
}
