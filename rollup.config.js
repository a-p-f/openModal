import babel from 'rollup-plugin-babel';
import { terser } from "rollup-plugin-terser";

const plugins = [
  babel({
    exclude: 'node_modules/**' // only transpile our source code
  }),
  terser(),
];
export default [
  {
    input: 'src/openModal.js',
    output: {
      file: 'dist/openModal.js',
      format: 'iife',
    },
    plugins,
  },
  {
    input: 'src/modalUtils.js',
    output: {
      file: 'dist/modalUtils.js',
      format: 'iife',
    },
    plugins,
  },
];