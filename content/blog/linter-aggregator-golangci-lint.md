---
# The \\' below is a deliberate CommonMark-escaped apostrophe: without it, Hugo's
# markdownify typographer would curl it into a smart quote in the rendered <h1>,
# mismatching the live page. Known side effect: the literal backslash leaks
# as-is into the RSS/Atom feeds (which skip markdownify) — cosmetic, accepted.
title: "Golang\\'s Linter Aggregator: Golangci-lint"
date: 2022-09-06
type: post
url: "/blog/linter-aggregator-golangci-lint/"
tags: ["Golang", "Linter"]
draft: false
---

{{< notice "note" >}}

**Disclaimer:** I’m not a Golang developer 😄

{{< /notice >}}

![golangci-lint](/images/golangci-lint/main-pic.png "golangci-lint")

# Intro

A few days ago I had something to research regarding linting in Golang. Some says there’s a linter which has stricter checking and a faster process than any common linter like _golint_. It’s _golangci-lint_. Hence, I was curiously looking up some theoretically information of it and having some hands-on practices to see how it works and how to use it.

Golangci-lint is actually a linter aggregator and not a standalone linter. It’s developed to aggregate and run several individual linters in parallel for convenience and performance reasons. It has 98 linters included (at the time of this writing) by referring to this [official page](https://golangci-lint.run/usage/linters/) and we may pick and choose which ones are suitable for our project. Hence, I began to think it would be beneficial for us since we don’t need to download each individual linters and manage their versions ourselves. As it consists of many linters, I think that’s the reason why golangci-lint is considered as more rigorous tool than the standalone linter.

It turned out, the common issues while running linters in sequence can make the process too slow. Fortunately, golangci-lint comes to the rescue, it runs linters in parallel, reuses the Go build cache and caches analysis results for much improved performance on subsequent runs.

While I researched about golangci-lint, I found some claims that it runs faster than other linter aggregator, it’s easy to use, has nice output, flexible because we can enable or disable linters that we need and it has a minimum number of false positives. As of now, I have done some practices on it but I don’t know yet how to measure it for the claim of bringing less false positives.

Here are the differences between typical linter and golangci-linter (linter aggregator):

*   **Typical Linter**

\[**Linter#1** (_80% code parsing and loading + 20% linting_)\] + \[**Linter#2** (_80% code parsing and loading + 20% linting_)\] + **Linter#n** —> _Time_

*   **Golangci-lint**
    
    \[_Code parsing and loading only one time_ + _linting_ + _linting_ + _linting_ + …. + _linting_\] —> Time\*
    

It parses codes only once then it performs analysis with all linters within less time. It directly calls linters and reuses 80% of work by parsing codes only once. This makes golangci-lint so fast.

# Install Golangci-lint

## Local Machine

Golangci-lint provides several options to install it in local machines such as using brew, docker, directly download and install the binary, and even install it from source. Regarding a complete installation guide we may refer to this [link](https://golangci-lint.run/usage/install/#local-installation).

## Github Action

In order to add golangci-lint into our workflow in Github, golang-ci has its own action and we simply add it into the workflow and make some modifications to fit our needs in the project. It shouldn’t be complicated to use. Visit [here](https://github.com/marketplace/actions/run-golangci-lint) for more information.

{{< notice "note" >}}

For both installation type, it’s advised to periodically update the version of golangci-lint as the project is under active and is constantly being improved.

{{< /notice >}}

# Findings

## Configurations

I tried to use golangci-lint in my personal repo [here](https://github.com/fauzislami/test-go) and added it to the github workflow to see what it can do and how it works. My first impression was quite impressed because of its quick process while inspecting the codes with many linters at once and it also enabled us to have control with how golangci-lint will behave and what kind of linters it would call during the test by defining custom configurations in a file which could be in several format like below:

*   .golangci.yml
*   .golangci.yaml
*   .golangci.toml
*   .golangci.json

We may specify the configuration file in YAML, TOML or JSON format but it’s recommended to stick with YAML format since that’s what is being on the official documentation pages. Even though we may also configure it with putting some arguments in CLI way but configuring golangci-lint for a project is best done through a configuration file because we’ll be able to configure specific linter options which is not possible via command-line options. Keep in mind that some linters perform similar functions, hence, we need to enable linters deliberately to avoid redundant entries. The configuration example looks like the following:

```
linters-settings:
  errcheck:
    check-type-assertions: true
  goconst:
    min-len: 2
    min-occurrences: 3
  gocritic:
    enabled-tags:
      - diagnostic
      - experimental
      - opinionated
      - performance
      - style
  govet:
    check-shadowing: true
    enable:
      - fieldalignment
  nolintlint:
    require-explanation: true
    require-specific: true

linters:
  disable-all: true
  enable:
    - bodyclose
    - deadcode
    - depguard
    - dogsled
    - dupl
    - errcheck
    - exportloopref
    - exhaustive
    - goconst
    - gocritic
    - gofmt
    - goimports
    - gomnd
    - gocyclo
    - gosec
    - gosimple
    - govet
    - ineffassign
    - misspell
    - nolintlint
    - nakedret
    - prealloc
    - predeclared
    - revive
    - staticcheck
    - structcheck
    - stylecheck
    - thelper
    - tparallel
    - typecheck
    - unconvert
    - unparam
    - varcheck
    - whitespace
    - wsl

run:
  issues-exit-code: 1

```

## Suppressing Linting Errors

### Disable All Linters For Certain Code

Sometimes there will be some errors found by certain linters unnecessarily but we don’t actually have to fix as long as it has no negative impact to the application, we are aware the tradeoff (if any) and we can assure what thing should be false positive and what thing should be the real problem. Let’s take a look at the code snippet below:

![1](/images/golangci-lint/1.png "1")

![2](/images/golangci-lint/2.png "2")

The pictures above will be noticed by a linter in golangci-lint and produces the following errors:

![3](/images/golangci-lint/3.png "3")

It’s gosimple, a linter that specializes in simplifying a code. It’s encouraging the use of simpler syntax by using !err instead of having comparison operator to do the same thing. If we consider this as unnecessary error, we can ignore the error by adding a nolint directive on the necessary line like the following:

![4](/images/golangci-lint/4.png "4")

![5](/images/golangci-lint/5.png "5")

And it will result no error:

![6](/images/golangci-lint/6.png "6")

{{< notice "note" >}}

By Go convention, machine-readable comments should have no spaces, so use **//nolint** instead of **// nolint**

{{< /notice >}}

### Disable Some Linters For Certain Code

The usage of nolint causes all the linting issues detected for that line to be disabled or ignored. We can also disable the issues from a specific linter by specifying its name in the directive (recommended). This allows issues raised on that line by other linters to come through. For instance:

This will disable gosec only for that line

![7](/images/golangci-lint/7.png "7")

This will disable multiple linters like gosec,gosimple,govet and errcheck only for that line

![8](/images/golangci-lint/8.png "8")

### Disable Some Linters For Certain Code Block

We can also exclude potential errors for a block of code (such as a function), by using a nolint directive at the beginner of the block.

This will prevent golangci-lint pick this block of code to be tested by its linters

![9](/images/golangci-lint/9.png "9")

We’re also able to exclude a whole certain file to be skipped from linting by using nolint directive at the top of the file

![10](/images/golangci-lint/10.png "10")

## Annotations in Pull Request (Github Action)

This is how annotations look in my personal repo:

![11](/images/golangci-lint/11.png "11")

They look like an advisor to give some advices how to prevent potential bug in the future. It only appeared in Files Changed tab, though I thought it would be appeared in Conversation as well. Overall, it looks good and almost covers all I imaged before.

## False Positives

Since golangci-lint consists of so many linters. Therefore, it’s potentially raise something we call False Positives. Almost every linter has each own configuration and that could be a cause for false positive. Hence, it’s recommended to check and make sure we configure it well. We can minimize the false positive by configuring and using the linter we’re using correctly, such as excluding/skipping some linters for certain files. One of several ways we can refer to is the usage of nolint directive on some particular codes that we feel there’s nothing to do with it. We may go to this link to see about False Positives that potentially will happen in golangci-lint.

Thanks for visiting! Hope this will be helpful! 😁

References:

*   [https://golangci-lint.run/usage/](https://golangci-lint.run/usage/)
*   [https://freshman.tech/linting-golang/](https://freshman.tech/linting-golang/)
