/* eslint-disable flowtype/require-valid-file-annotation, no-console, import/extensions */
// import nodeResolve from 'rollup-plugin-node-resolve';
import replace from 'rollup-plugin-replace';
// import commonjs from 'rollup-plugin-commonjs';
import inject from 'rollup-plugin-inject';
import typescript from 'rollup-plugin-typescript2';
// import babel from 'rollup-plugin-babel';
// import json from 'rollup-plugin-json';
import uglify from 'rollup-plugin-uglify';
import visualizer from 'rollup-plugin-visualizer';
import pkg from './package.json';

const processShim = '\0process-shim';

const prod = process.env.PRODUCTION;
const esbundle = process.env.ESBUNDLE;

let output;
if (prod) {
  console.log('Creating production UMD bundle...');
  output = [{ file: 'dist/redux-api-middleware.min.js', format: 'umd' }];
} else if (esbundle) {
  console.log('Creating ES modules bundle...');
  output = [{ file: 'dist/redux-api-middleware.es.js', format: 'es' }];
} else {
  console.log('Creating development UMD bundle');
  output = [{ file: 'dist/redux-api-middleware.js', format: 'umd' }];
}

const plugins = [
  // Unlike Webpack and Browserify, Rollup doesn't automatically shim Node
  // builtins like `process`. This ad-hoc plugin creates a 'virtual module'
  // which includes a shim containing just the parts the bundle needs.
  {
    resolveId(importee) {
      if (importee === processShim) return importee;
      return null;
    },
    load(id) {
      if (id === processShim) return 'export default { argv: [], env: {} }';
      return null;
    },
  },
  // json(),
  // nodeResolve(),
  // commonjs({
  //   ignoreGlobal: true,
  // }),
  prod &&
    replace({
      'process.env.NODE_ENV': JSON.stringify(
        prod ? 'production' : 'development',
      ),
    }),
  prod &&
    inject({
      process: processShim,
    }),
  typescript(),
  // babel({
  //   babelrc: false,
  //   presets: [['env', { modules: false, loose: true }]],
  //   plugins: [
  //     'external-helpers',
  //     'transform-object-rest-spread',
  //     'transform-class-properties',
  //   ].filter(Boolean),
  // }),
].filter(Boolean);

if (prod)
  plugins.push(uglify(), visualizer({ filename: './bundle-stats.html' }));

export default {
  input: 'src/index.ts',
  name: 'redux-api-middleware',
  external: ['redux'].concat(esbundle ? Object.keys(pkg.dependencies) : []),
  exports: 'named',
  output,
  plugins,
  // globals: { react: 'React' },
};
