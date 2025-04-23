// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma')
    ],
    files: [{ pattern: 'src/**/*.spec.ts', type: 'js' }],
    exclude: ['karma.conf.js'],
    client: {
      jasmine: {
        random: false,
      },
      clearContext: false
    },
    coveraageIstanbulReporter: {
      dir: require('path').join(__dirname, './coverage/idea-wall-ui'),
      reports: ['html', 'lcovonly', 'text-summary', 'cobertura'],
      'report-config': {
        cobertura: {
          file: 'cobertura.xml'
        }
      },
      fixWebpackSourcePaths: true
    },
    jasmineHtmlReporter: {
      suppressAll: true
    },
    coverageReporter: {
      dir: require('path').join(__dirname, './coverage/idea-wall-ui'),
      subdir: '.',
      reporters: [
        { type: 'lcov' },
        { type: 'text-summary' }
      ]
    },
    reporters: ['progress', 'coverage', 'kjhtml'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['ChromeHeadlessNoSandbox'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--disable-gpu', '--no-sandbox']
      }
    },
    singleRun: true,
    restartOnFileChange: true,
    captureTimeout: 600000,
    browserDisconnectTimeout: 600000,
    browserDisconnectTolerance: 1,
    browserNoActivityTimeout: 600000
  });
}; 