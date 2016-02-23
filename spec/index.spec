# Overview

<p>This document extensivly describes the conversion specification by enumerating conversion patterns. All sections are generated automatically from <a href="https://github.com/okaxaki/objc2swift/tree/master/spec">Test Spec</a> of Objc2Swift.js.</p>
<p>Each section consists of a Objective-C code fragment and its corresponding Swift code like following.</p>

## Example Pattern

```
@interface MyClass
- (void)hello;
@end

@implementation MyClass
- (void)hello{
    NSLog(@"Hello the Swift World!");
}
@end
```

```
class MyClass {
    func hello() {
        NSLog("Hello the Swift World!")
    }
}
```

<p class="node">Note that NSLog() is not converted into print() by default because they are not equivalent.</p>