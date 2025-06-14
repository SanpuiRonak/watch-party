import { type Config } from 'lint-staged';

const config: Config = {
  // Run ESLint on JS, JSX, TS, and TSX files
  '*.{js,jsx,ts,tsx}': (filenames) => {
    // Use the --file flag to only lint the staged files
    return [`next lint --fix --file ${filenames.join(' --file ')}`, `next lint --file ${filenames.join(' --file ')}`];
  },
};

export default config;