const path = require('path')
const webpack = require('webpack')
const HTMLPlugin = require('mini-html-webpack-plugin')
const ProgressBarPlugin = require('progress-bar-webpack-plugin')
const chalk = require('chalk')
const mdPlugins = [
  require('remark-images'),
  require('remark-unwrap-images'),
  require('remark-emoji'),
  require('remark-slug'),
  require('remark-autolink-headings'),
]

const babel = {
  presets: [
    'babel-preset-env',
    'babel-preset-stage-0',
    'babel-preset-react',
  ].map(require.resolve)
}

const rules = [
  {
    test: /\.js$/,
    exclude: /node_modules/,
    loader: require.resolve('babel-loader'),
    options: babel
  },
  {
    test: /\.js$/,
    exclude: path.resolve(__dirname, '../node_modules'),
    include: [
      path.resolve(__dirname, '..'),
      path.resolve(__dirname, '../src'),
    ],
    loader: require.resolve('babel-loader'),
    options: babel
  },
  {
    test: /\.mdx?$/,
    exclude: /node_modules/,
    use: [
      {
        loader: require.resolve('babel-loader'),
        options: babel
      },
      {
        loader: require.resolve('@mdx-js/loader'),
        options: {
          mdPlugins
        }
      }
    ]
  }
]

const template = ({
  title = 'ok',
  js,
  publicPath
}) => `<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8'>
<meta name='viewport' content='width=device-width,initial-scale=1'>
<style>*{box-sizing:border-box}body{font-family:system-ui,sans-serif;margin:0}</style>
<title>${title}</title>
</head>
<body>
<div id=root></div>
${HTMLPlugin.generateJSReferences(js, publicPath)}
</body>
</html>
`

const baseConfig = {
  stats: 'errors-only',
  mode: 'development',
  module: {
    rules
  },
  resolve: {
    modules: [
      path.relative(process.cwd(), path.join(__dirname, '../node_modules')),
      'node_modules'
    ]
  },
  plugins: [
    new ProgressBarPlugin({
      width: '24',
      complete: '█',
      incomplete: chalk.gray('░'),
      format: [
        chalk.magenta('[ok] :bar'),
        chalk.magenta(':percent'),
        chalk.gray(':elapseds :msg'),
      ].join(' '),
      summary: false,
      customSummary: () => {},
    })
  ]
}

const createConfig = (opts = {}) => {
  baseConfig.context = opts.dirname

  baseConfig.resolve.modules.push(
    opts.dirname,
    path.join(opts.dirname, 'node_modules')
  )

  baseConfig.entry = [
    path.join(__dirname, '../src/entry.js')
  ]

  const defs = Object.assign({}, {
    OPTIONS: JSON.stringify(opts),
    DIRNAME: JSON.stringify(opts.dirname),
    HOT_PORT: JSON.stringify(opts.hotPort)
  })

  baseConfig.plugins.push(
    new webpack.DefinePlugin(defs),
    new HTMLPlugin({ template, context: opts })
  )

  const config = typeof opts.config === 'function'
    ? opts.config(baseConfig)
    : baseConfig

  if (config.resolve.alias) {
    const hotAlias = config.resolve.alias['webpack-hot-client/client']
    if (!fs.existsSync(hotAlias)) {
      const hotPath = path.dirname(require.resolve('webpack-hot-client/client'))
      config.resolve.alias['webpack-hot-client/client'] = hotPath
    }
  }

  return config
}

module.exports = createConfig