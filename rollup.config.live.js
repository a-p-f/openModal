import babel from 'rollup-plugin-babel';
import license_comment from './license_comment.js';

export default [
  {
    input: 'src/openModal.js',
    output: [
      {
        banner: license_comment,
        file: 'live/openModal.js',
        format: 'iife',
        sourcemap: true,
      },
    ],
    plugins: [
      babel(), 
    ],
  },
];