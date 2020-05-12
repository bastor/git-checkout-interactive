#!/usr/bin/env node

const { promisify } = require("util");
const exec = promisify(require("child_process").exec);
const prompts = require("prompts");
const matchSorter = require("match-sorter").default;

async function run() {
  const { stdout: branches } = await exec(
    "git branch -v --sort=-committerdate"
  );

  const choices = branches
    .split(/\n/)
    .filter((branch) => !!branch.trim())
    .map((branch) => {
      const [, flag, value ] = branch.match(/([* ]) +([^ ]+) +(.+)/);
      return { value, disabled: flag === "*" };
    });

  const suggestByValue = (input, choices) =>
    Promise.resolve(
      choices.filter(
        (i) => matchSorter([{ ...i }], input, { keys: ["value"] }).length > 0
      )
    );

  const { branch } = await prompts({
    type: "autocomplete",
    name: "branch",
    suggest: suggestByValue,
    message: "Switch branch",
    fallback: "Branch not found",
    choices,
  });

  await checkout(branch);
}

async function checkout(branch) {
  if (!branch) return;
  const { stdout, stderr } = await exec(`git checkout ${branch}`);
  process.stdout.write(stdout);
  process.stderr.write(stderr);
}

function onError(e) {
  if (e.stderr) {
    process.stderr.write(e.stderr);
  } else {
    console.error(e);
  }
}

run().catch(onError);
