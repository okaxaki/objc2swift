# Objc2Swift.js [![npm version](https://badge.fury.io/js/objc2swift.svg)](https://badge.fury.io/js/objc2swift)

Objc2Swift.js is an Objective-C to Swift converter written in JavaScript. ([Live Demo][])

This project is still highly experimenal and does not aim to provide human-less conversion.
However, the most of Objective-C code can be converted to proper Swift code with less compilation errors.

## Features

- Generate good-looking Swift code from Objective-C code.
- Full Objective-C parser which accepts large source code, not for toy-problem.
- Preserve indents and comments in the original Objective-C code.
- Reduce compilation errors with semantics analysis. See the [Document](http://okaxaki.github.io/objc2swift/) for detail.
- Command-line version supports `#import` delective with pre-compiled header cache.

[PEG.js]: http://www.pegjs.org/
[Live Demo]: http://okaxaki.github.io/objc2swift/demo.html

## Install

```sh
$ npm install -g objc2swift
```

Then, run the `objc2swift` command with `--init` option to setup the default configuration.

```sh
$ objc2swift --init ios
```

Note that the parameter `ios` means to setup objc2swift for using Xcode's iOS SDK. If you want to target other SDK, use `osx`, `tvos` or `watchos`.

## Convert

Pass the target source file to the command. The conversion result will be written to the current directory with extension `.swift`. 

```sh
$ objc2swift foo.m
```
The first conversion is very slow since there is no pre-compiled header cache. It will be speed-up later.

By default, the command searches user headers from the current directory and its subdirectories.
To import more headers, use `-I` option can be used to specifiy include paths. For example,

```sh
$ objc2swift -I ~/git/myproject/ foo.m
```
The path specified by `-I` is recursively traversed.

## Configuration

The default config path is `~/.objc2swift/config.json`. A typical content of config.json is like following. 
If you want to add user header search path permanently instead of `-I`, add the path to `includePaths` array.

```
{
    "systemIncludePaths": [
        "${Xcode.app}/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/System/Library/Frameworks",
        "${Xcode.app}/Contents/Developer/Platforms/iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk/usr/include",
        "${Xcode.app}/Contents/Developer/Platforms/iPhoneOS.platform/usr/lib/clang/3.5/include"
    ],
    "includePaths": []
}
```
