import babel from 'rollup-plugin-babel';
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: 'src/openModal.js',
    output: [
      {
        file: 'dist/openModal.js',
        format: 'iife',
        sourcemap: false,
      },
    ],
    plugins: [
      babel(), 
      terser()
    ],
  },
];