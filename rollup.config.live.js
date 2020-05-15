import babel from 'rollup-plugin-babel';

export default [
  {
    input: 'src/openModal.js',
    output: [
      {
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