import babel from 'rollup-plugin-babel';
import { terser } from "rollup-plugin-terser";
import license_comment from './license_comment.js';

export default [
  {
    input: 'src/openModal.js',
    output: [
      {
        banner: license_comment,
        file: 'dist/openModal.js',
        format: 'iife',
        sourcemap: false,
      },
    ],
    plugins: [
      babel(), 
      terser({
      })
    ],
  },
];