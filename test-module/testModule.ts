#!/usr/bin/env node
import path from 'path';
import fs from 'fs-extra';
import program from 'commander';
// @ts-ignore
import yarnalist from 'yurnalist';
import rewriteModule from '@module-suite/rewrite';
import { version as appVersion } from './package.json';
import { PackageJson } from '../shared/models/packageJson';
import getAllProdDependencies from '../shared/utils/packageJson/getAllProdDependencies';

const report = yarnalist.createReporter({
  useMessageSymbols: true,
  nonInteractive: !!process.env.CI,
});

// Give error reports some padding
const reportError = report.error;
report.error = (...args: Array<string>) => {
  console.log();
  reportError.apply(report, args);
  console.log();
};

export default async function rewrite(rootPath: string, pkg: PackageJson, spinner: any) {
  const { module: pkgModule, name, version } = pkg;
  spinner.tick(`Testing ${name}`);

  if (typeof pkgModule !== 'string') {
    const err = new Error(
      `[${name}] must have a ESM file specified as the "module" field in your package.json.
      Read more here: https://github.com/stereobooster/package.json#module`
    );
    report.error(err);
    throw err;
  }
  spinner.tick('✔ Module field specified');

  const moduleFile = path.join(rootPath, pkgModule);
  if ((await fs.pathExists(moduleFile)) === false) {
    const err = new Error(
      `[${name}] unable to find module file at ${moduleFile}
      Is this is correct path and did you run a build?`
    );
    report.error(err);
    throw err;
  }

  const dependencies = getAllProdDependencies(pkg);
  const code = await fs.readFile(moduleFile, 'utf8');

  const { warnings } = await rewriteModule(code, {
    host: 'http://localhost:3000',
    packageName: name,
    packageVersion: version,
    currentFile: pkgModule,
    dependencies,
    shouldMinify: false,
    output: 'source',
    transforms: new Set(['nodeenv', 'imports', 'deadcode']),
  });

  spinner.tick('✔ DONE');
  return {
    name,
    warnings,
  };
}

// When running as a process from shell
if (require.main === module) {
  const cwd = process.cwd();

  program
    .version(appVersion)
    .arguments('[packagePaths...]')
    .action((packagePaths: Array<string>) => {
      // Default to current directory if none is supplied
      if (packagePaths.length === 0) packagePaths = ['.'];
      const spinnerSet = report.activitySet(packagePaths.length - 1, packagePaths.length);

      const promises = packagePaths.map(async (dir, index) => {
        const pkgPath = path.join(cwd, dir);
        const spinner = spinnerSet.spinners[index];

        spinner.tick(`Fetching packages.json for ${pkgPath}`);
        const pkg = await fs.readJson(path.join(pkgPath, 'package.json'));
        spinner.setPrefix(pkg.name);

        return rewrite(pkgPath, pkg, spinner);
      });

      Promise.all(promises)
        .then((results) => {
          // End all spinners
          spinnerSet.end();
          // Bit of padding
          console.log();
          console.log();

          results.forEach(({ name, warnings }) => {
            if (warnings.length > 0) {
              report.warn(`Warnings encountered for ${name}`);
              report.log('====================');
              warnings.forEach((msg) => {
                report.log(msg);
              });
              report.log('====================');
            }

            report.success(`🔥  ${name} is Microfrontend ready!`);
            console.log();
          });
        })
        .catch((err) => {
          // End all spinners
          spinnerSet.end();
          report.error(err);
          // Exit with code 1 for errors
          process.exit(1);
        });
    });

  program.parse(process.argv);
}
