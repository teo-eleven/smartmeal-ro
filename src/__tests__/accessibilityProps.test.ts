import fs from 'fs';
import path from 'path';

/**
 * react-native-web 0.21 no longer reads accessibilityState: a ticked box was announced as
 * unticked on the web (axe, T.11). The aria-* props work on the web and on the phones alike.
 */
const SRC = path.join(__dirname, '..');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
    return /\.tsx$/.test(entry.name) ? [full] : [];
  });
}
// App.tsx sits beside src, and holds the top bar's view switch.
const FILES = [...sourceFiles(SRC), path.join(SRC, '..', 'App.tsx')].map((file) => ({
  name: path.relative(SRC, file),
  source: fs.readFileSync(file, 'utf8'),
}));

test('no component uses accessibilityState, which the web drops', () => {
  const users = FILES.filter((file) => file.source.includes('accessibilityState=')).map(
    (file) => file.name
  );
  expect(users).toEqual([]);
});

// expo-image's `alt` reaches only the placeholder on the web; accessibilityLabel reaches the
// photo itself as its alt attribute.
test('every photo says what it is, or accessibilityLabel="" when it only decorates', () => {
  const photosWithoutAlt = FILES.filter((file) => file.source.includes("from 'expo-image'"))
    .flatMap((file) =>
      [...file.source.matchAll(/<Image\b([^>]*)\/>/g)].map((tag) => ({ file, props: tag[1] }))
    )
    .filter(({ props }) => !/\baccessibilityLabel=/.test(props))
    .map(({ file }) => file.name);
  expect(photosWithoutAlt).toEqual([]);
});

// On the web accessibilityViewIsModal becomes aria-modal, which is only valid on a dialog;
// without the role a screen reader is told "modal" about nothing it can name.
test('every view marked modal is announced as a dialog', () => {
  const modalsWithoutRole = FILES.flatMap((file) =>
    [...file.source.matchAll(/<(?:Animated\.)?View\b([^>]*accessibilityViewIsModal[^>]*)>/g)]
      .filter((tag) => !/\brole="(dialog|alertdialog)"/.test(tag[1]))
      .map(() => file.name)
  );
  expect(modalsWithoutRole).toEqual([]);
});
