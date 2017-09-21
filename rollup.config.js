import commonjs from 'rollup-plugin-commonjs';
import node from 'rollup-plugin-node-resolve';

export default {
  input: 'lib/compareJson.js',
  output: {
    file: 'dist/compareJSON.js',
    moduleName: 'compareJSON',
    format: 'iife',
  },
  plugins: [commonjs(), node()]
};
