# Class and Category

## Basic Class Definition

```
@interface Foo
@property int bar;
-(void)method;
@end

@implementation Foo 
-(void)method {
    // do something
}
@end
```

```
class Foo { 
    var bar:Int

    func method() {
        // do something
    }
}
```

## Inheritance

```
@interface Foo : Bar
@end

@implementation Foo
// ...
@end
```

```
class Foo : Bar {
// ...
}
```

## Anonymous Category

<p>Properties declared in interface or anonymous category are converted into instance variables of a single class together.</p>
<p>Properties from the anonymous category are treated as private.</p>

```
@interface Foo
@property int bar;
@end

@interface Foo ()
@property int baz;
@end

@implementation Foo 
@end
```

```
class Foo { 
    var bar:Int
    private var baz:Int
}
```


