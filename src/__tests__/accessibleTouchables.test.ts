import * as fs from 'fs';
import * as path from 'path';

/**
 * Every pressable element must say what it is to a screen reader. Without accessibilityRole
 * it is read as plain text, or not at all, and cannot be found as a button.
 *
 * The opening tag is found by counting braces, not by stopping at the first ">": an inline
 * `onPress={() => ...}` has one, and a naive scan read that as the end of the tag.
 */
const TOUCHABLE = /<(TouchableOpacity|Pressable|TouchableWithoutFeedback|TouchableHighlight)\b/g;

function openingTag(source: string, start: number): string {
  let depth = 0;
  for (let i = start; i < source.length; i++) {
    const ch = source[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === '>' && depth === 0) return source.slice(start, i + 1);
  }
  return source.slice(start);
}

function uiFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === '__tests__' ? [] : uiFiles(full);
    return /\.tsx$/.test(e.name) ? [full] : [];
  });
}

describe('accesibilitate', () => {
  test('fiecare element apăsabil are un rol pentru cititorul de ecran', () => {
    const root = path.join(__dirname, '..', '..');
    const files = [...uiFiles(path.join(root, 'src')), path.join(root, 'App.tsx')];
    const missing = files.flatMap((file) => {
      const source = fs.readFileSync(file, 'utf8');
      return [...source.matchAll(TOUCHABLE)]
        .filter((m) => !/accessibilityRole|accessible=\{false\}/.test(openingTag(source, m.index!)))
        .map((m) => `${path.relative(root, file)}:${source.slice(0, m.index).split('\n').length}`);
    });

    expect(missing).toEqual([]);
  });
});
